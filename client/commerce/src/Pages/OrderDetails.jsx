import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Package, Truck, X } from 'lucide-react';
import { axiosInstance } from '../axiosCalls/axios.js';
import Navbar from '../components/Navbar.jsx';

/*
  Loom & Jade — Order Details ("The Certificate")
  One object instead of many panels: a single ivory certificate resting on the same pale-blue
  gingham wall as the Orders page. A lapis wax seal straddles its top edge and states where the
  order stands; a gilt thread with three knots tracks Placed → Shipped → Delivered; the pieces
  are listed in a quiet ledger; and the sheet closes on a lapis band carrying the total.

  Fetches GET /orders/:id → { success, order } (a bare order object also works).
    { _id, createdAt, status, paymentStatus, totalAmount,
      shippingAddress: { fullName, phone, address, city, state, pincode },
      items: [{ product, name, price, quantity, image }] }

  Route:  <Route path="/orders/:id" element={<OrderDetails />} />
*/

const LAPIS = '#1B365D';
const LAPIS_DARK = '#0F2342';
const GOLD = '#D9BB74';
const GOLD_DEEP = '#B08D2B';
const CHECK_BLUE = '#7F9DBB';

/* ---------- textures ---------- */

const WALL_PATTERN = (() => {
    const T = 40;
    const C = T / 2;
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}" viewBox="0 0 ${T} ${T}">` +
        `<rect width="${T}" height="${T}" fill="#F7F3EA"/>` +
        `<rect x="0" y="0" width="${C}" height="${T}" fill="${CHECK_BLUE}" fill-opacity="0.22"/>` +
        `<rect x="0" y="0" width="${T}" height="${C}" fill="${CHECK_BLUE}" fill-opacity="0.22"/>` +
        `</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

const PAGE_STYLE = {
    backgroundColor: '#F7F3EA',
    backgroundImage: `
        radial-gradient(ellipse 60% 420px at 50% 0%, rgba(255,255,255,0.9), rgba(255,255,255,0) 75%),
        repeating-linear-gradient(135deg, rgba(60,90,125,0.035) 0px, rgba(60,90,125,0.035) 1px, transparent 1px, transparent 3px),
        ${WALL_PATTERN}
    `,
    backgroundSize: 'auto, auto, 40px 40px',
};

const PARCHMENT_STYLE = {
    backgroundColor: '#FBF8F1',
    backgroundImage: `
        repeating-linear-gradient(135deg, rgba(139,107,58,0.05) 0px, rgba(139,107,58,0.05) 1px, transparent 1px, transparent 3px),
        repeating-linear-gradient(45deg, rgba(139,107,58,0.035) 0px, rgba(139,107,58,0.035) 1px, transparent 1px, transparent 3px)
    `,
};

const GOLD_FOIL_STYLE = {
    backgroundImage: `
        repeating-linear-gradient(135deg, rgba(90,67,15,0.07) 0px, rgba(90,67,15,0.07) 1px, transparent 1px, transparent 4px),
        linear-gradient(115deg, #D2A93E 0%, #EBCB6B 28%, #FBEBB0 50%, #E2BC55 72%, #BF9530 100%)
    `,
    boxShadow: 'inset 0 1px 0 rgba(255,248,222,0.85), inset 0 -1px 0 rgba(90,67,15,0.35)',
};

const LAPIS_PANEL_STYLE = {
    backgroundColor: LAPIS_DARK,
    backgroundImage: `
        radial-gradient(ellipse at 50% 130%, rgba(217,187,116,0.18), transparent 62%),
        linear-gradient(180deg, #1B365D 0%, #0F2342 100%)
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

function formatPrice(value) {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const shortId = (id) => String(id ?? '').slice(-8).toUpperCase();

const STATUS_LABEL = {
    PLACED: 'Placed',
    PENDING_PAYMENT: 'Payment pending',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};
const statusLabel = (s) => STATUS_LABEL[s] ?? String(s ?? 'Processing').replace(/_/g, ' ');
const stageIndex = (s) => ({ PLACED: 0, SHIPPED: 1, DELIVERED: 2 }[s] ?? null);

function sealIcon(status) {
    if (status === 'SHIPPED') return Truck;
    if (status === 'DELIVERED') return Check;
    if (status === 'CANCELLED') return X;
    return Package;
}

/* ---------- pieces of the sheet ---------- */

function IronworkDivider({ className = 'my-8' }) {
    return (
        <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden="true">
            <span className="h-px flex-1" style={{ backgroundImage: `linear-gradient(90deg, transparent, ${LAPIS}99, ${LAPIS})` }} />
            <svg className="h-6 w-20" viewBox="0 0 80 24" fill="none" stroke={LAPIS} strokeWidth="1.5" strokeLinecap="round">
                <circle cx="40" cy="12" r="4.5" />
                <path d="M35.5 12C35.5 6.5 28 4 22 7C17 9.5 17.5 15.5 22 16C25.5 16.3 27 13.5 25 11.8" />
                <path d="M44.5 12C44.5 6.5 52 4 58 7C63 9.5 62.5 15.5 58 16C54.5 16.3 53 13.5 55 11.8" />
                <path d="M18 12H4M62 12H76" />
                <circle cx="40" cy="12" r="1.2" fill={GOLD_DEEP} stroke="none" />
            </svg>
            <span className="h-px flex-1" style={{ backgroundImage: `linear-gradient(270deg, transparent, ${LAPIS}99, ${LAPIS})` }} />
        </div>
    );
}

/* the golden-beige seal, with golden-brown hints, that straddles the top edge */
function Seal({ status }) {
    const Icon = sealIcon(status);
    return (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
            <div className="rounded-full p-[3px] bg-gradient-to-br from-[#E4C77A] via-[#8A6A1D] to-[#B08D2B] shadow-[0_14px_24px_-8px_rgba(90,56,12,0.65)]">
                <div
                    className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full border-2 border-[#C9A24A]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 34% 28%, #F7EAC2 0%, rgba(247,234,194,0) 48%), linear-gradient(135deg, #E9D29A 0%, #C99A3E 58%, #94601C 100%)',
                        boxShadow: 'inset 0 2px 7px rgba(90,56,12,0.45)',
                    }}
                >
                    <span className="absolute inset-[5px] rounded-full border border-[#6B4513]/55" />
                    <span className="absolute inset-[9px] rounded-full border border-dotted border-[#6B4513]/45" />
                    <Icon className="relative h-8 w-8 text-[#4A2F08]" strokeWidth={1.5} />
                </div>
            </div>
        </div>
    );
}

/* a gilt thread with three knots: Placed → Shipped → Delivered */
const KNOTS = ['Placed', 'Shipped', 'Delivered'];

function Thread({ at }) {
    return (
        <ol className="relative mx-auto grid max-w-3xl grid-cols-3" aria-label="Order progress">
            <span className="absolute left-[16.66%] right-[16.66%] top-[13px] h-[3px] bg-[#1B365D]/15" aria-hidden="true" />
            <span
                className="absolute left-[16.66%] top-[13px] h-[3px] transition-[width] duration-700"
                style={{ ...GOLD_FOIL_STYLE, width: `${(at / 2) * 66.68}%` }}
                aria-hidden="true"
            />
            {KNOTS.map((label, i) => {
                const done = i < at || (i === at && at === 2);
                const current = i === at && !done;
                return (
                    <li key={label} className="relative flex flex-col items-center" aria-current={current ? 'step' : undefined}>
                        <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                                done ? 'border-[#8A6A1D]' : current ? 'border-[#1B365D]' : 'border-[#1B365D]/30 bg-[#FBF8F1]'
                            }`}
                            style={{
                                ...(done ? GOLD_FOIL_STYLE : current ? LAPIS_PANEL_STYLE : {}),
                                boxShadow: current ? '0 0 0 4px rgba(217,187,116,0.4)' : undefined,
                            }}
                        >
                            {done && <Check className="h-4 w-4 text-[#0F2342]" strokeWidth={2.6} />}
                            {current && <span className="h-2 w-2 rounded-full bg-[#D9BB74]" />}
                        </span>
                        <span className={`mt-2.5 font-['Cormorant_Garamond'] text-lg font-semibold ${i <= at ? 'text-[#1B365D]' : 'text-[#8A7F6C]'}`}>
                            {label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function Facts({ label, children }) {
    return (
        <div className="px-3 text-center">
            <p className="font-['Cinzel'] text-[10px] font-semibold tracking-[0.25em] text-[#8A6A1D]">{label}</p>
            <p className="mt-1.5 font-['Bodoni_Moda'] text-lg font-semibold text-[#1B365D] sm:text-xl">{children}</p>
        </div>
    );
}

function Thumb({ src, alt }) {
    return (
        <div className="w-16 shrink-0 p-[4px] bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] shadow-[0_8px_14px_-8px_rgba(15,35,66,0.6)] sm:w-20">
            <div className="border border-[#1B365D]/70">
                <div className="aspect-[4/5] overflow-hidden bg-[#0F0D0B]">
                    {src ? (
                        <img src={src} alt={alt} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-['Cinzel'] text-[7px] tracking-[0.15em] text-[#8A7F6C]">
                            NO IMAGE
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SumLine({ label, value, valueClass = '' }) {
    return (
        <div className="flex items-end gap-3">
            <span className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#2B2620]">{label}</span>
            <span className="mb-1.5 flex-1 border-b-2 border-dotted border-[#1B365D]/35" aria-hidden="true" />
            <span className={`font-['Cinzel'] text-xs font-semibold tracking-[0.08em] text-[#2B2620] ${valueClass}`}>{value}</span>
        </div>
    );
}

/* the sheet itself: gold edge, lapis keyline, ivory paper, and an inner gilt rule */
function GoldCorners() {
    return (
        <>
            {['top-5 left-5', 'top-5 right-5 rotate-90', 'bottom-5 left-5 -rotate-90', 'bottom-5 right-5 rotate-180'].map((pos) => (
                <span key={pos} className={`pointer-events-none absolute ${pos} h-4 w-4 rounded-tl-md border-l-2 border-t-2 border-[#B08D2B]`} aria-hidden="true" />
            ))}
        </>
    );
}

function Sheet({ children, className = '', seal = null }) {
    return (
        <div className={`relative mx-auto max-w-6xl ${className}`}>
            {seal}
            <div className="rounded-3xl bg-gradient-to-br from-[#F2DC9B] via-[#B08D2B] to-[#E4C77A] p-[3px] shadow-[0_30px_60px_-24px_rgba(124,95,26,0.55)]">
                <div className="rounded-[21px] p-[2px]" style={{ backgroundColor: LAPIS }}>
                    <div className="relative overflow-hidden rounded-[19px]" style={PARCHMENT_STYLE}>
                        <span className="pointer-events-none absolute inset-2.5 rounded-2xl border border-[#B08D2B]/60" aria-hidden="true" />
                        <GoldCorners />
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SheetSkeleton() {
    return (
        <Sheet className="animate-pulse">
            <div className="space-y-6 px-8 pb-16 pt-24" role="status" aria-label="Loading your order">
                <div className="mx-auto h-12 w-64 bg-[#E4D9BC]" />
                <div className="mx-auto h-4 w-40 bg-[#E4D9BC]" />
                <div className="h-16 bg-[#E4D9BC]/70" />
                <div className="h-24 bg-[#E4D9BC]/70" />
                <div className="h-24 bg-[#E4D9BC]/70" />
            </div>
        </Sheet>
    );
}

/* ---------- page ---------- */

export function OrderDetails() {
    useGalleryFonts();
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);

    useEffect(() => {
        axiosInstance
            .get('/wishlist')
            .then((res) => setWishlistCount((res.data?.wishlist ?? []).length))
            .catch(() => setWishlistCount(0));
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadOrder() {
            setStatus('loading');
            setError(null);
            try {
                const res = await axiosInstance.get(`/orders/${id}`);
                const data = res.data?.order ?? res.data;
                if (!cancelled) {
                    setOrder(data);
                    setStatus('success');
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        (err.response?.status === 401 ? 'Please sign in to see this order.' : null) ||
                        (err.response?.status === 404 ? 'This order could not be found.' : null) ||
                        err.message ||
                        'Something went wrong'
                    );
                    setStatus('error');
                }
            }
        }

        loadOrder();
        return () => {
            cancelled = true;
        };
    }, [id, attempt]);

    /* ---------- totals ---------- */
    const items = order?.items ?? [];
    const pieces = items.reduce((sum, it) => sum + (it.quantity ?? 0), 0);
    const subtotal = items.reduce((sum, it) => sum + (it.price ?? 0) * (it.quantity ?? 0), 0);
    const total = order?.totalAmount ?? subtotal;
    const shippingFee = Math.max(0, total - subtotal);
    const addr = order?.shippingAddress;
    const at = stageIndex(order?.status);
    const unpaid = order?.status === 'PENDING_PAYMENT';

    return (
        <div className="relative min-h-screen overflow-x-hidden" style={PAGE_STYLE}>
            <style>{`
                @keyframes od-settle { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
                .od-settle { animation: od-settle 800ms cubic-bezier(.2,.7,.2,1) both; }
                @media (prefers-reduced-motion: reduce) { .od-settle { animation: none; } }
            `}</style>

            <Navbar wishlistCount={wishlistCount} />

            {/* gilt rail: a smooth gold line that fades out toward both edges */}
            <div className="relative" aria-hidden="true">
                <div
                    className="h-[3px]"
                    style={{ backgroundImage: `linear-gradient(90deg, transparent, ${GOLD_DEEP} 12%, #F2DC9B 50%, ${GOLD_DEEP} 88%, transparent)` }}
                />
                <div
                    className="mx-auto mt-[3px] h-px w-[76%]"
                    style={{ backgroundImage: `linear-gradient(90deg, transparent, ${GOLD_DEEP}99, transparent)` }}
                />
            </div>

            <main className="relative mx-auto max-w-7xl px-5 pb-24 pt-6 sm:px-6">
                <button
                    type="button"
                    onClick={() => navigate('/orders')}
                    className="mb-14 inline-flex items-center gap-1.5 font-['Cinzel'] text-[10px] tracking-[0.2em] text-[#4A2318] transition-colors hover:text-[#1B365D]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    BACK TO MY ORDERS
                </button>

                {status === 'loading' && <SheetSkeleton />}

                {status === 'error' && (
                    <Sheet>
                        <div role="alert" className="px-8 pb-14 pt-16 text-center">
                            <h1 className="font-['Italiana'] text-4xl tracking-[0.05em] text-[#1B365D]">Order unavailable</h1>
                            <IronworkDivider className="mx-auto my-5 w-[60%]" />
                            <p className="font-['Cormorant_Garamond'] text-xl italic text-[#8A2A1A]">{error}</p>
                            <div className="mt-7 flex flex-wrap justify-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAttempt((n) => n + 1)}
                                    className="border-2 border-[#1B365D] px-8 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#1B365D] transition-colors hover:bg-[#1B365D] hover:text-[#D9BB74]"
                                >
                                    TRY AGAIN
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/orders')}
                                    className="bg-[#1B365D] px-8 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#D9BB74] transition-colors hover:bg-[#0F2342]"
                                >
                                    ALL ORDERS
                                </button>
                            </div>
                        </div>
                    </Sheet>
                )}

                {status === 'success' && order && (
                    <Sheet className="od-settle" seal={<Seal status={order.status} />}>
                        <div className="relative px-6 pb-10 pt-20 sm:px-14">
                            {/* title */}
                            <div className="text-center">
                                <h1 className="font-['Italiana'] text-[clamp(2.6rem,7vw,4.4rem)] leading-none tracking-[0.05em] text-[#1B365D] [-webkit-text-stroke:1px_#1B365D]">
                                    Order Details
                                </h1>
                                <div className="mt-4 flex items-center justify-center gap-3" aria-hidden="true">
                                    <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#B08D2B]" />
                                    <span className="h-1.5 w-1.5 rotate-45 bg-[#B08D2B]" />
                                    <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#B08D2B]" />
                                </div>
                                <p className="mt-3 font-['Cormorant_Garamond'] text-xl italic text-[#4A3F33]">
                                    {pieces} {pieces === 1 ? 'piece' : 'pieces'} acquired from Loom &amp; Jade
                                </p>
                            </div>

                            {/* three facts */}
                            <div className="mt-8 grid grid-cols-3 divide-x divide-[#B08D2B]/45 border-y border-[#B08D2B]/45 py-4">
                                <Facts label="ORDER">#{shortId(order._id)}</Facts>
                                <Facts label="PLACED">{formatDate(order.createdAt)}</Facts>
                                <Facts label="STATUS">{statusLabel(order.status)}</Facts>
                            </div>

                            {/* progress */}
                            <div className="mt-9">
                                {at !== null ? (
                                    <Thread at={at} />
                                ) : (
                                    <p className="text-center font-['Cormorant_Garamond'] text-xl font-semibold italic text-[#8A2A1A]">
                                        {unpaid
                                            ? 'Payment for this order was not completed, so it has not been dispatched.'
                                            : order.status === 'CANCELLED'
                                            ? 'This order was cancelled.'
                                            : `Status: ${statusLabel(order.status)}`}
                                    </p>
                                )}
                            </div>

                            <IronworkDivider />

                            {/* pieces on the left, delivery address and sums on the right */}
                            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-0">
                                <div className="lg:pr-12">
                                <ul className="divide-y divide-dotted divide-[#1B365D]/30">
                                    {items.map((it, i) => (
                                        <li key={`${it.product}-${i}`} className="flex items-center gap-4 py-4 sm:gap-6">
                                            <Thumb src={it.image} alt={it.name} />
                                            <div className="min-w-0 flex-1">
                                                <h2 className="font-['Cormorant_Garamond'] text-xl font-semibold leading-snug text-[#2B2620] sm:text-2xl">{it.name}</h2>
                                                <p className="mt-1 font-['Cinzel'] text-[10px] font-semibold tracking-[0.18em] text-[#7A5A12]">
                                                    {it.quantity} × {formatPrice(it.price ?? 0)}
                                                </p>
                                                {it.product && (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/products/${it.product}`)}
                                                        className="mt-2 font-['Cormorant_Garamond'] text-base italic text-[#1B365D] underline decoration-[#B08D2B] underline-offset-4 transition-colors hover:text-[#8A6A1D]"
                                                    >
                                                        View this piece
                                                    </button>
                                                )}
                                            </div>
                                            <span className="font-['Bodoni_Moda'] text-xl font-semibold text-[#1B365D] sm:text-2xl">
                                                {formatPrice((it.price ?? 0) * (it.quantity ?? 0))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                </div>

                                <div className="space-y-8 lg:border-l lg:border-[#B08D2B]/45 lg:pl-12">
                                <div>
                                    <p className="font-['Cinzel'] text-[10px] font-semibold tracking-[0.25em] text-[#8A6A1D]">SHIPPED TO</p>
                                    {addr ? (
                                        <address className="mt-3 font-['Cormorant_Garamond'] text-xl font-medium not-italic leading-snug text-[#2B2620]">
                                            <span className="font-['Bodoni_Moda'] text-xl font-semibold text-[#1B365D]">{addr.fullName}</span>
                                            <br />
                                            {addr.address}
                                            <br />
                                            {addr.city}, {addr.state} {addr.pincode}
                                            {addr.phone && (
                                                <>
                                                    <br />
                                                    <span className="font-['Cinzel'] text-xs tracking-[0.1em] text-[#4A3F33]">{addr.phone}</span>
                                                </>
                                            )}
                                        </address>
                                    ) : (
                                        <p className="mt-3 font-['Cormorant_Garamond'] text-lg italic text-[#6B5D4F]">No address on record.</p>
                                    )}
                                </div>

                                    <div className="border-t border-[#B08D2B]/45 pt-6">
                                        <div className="space-y-3">
                                        <SumLine label={`Subtotal · ${pieces} ${pieces === 1 ? 'piece' : 'pieces'}`} value={formatPrice(subtotal)} />
                                        <SumLine
                                            label="Shipping"
                                            value={shippingFee === 0 ? 'COMPLIMENTARY' : formatPrice(shippingFee)}
                                            valueClass={shippingFee === 0 ? 'text-[#1F5A49]' : ''}
                                        />
                                        {order.paymentStatus && (
                                            <SumLine label="Payment" value={String(order.paymentStatus).replace(/_/g, ' ').toUpperCase()} />
                                        )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* closing band: the total, in lapis and gold */}
                        <div className="relative px-6 py-6 sm:px-14" style={LAPIS_PANEL_STYLE}>
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <span className="font-['Cinzel'] text-[11px] font-bold tracking-[0.3em] text-[#F5EFE0]">
                                    {unpaid ? 'AMOUNT DUE' : 'TOTAL PAID'}
                                </span>
                                <span className="font-['Bodoni_Moda'] text-4xl font-semibold leading-none text-[#D9BB74] sm:text-5xl">
                                    {formatPrice(total)}
                                </span>
                            </div>
                        </div>
                        <div className="h-[3px]" style={GOLD_FOIL_STYLE} aria-hidden="true" />

                        <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-14">
                            <p className="font-['Cormorant_Garamond'] text-base font-semibold italic text-[#4A3F33]">
                                30-day returns on unused pieces.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/orders')}
                                    className="border-2 border-[#1B365D] px-7 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#1B365D] transition-colors hover:bg-[#1B365D] hover:text-[#D9BB74]"
                                >
                                    ALL ORDERS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/products')}
                                    className="bg-[#1B365D] px-7 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#D9BB74] transition-colors hover:bg-[#0F2342]"
                                >
                                    CONTINUE BROWSING
                                </button>
                            </div>
                        </div>
                    </Sheet>
                )}
            </main>
        </div>
    );
}

export default OrderDetails;