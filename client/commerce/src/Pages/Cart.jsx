import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, ArrowRight, Check, ShoppingBag, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import CartItem, { formatPrice, toLine } from '../components/CartItem.jsx';
import { fetchCart, updateCartItem, removeFromCart, optimisticQty, optimisticRemove } from '../redux/cartSlice.js';
import { axiosInstance } from '../axiosCalls/axios.js';

/*
  Loom & Jade — Cart ("Your Bag")
  - A champagne-gold hero with a fine gilt lattice carries the title.
  - The pieces run down a cream ledger on the left.
  - The Invoice is a rounded ivory sheet with a gold-foil edge on the right: number,
    dates, a compact scrolling item list, the sums, and the amount due on a gold panel.
    It stays a fixed size however many pieces are in the bag.
*/

const CHECKOUT_PATH = '/checkout';
const FREE_DISPATCH_ABOVE = 5000; // ₹ — adjust to your shipping rules
const DISPATCH_FEE = 199;         // ₹
const DISPATCH_DAYS = 3;          // matches "dispatched within 2–3 business days"

/* Rich burnished gold with a soft sheen, for the shipping pill */
const RICH_GOLD_STYLE = {
    backgroundImage: `
        repeating-linear-gradient(135deg, rgba(90,67,15,0.08) 0px, rgba(90,67,15,0.08) 1px, transparent 1px, transparent 4px),
        linear-gradient(115deg, #D2A93E 0%, #EBCB6B 28%, #FBEBB0 50%, #E2BC55 72%, #BF9530 100%)
    `,
    boxShadow: 'inset 0 1px 0 rgba(255,248,222,0.85), inset 0 -1px 0 rgba(90,67,15,0.35)',
};

/* Muted, dim gold for the amount due */
const DIM_GOLD_STYLE = {
    backgroundImage: `
        repeating-linear-gradient(135deg, rgba(90,67,15,0.06) 0px, rgba(90,67,15,0.06) 1px, transparent 1px, transparent 4px),
        linear-gradient(115deg, #E6D3A0 0%, #EFE0B4 30%, #F5E9C6 50%, #E9D7A6 72%, #DCC68C 100%)
    `,
    boxShadow: 'inset 0 1px 0 rgba(255,250,235,0.7), inset 0 -1px 0 rgba(90,67,15,0.2)',
};

/* Gold-foil panel for the hero arch */
const FOIL_STYLE = {
    backgroundImage: `
        repeating-linear-gradient(135deg, rgba(124,95,26,0.07) 0px, rgba(124,95,26,0.07) 1px, transparent 1px, transparent 4px),
        linear-gradient(135deg, #F7E7B0 0%, #E4C77A 45%, #F2DC9B 100%)
    `,
};

const PLAQUE_STYLE = {
    backgroundColor: '#FBF6EA',
    backgroundImage: `
        repeating-linear-gradient(135deg, rgba(139,107,58,0.05) 0px, rgba(139,107,58,0.05) 1px, transparent 1px, transparent 3px),
        repeating-linear-gradient(45deg, rgba(139,107,58,0.035) 0px, rgba(139,107,58,0.035) 1px, transparent 1px, transparent 3px)
    `,
};

/* ---------- helpers ---------- */

function useGalleryFonts() {
    useEffect(() => {
        const href =
            'https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Bodoni+Moda:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Italiana&family=Pinyon+Script&display=swap';
        if (document.querySelector(`link[href="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }, []);
}

function addBusinessDays(from, days) {
    const d = new Date(from);
    let left = days;
    while (left > 0) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1;
    }
    return d;
}

const fmtIssued = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtShort = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

function CornerBrackets({ color = '#B08D2B' }) {
    const spots = ['top-3 left-3', 'top-3 right-3 rotate-90', 'bottom-3 left-3 -rotate-90', 'bottom-3 right-3 rotate-180'];
    return (
        <>
            {spots.map((pos, i) => (
                <span key={i} className={`absolute ${pos} h-3 w-3 border-t-2 border-l-2 pointer-events-none`} style={{ borderColor: color }} />
            ))}
        </>
    );
}

/* label ........ value, on the invoice */
function InvoiceLine({ label, value, valueClass = '' }) {
    return (
        <div className="flex items-end gap-3">
            <span className="font-['Cormorant_Garamond'] text-base font-semibold text-[#2B2620]">{label}</span>
            <span className="flex-1 mb-1.5 border-b-2 border-dotted border-[#8A6A1D]/60" aria-hidden="true" />
            <span className={`font-['Cinzel'] text-xs font-semibold tracking-[0.08em] text-[#2B2620] ${valueClass}`}>{value}</span>
        </div>
    );
}

function MetaField({ label, children }) {
    return (
        <div>
            <p className="font-['Cinzel'] text-[9px] font-semibold tracking-[0.2em] text-[#5A430F]">{label}</p>
            <p className="font-['Cormorant_Garamond'] text-base font-semibold text-[#2B2620] mt-0.5">{children}</p>
        </div>
    );
}

/* Stable short reference derived from the ids in the bag */
function invoiceNo(lines) {
    const seed = lines.map((l) => String(l.id)).join('');
    const h = seed.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
    return `LJ-${h.toString(36).toUpperCase().padStart(5, '0').slice(0, 5)}`;
}

/* ---------- loader: dots swirl in rings, then gather into a bag ---------- */

const MAROON = '#6B1423';
const GOLD = '#F0B91F'; // golden yellow

const SWIRL_CX = 60;
const SWIRL_CY = 72;
const RING_RADII = [52, 38, 24]; // dots twirl on these concentric circles

const BAG_DOTS = (() => {
    const targets = [];
    const DOT = 3.4; // medium dot radius

    // body: a 7 x 6 lattice. Every row has the same number of evenly spaced dots,
    // and the rows widen toward the base, so the spacing looks even all the way through.
    const COLS = 7;
    const ROWS = 6;
    const TOP_Y = 48;
    const BASE_Y = 118;
    for (let r = 0; r < ROWS; r += 1) {
        const y = TOP_Y + ((BASE_Y - TOP_Y) * r) / (ROWS - 1);
        const left = 24 - (6 * r) / (ROWS - 1);
        const right = 96 + (6 * r) / (ROWS - 1);
        for (let c = 0; c < COLS; c += 1) {
            const x = left + ((right - left) * c) / (COLS - 1);
            const onEdge = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
            targets.push({ x, y, r: DOT, fill: onEdge ? GOLD : MAROON }); // gold frame, maroon inside
        }
    }

    // gold handle: one arch landing on the 2nd and 6th dots of the top row
    const HANDLE_STEPS = 7;
    for (let i = 1; i < HANDLE_STEPS; i += 1) {
        const a = Math.PI + (Math.PI * i) / HANDLE_STEPS;
        targets.push({ x: 60 + 24 * Math.cos(a), y: 48 + 24 * Math.sin(a), r: DOT, fill: GOLD });
    }

    // share the dots between the rings in proportion to circumference;
    // dots far from the centre go to the outer ring so the paths stay short
    const N = targets.length;
    const sumR = RING_RADII.reduce((s, r) => s + r, 0);
    const counts = RING_RADII.map((r) => Math.round((N * r) / sumR));
    counts[counts.length - 1] += N - counts.reduce((s, c) => s + c, 0);

    const byDistance = [...targets].sort(
        (p, q) => Math.hypot(q.x - SWIRL_CX, q.y - SWIRL_CY) - Math.hypot(p.x - SWIRL_CX, p.y - SWIRL_CY)
    );

    const result = [];
    let from = 0;
    RING_RADII.forEach((ring, k) => {
        const group = byDistance
            .slice(from, from + counts[k])
            .sort((p, q) => Math.atan2(p.y - SWIRL_CY, p.x - SWIRL_CX) - Math.atan2(q.y - SWIRL_CY, q.x - SWIRL_CX));
        from += counts[k];
        group.forEach((t, i) => {
            result.push({
                ...t,
                ring,
                theta0: (Math.PI * 2 * i) / group.length,
                omega: 2.0 + k * 0.5,                              // all spin the same way, inner rings a touch faster
                delay: Math.min(1, Math.max(0, (118 - t.y) / 100)), // bag fills from the base up
            });
        });
    });
    return result;
})();

const SWIRL = 2.6;   // seconds of twirling in circles
const GATHER = 1.4;  // dots flow into the bag
const HOLD = 1.6;    // bag holds
const SCATTER = 1.2; // bag dissolves back into the swirl
const CYCLE = SWIRL + GATHER + HOLD + SCATTER;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function formProgress(tm) {
    if (tm < SWIRL) return 0;
    if (tm < SWIRL + GATHER) return (tm - SWIRL) / GATHER;
    if (tm < SWIRL + GATHER + HOLD) return 1;
    return 1 - (tm - SWIRL - GATHER - HOLD) / SCATTER;
}

function orbitPos(d, time) {
    const a = d.theta0 + d.omega * time;
    return [SWIRL_CX + d.ring * Math.cos(a), SWIRL_CY + d.ring * Math.sin(a)];
}

function BagLoader() {
    const dotRefs = useRef([]);

    useEffect(() => {
        const apply = (time, p) => {
            BAG_DOTS.forEach((d, i) => {
                const el = dotRefs.current[i];
                if (!el) return;
                const e = easeInOut(clamp01((p - d.delay * 0.4) / 0.6));
                const [ox, oy] = orbitPos(d, time);
                el.setAttribute('cx', (ox + (d.x - ox) * e).toFixed(2));
                el.setAttribute('cy', (oy + (d.y - oy) * e).toFixed(2));
            });
        };

        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            apply(0, 1);
            return undefined;
        }

        let raf;
        const start = performance.now();
        const tick = (now) => {
            const time = (now - start) / 1000;
            apply(time, formProgress(time % CYCLE));
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-14">
            <svg viewBox="0 0 120 130" className="h-52 w-52" aria-hidden="true">
                {BAG_DOTS.map((d, i) => {
                    const [x, y] = orbitPos(d, 0);
                    return (
                        <circle
                            key={i}
                            ref={(el) => { dotRefs.current[i] = el; }}
                            cx={x.toFixed(2)}
                            cy={y.toFixed(2)}
                            r={d.r}
                            fill={d.fill}
                        />
                    );
                })}
            </svg>
            <p className="mt-5 font-['Cormorant_Garamond'] italic text-xl text-[#6B5D4F]">Loading your cart...</p>
        </div>
    );
}

export function Cart() {
    useGalleryFonts();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { cartItems, fetching, hydrated, error } = useSelector((state) => state.cart);

    const [wishlistCount, setWishlistCount] = useState(0);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const [bagFormed, setBagFormed] = useState(false); // keeps the loader up long enough to see the bag form

    useEffect(() => {
        dispatch(fetchCart());
        const t = setTimeout(() => setBagFormed(true), 5200);
        return () => {
            clearTimeout(t);
            clearTimeout(toastTimer.current);
        };
    }, [dispatch]);

    useEffect(() => {
        axiosInstance
            .get('/wishlist')
            .then((res) => setWishlistCount((res.data?.wishlist ?? []).length))
            .catch(() => setWishlistCount(0));
    }, []);

    function showToast(message) {
        setToast(message);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    }

    // Optimistic: the UI changes instantly, the request runs in the background,
    // and on failure we re-fetch the server's cart to roll back.
    const handleChangeQty = (id, quantity) => {
        if (quantity < 1) return;
        dispatch(optimisticQty({ productId: id, quantity }));
        dispatch(updateCartItem({ productId: id, quantity }))
            .unwrap()
            .catch((err) => {
                showToast(err?.message || 'Could not update your bag');
                dispatch(fetchCart());
            });
    };

    const handleRemove = (id) => {
        dispatch(optimisticRemove(id));
        dispatch(removeFromCart(id))
            .unwrap()
            .catch((err) => {
                showToast(err?.message || 'Could not remove this piece');
                dispatch(fetchCart());
            });
    };

    const handleView = (product) => navigate(`/products/${product._id}`);

    /* ---------- totals ---------- */
    const lines = (cartItems ?? []).map(toLine).filter((l) => l.product);
    const pieces = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce(
        (sum, l) => sum + (typeof l.product.price === 'number' ? l.product.price * l.quantity : 0),
        0
    );
    const freeDispatch = subtotal >= FREE_DISPATCH_ABOVE;
    const dispatchFee = lines.length === 0 || freeDispatch ? 0 : DISPATCH_FEE;
    const total = subtotal + dispatchFee;
    const progress = Math.min(100, Math.round((subtotal / FREE_DISPATCH_ABOVE) * 100));
    const issuedOn = fmtIssued(new Date());
    const dispatchBy = fmtShort(addBusinessDays(new Date(), DISPATCH_DAYS));

    const loading = !bagFormed || !hydrated || (fetching && lines.length === 0);
    const failed = !loading && error && lines.length === 0;
    const empty = !loading && !error && lines.length === 0;

    return (
        <div className="relative bg-[#F3ECDB] min-h-screen [background-image:radial-gradient(#00000009_1px,transparent_1px)] [background-size:24px_24px]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(138, 115, 93, 0.15) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(138, 115, 93, 0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '28px 28px',
                }}
                aria-hidden="true"
            />

            <style>{`
                @keyframes cart-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
                .cart-enter { animation: cart-enter 600ms cubic-bezier(.2,.7,.2,1) both; }
                @media (prefers-reduced-motion: reduce) { .cart-enter { animation: none; } }
            `}</style>

            {toast && (
                <div
                    role="alert"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 border-2 border-[#B08D2B] bg-[#FBF6EA] px-6 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.15em] text-[#6B1423] shadow-[0_10px_24px_-12px_rgba(43,38,32,0.45)]"
                >
                    {toast}
                </div>
            )}

            <div className="relative z-10">
                <Navbar wishlistCount={wishlistCount} />

                <section className="max-w-7xl mx-auto px-6 pt-6 pb-10">
                    <button
                        onClick={() => navigate('/products')}
                        className="inline-flex items-center gap-1.5 font-['Cinzel'] text-[10px] tracking-[0.2em] text-[#6B5D4F] hover:text-[#6B1423] transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        CONTINUE BROWSING
                    </button>

                    {/* ---------- the arch, standing on a tapered gilt rail ---------- */}
                    <header className="relative mt-4 mb-14 flex justify-center">
                        <div className="relative p-[2px] rounded-t-full bg-gradient-to-br from-[#F2DC9B] via-[#B08D2B] to-[#E4C77A] shadow-[0_18px_34px_-16px_rgba(124,95,26,0.6)]">
                            <div
                                className="rounded-t-full px-14 sm:px-24 pt-10 pb-7 text-center"
                                style={FOIL_STYLE}
                            >
                                <div className="mx-auto h-11 w-11 rounded-full bg-gradient-to-br from-[#7A1B2C] to-[#5A0F1C] border-2 border-[#F7E7B0] flex items-center justify-center shadow-[0_4px_10px_-2px_rgba(74,14,24,0.5)]">
                                    <ShoppingBag className="h-5 w-5 text-[#F2DC9B]" strokeWidth={1.5} />
                                </div>
                                <h1 className="mt-3 font-['Italiana'] text-5xl sm:text-6xl tracking-[0.05em] leading-none text-[#4A0E18]">
                                    Your Bag
                                </h1>
                                <div className="mt-3 flex items-center justify-center gap-3" aria-hidden="true">
                                    <span className="h-px w-10 bg-[#5A430F]/70" />
                                    <span className="h-1.5 w-1.5 rotate-45 bg-[#5A430F]" />
                                    <span className="h-px w-10 bg-[#5A430F]/70" />
                                </div>
                                {lines.length > 0 && (
                                    <p className="font-['Cormorant_Garamond'] italic text-lg font-semibold text-[#3A2A08] mt-2">
                                        {pieces} {pieces === 1 ? 'piece' : 'pieces'} set aside for you
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* the diameter: thickest in the middle, thinning to a point at each end */}
                        <span
                            className="absolute inset-x-0 bottom-0 translate-y-1/2 h-[10px] rounded-[50%] shadow-[0_4px_8px_-3px_rgba(74,55,8,0.45)]"
                            style={{ backgroundImage: 'linear-gradient(90deg, rgba(176,141,43,0) 0%, #B08D2B 18%, #F2DC9B 50%, #B08D2B 82%, rgba(176,141,43,0) 100%)' }}
                            aria-hidden="true"
                        />
                    </header>

                    {loading && <BagLoader />}

                    {failed && (
                        <div className="text-center py-20">
                            <p className="font-['Cormorant_Garamond'] italic text-xl text-[#6B1423]">
                                Unable to load your cart.
                            </p>
                            <button
                                onClick={() => dispatch(fetchCart())}
                                className="mt-6 border border-[#B08D2B] px-8 py-3 font-['Cinzel'] text-[10px] tracking-[0.25em] text-[#6B5D4F] hover:text-[#2B2620] hover:border-[#2B2620] transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {empty && (
                        <div className="text-center py-12 cart-enter">
                            <div className="mx-auto w-44">
                                <div className="p-[6px] bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] shadow-[0_18px_30px_-14px_rgba(43,38,32,0.55)]">
                                    <div className="p-[2px] border border-[#7C5F1A]/60">
                                        <div className="aspect-[4/5] flex items-center justify-center" style={PLAQUE_STYLE}>
                                            <ShoppingBag className="h-8 w-8 text-[#B08D2B]" strokeWidth={1.25} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="font-['Bodoni_Moda'] font-medium text-3xl text-[#2B2620] mt-8">Your cart is empty</p>
                            <p className="font-['Cormorant_Garamond'] italic text-lg text-[#6B5D4F] mt-2">
                                Looks like you haven't added anything yet.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/products')}
                                className="mt-7 rounded-full bg-[#B08D2B] hover:bg-[#8A6A1D] text-[#F3ECDB] font-['Cinzel'] text-[10px] tracking-[0.2em] px-8 py-3 transition-colors"
                            >
                                BROWSE PRODUCTS
                            </button>
                        </div>
                    )}

                    {!loading && lines.length > 0 && (
                        <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
                            {/* ---------- the ledger: one separate card per piece ---------- */}
                            <div className="space-y-6">
                                {lines.map((line, i) => (
                                    <div
                                        key={line.id}
                                        className="relative rounded-3xl border border-[#B08D2B]/50 px-5 sm:px-8 shadow-[0_14px_30px_-18px_rgba(43,38,32,0.45)] cart-enter"
                                        style={{ ...PLAQUE_STYLE, animationDelay: `${i * 80}ms` }}
                                    >
                                        <CornerBrackets />
                                        <div className="py-2">
                                            <CartItem
                                                item={cartItems[i]}
                                                index={i}
                                                onChangeQty={handleChangeQty}
                                                onRemove={handleRemove}
                                                onView={handleView}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ---------- the invoice ---------- */}
                            <aside
                                className="lg:sticky lg:top-24 rounded-3xl p-[2px] bg-gradient-to-br from-[#F2DC9B] via-[#B08D2B] to-[#E4C77A] shadow-[0_22px_44px_-18px_rgba(43,38,32,0.45)] cart-enter"
                                style={{ animationDelay: '120ms' }}
                                aria-label="Invoice"
                            >
                                <div className="rounded-[22px] overflow-hidden" style={PLAQUE_STYLE}>
                                    <div className="px-6 pt-6">
                                        {/* header */}
                                        <div className="flex items-start justify-between gap-4">
                                            <h2 className="font-['Bodoni_Moda'] font-semibold text-3xl text-[#6B1423] leading-none">Invoice</h2>
                                            <div className="text-right">
                                                <p className="font-['Cinzel'] text-[10px] font-semibold tracking-[0.15em] text-[#5A430F]">
                                                    NO. {invoiceNo(lines)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-3" aria-hidden="true">
                                            <span className="h-px flex-1 bg-gradient-to-r from-[#B08D2B]/70 to-[#B08D2B]/20" />
                                            <span className="h-1.5 w-1.5 rotate-45 bg-[#B08D2B]" />
                                            <span className="h-px flex-1 bg-gradient-to-l from-[#B08D2B]/70 to-[#B08D2B]/20" />
                                        </div>

                                        {/* dates */}
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <MetaField label="ISSUED">{issuedOn}</MetaField>
                                            <MetaField label="DISPATCH BY">{dispatchBy}</MetaField>
                                        </div>

                                        {/* items — scrolls inside, so the invoice never grows */}
                                        <div className="mt-5">
                                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 pb-2 border-b border-[#8A6A1D]/60 font-['Cinzel'] text-[9px] font-semibold tracking-[0.2em] text-[#5A430F]">
                                                <span>ITEM</span>
                                                <span className="text-center w-6">QTY</span>
                                                <span className="text-right w-20">AMOUNT</span>
                                            </div>
                                            <ul className="max-h-36 overflow-y-auto pr-1 divide-y divide-dotted divide-[#B08D2B]/40">
                                                {lines.map((l) => (
                                                    <li key={l.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-baseline py-2">
                                                        <span className="font-['Cormorant_Garamond'] text-[15px] font-semibold text-[#2B2620] truncate">{l.product.name}</span>
                                                        <span className="font-['Cinzel'] text-[11px] font-semibold text-[#2B2620] text-center w-6">{l.quantity}</span>
                                                        <span className="font-['Cinzel'] text-[11px] font-semibold text-[#2B2620] text-right w-20">
                                                            {formatPrice((l.product.price ?? 0) * l.quantity)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* sums */}
                                        <div className="mt-3 pt-3 border-t border-[#8A6A1D]/60 space-y-2.5">
                                            <InvoiceLine label={`Subtotal · ${pieces} ${pieces === 1 ? 'piece' : 'pieces'}`} value={formatPrice(subtotal)} />
                                            <InvoiceLine
                                                label="Shipping"
                                                value={freeDispatch ? 'COMPLIMENTARY' : formatPrice(dispatchFee)}
                                                valueClass={freeDispatch ? 'text-[#1F5A49]' : ''}
                                            />
                                        </div>

                                        {/* free-dispatch pill: fills with burnished gold as the bag nears the threshold */}
                                        <div
                                            className={`mt-4 relative h-9 rounded-full border overflow-hidden ${
                                                freeDispatch ? 'border-[#8A6A1D] shadow-[0_6px_14px_-8px_rgba(124,95,26,0.8)]' : 'border-[#8A6A1D]/70 bg-[#FBF6EA]'
                                            }`}
                                            style={freeDispatch ? RICH_GOLD_STYLE : undefined}
                                        >
                                            {!freeDispatch && (
                                                <div
                                                    className="absolute inset-y-0 left-0 transition-[width] duration-700"
                                                    style={{ ...RICH_GOLD_STYLE, width: `${progress}%` }}
                                                />
                                            )}
                                            <p className="relative h-full flex items-center justify-center gap-2 px-3 font-['Cormorant_Garamond'] italic text-sm font-bold text-[#2B1D04]">
                                                {freeDispatch ? (
                                                    <>
                                                        <Check className="h-4 w-4 text-[#4A0E18]" strokeWidth={2.5} />
                                                        Complimentary shipping unlocked
                                                    </>
                                                ) : (
                                                    `${formatPrice(FREE_DISPATCH_ABOVE - subtotal)} away from complimentary shipping`
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* amount due on dim gold */}
                                    <div className="mt-5 px-6 py-5 border-y border-[#8A6A1D]/60" style={DIM_GOLD_STYLE}>
                                        <div className="flex items-end justify-between gap-3">
                                            <span className="font-['Cinzel'] text-[10px] font-bold tracking-[0.25em] text-[#3A2A08]">AMOUNT DUE</span>
                                            <span className="font-['Bodoni_Moda'] font-semibold text-4xl text-[#4A0E18] leading-none drop-shadow-[0_1px_0_rgba(255,248,222,0.7)]">
                                                {formatPrice(total)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="px-6 pt-5 pb-6">
                                        <button
                                            type="button"
                                            onClick={() => navigate(CHECKOUT_PATH)}
                                            className="group w-full flex items-center justify-center gap-3 rounded-full bg-[#6B1423] hover:bg-[#560F1C] text-[#F3E7C9] font-['Cinzel'] font-bold text-[11px] tracking-[0.25em] py-3.5 shadow-[0_10px_20px_-10px_rgba(107,20,35,0.7)] transition-colors"
                                        >
                                            CHECK OUT
                                            <ArrowRight className="h-4 w-4 text-[#D9BB74] transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
                                        </button>
                                        <p className="mt-4 flex items-center justify-center gap-2 font-['Cormorant_Garamond'] text-sm font-semibold text-[#2B2620]">
                                            <ShieldCheck className="h-4 w-4 text-[#5A430F] shrink-0" strokeWidth={1.5} />
                                            30-day returns on unused pieces
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Cart;