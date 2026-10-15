import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Package, PackageOpen, Truck, X } from 'lucide-react';
import { axiosInstance } from '../axiosCalls/axios.js';
import Navbar from '../components/Navbar.jsx';

/*
  Loom & Jade — My Orders
  Rounded throughout, in golden-beige and golden-brown tones (no lapis, no sharp corners).
  - A warm cream grid wall, as on Cart and Products.
  - A golden seal and the title sit over a row of status filters (pills).
  - Orders lie in a two-column grid of rounded ivory cards with a gold edge. Each card has a
    golden-beige header (number, date, status), gilt-framed thumbnails, a short ledger of the
    pieces, the total, and a rounded button to the full details.

  Fetches GET /orders  →  { success, orders: [...] }, newest first. Per order:
    { _id, createdAt, status, paymentStatus, totalAmount,
      items: [{ product, name, price, quantity, image }] }

  Route:  <Route path="/orders" element={<Orders />} />
  "View Details" goes to /orders/:id.
*/

const BROWN = '#4A2F08';
const BROWN_MID = '#6B4513';
const GOLD_DEEP = '#B08D2B';
const ERROR = '#8A2A1A';

/* Abandoned payment attempts are saved as PENDING_PAYMENT orders by the backend.
   Set to false to hide them from the list. */
const SHOW_UNPAID = true;

const MAX_LINES = 3;
const MAX_THUMBS = 4;

/* ---------- textures ---------- */

const PARCHMENT_STYLE = {
    backgroundColor: '#FBF6EA',
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

/* golden-beige header band for each card */
const BEIGE_BAND_STYLE = {
    backgroundImage: `
        repeating-linear-gradient(135deg, rgba(124,95,26,0.07) 0px, rgba(124,95,26,0.07) 1px, transparent 1px, transparent 4px),
        linear-gradient(135deg, #F7E7B0 0%, #E9D29A 48%, #F2DC9B 100%)
    `,
};

/* ---------- helpers ---------- */

function useGalleryFonts() {
    useEffect(() => {
        const href =
            'https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Bodoni+Moda:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Italiana&display=swap';
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
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const shortId = (id) => String(id ?? '').slice(-8).toUpperCase();

const STATUS_LABEL = {
    PLACED: 'Placed',
    PENDING_PAYMENT: 'Payment pending',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};
const statusLabel = (s) => STATUS_LABEL[s] ?? String(s ?? 'Processing').replace(/_/g, ' ');

/* status → pill colours (all rounded, all warm) */
function statusPill(status) {
    switch (status) {
        case 'PLACED':
            return { cls: 'border-[#8A6A1D] text-[#4A2F08]', foil: true };
        case 'SHIPPED':
        case 'DELIVERED':
            return { cls: 'border-[#1F5A49]/60 bg-[#DFF3EA] text-[#1F5A49]' };
        case 'CANCELLED':
            return { cls: 'border-[#8A2A1A]/50 bg-[#FBE3DD] text-[#8A2A1A]' };
        default:
            return { cls: 'border-[#8A6A1D]/60 bg-[#FBF6EA] text-[#6B4513]' };
    }
}

function statusIcon(status) {
    if (status === 'SHIPPED') return Truck;
    if (status === 'DELIVERED') return Check;
    if (status === 'CANCELLED') return X;
    return Package;
}

/* ---------- small pieces ---------- */

/* the golden-beige seal with golden-brown hints, shared with the order details page */
function Seal({ Icon = PackageOpen, size = 'h-[72px] w-[72px]', iconSize = 'h-7 w-7' }) {
    return (
        <div className="rounded-full bg-gradient-to-br from-[#E4C77A] via-[#8A6A1D] to-[#B08D2B] p-[3px] shadow-[0_14px_24px_-8px_rgba(90,56,12,0.55)]" aria-hidden="true">
            <div
                className={`relative flex ${size} items-center justify-center rounded-full border-2 border-[#C9A24A]`}
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 34% 28%, #F7EAC2 0%, rgba(247,234,194,0) 48%), linear-gradient(135deg, #E9D29A 0%, #C99A3E 58%, #94601C 100%)',
                    boxShadow: 'inset 0 2px 7px rgba(90,56,12,0.45)',
                }}
            >
                <span className="absolute inset-[5px] rounded-full border border-[#6B4513]/55" />
                <span className="absolute inset-[9px] rounded-full border border-dotted border-[#6B4513]/45" />
                <Icon className={`relative ${iconSize} text-[#4A2F08]`} strokeWidth={1.5} />
            </div>
        </div>
    );
}

function DiamondRule({ className = '' }) {
    return (
        <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#B08D2B]" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[#B08D2B]" />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#B08D2B]" />
        </div>
    );
}

/* rounded gilt-mat thumbnail */
function Thumb({ src, alt, extra }) {
    return (
        <div className="w-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] p-[3px] shadow-[0_8px_14px_-8px_rgba(74,47,8,0.6)]">
            <div className="aspect-[4/5] overflow-hidden rounded-[13px] bg-[#0F0D0B]">
                {extra ? (
                    <div className="flex h-full w-full items-center justify-center bg-[#FBF6EA] font-['Cinzel'] text-xs font-semibold text-[#4A2F08]">
                        +{extra}
                    </div>
                ) : src ? (
                    <img src={src} alt={alt} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center font-['Cinzel'] text-[6px] tracking-[0.1em] text-[#8A7F6C]">
                        NO IMAGE
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------- one order ---------- */

function OrderCard({ order, index, onView }) {
    const items = order.items ?? [];
    const pill = statusPill(order.status);
    const Icon = statusIcon(order.status);
    const pieces = items.reduce((sum, it) => sum + (it.quantity ?? 0), 0);
    const shownLines = items.slice(0, MAX_LINES);
    const hiddenLines = items.length - shownLines.length;
    const thumbs = items.slice(0, MAX_THUMBS);
    const hiddenThumbs = items.length - thumbs.length;

    return (
        <article
            className="od-enter flex flex-col rounded-3xl bg-gradient-to-br from-[#F2DC9B] via-[#B08D2B] to-[#E4C77A] p-[2px] shadow-[0_22px_40px_-20px_rgba(90,56,12,0.5)]"
            style={{ animationDelay: `${Math.min(index, 6) * 80}ms` }}
            aria-label={`Order ${shortId(order._id)}`}
        >
            <div className="flex flex-1 flex-col overflow-hidden rounded-[22px]" style={PARCHMENT_STYLE}>
                {/* golden-beige header: number, date, status */}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4" style={BEIGE_BAND_STYLE}>
                    <div>
                        <h2 className="font-['Bodoni_Moda'] text-2xl font-semibold leading-none text-[#4A2F08]">#{shortId(order._id)}</h2>
                        <p className="mt-1.5 font-['Cormorant_Garamond'] text-base font-semibold italic text-[#6B4513]">
                            Placed {formatDate(order.createdAt)}
                        </p>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-['Cinzel'] text-[10px] font-bold tracking-[0.15em] ${pill.cls}`}
                        style={pill.foil ? GOLD_FOIL_STYLE : undefined}
                    >
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                        {statusLabel(order.status).toUpperCase()}
                    </span>
                </div>
                <div className="h-[3px]" style={GOLD_FOIL_STYLE} aria-hidden="true" />

                {/* body */}
                <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                    <div className="flex gap-2.5">
                        {thumbs.map((it, i) => (
                            <Thumb key={`${it.product}-${i}`} src={it.image} alt={it.name} />
                        ))}
                        {hiddenThumbs > 0 && <Thumb extra={hiddenThumbs} />}
                    </div>

                    <ul className="mt-4 divide-y divide-dotted divide-[#B08D2B]/50">
                        {shownLines.map((it, i) => (
                            <li key={`${it.product}-${i}`} className="flex items-baseline justify-between gap-4 py-2">
                                <span className="truncate font-['Cormorant_Garamond'] text-lg font-semibold text-[#2B2620]">
                                    {it.name} <span className="text-[#7A5A12]">× {it.quantity}</span>
                                </span>
                                <span className="shrink-0 font-['Cinzel'] text-[11px] font-semibold text-[#4A2F08]">
                                    {formatPrice((it.price ?? 0) * (it.quantity ?? 0))}
                                </span>
                            </li>
                        ))}
                        {hiddenLines > 0 && (
                            <li className="py-2 font-['Cormorant_Garamond'] text-base italic text-[#6B5D4F]">
                                + {hiddenLines} more {hiddenLines === 1 ? 'piece' : 'pieces'}
                            </li>
                        )}
                    </ul>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
                        <div>
                            <p className="font-['Cormorant_Garamond'] text-base font-semibold italic text-[#6B4513]">
                                Total · {pieces} {pieces === 1 ? 'piece' : 'pieces'}
                            </p>
                            <p className="mt-0.5 font-['Bodoni_Moda'] text-3xl font-semibold leading-none text-[#4A2F08]">
                                {formatPrice(order.totalAmount)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onView(order)}
                            className="group inline-flex items-center gap-2.5 rounded-full bg-[#6B4513] px-6 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.2em] text-[#F7E7B0] shadow-[0_10px_18px_-10px_rgba(74,47,8,0.8)] transition-colors hover:bg-[#4A2F08]"
                        >
                            VIEW DETAILS
                            <ArrowRight className="h-4 w-4 text-[#E4C77A] transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

function OrdersSkeleton({ count = 4 }) {
    return (
        <div className="grid gap-8 lg:grid-cols-2" role="status" aria-label="Loading your orders">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-3xl border-2 border-[#B08D2B]/40" style={PARCHMENT_STYLE}>
                    <div className="h-[76px] bg-[#E9D29A]/70" />
                    <div className="space-y-3 px-6 py-6">
                        <div className="flex gap-2.5">
                            <div className="h-[70px] w-14 rounded-2xl bg-[#E4D9BC]" />
                            <div className="h-[70px] w-14 rounded-2xl bg-[#E4D9BC]" />
                        </div>
                        <div className="h-4 w-48 rounded-full bg-[#E4D9BC]" />
                        <div className="h-4 w-36 rounded-full bg-[#E4D9BC]" />
                        <div className="flex items-end justify-between pt-4">
                            <div className="h-8 w-28 rounded-full bg-[#E4D9BC]" />
                            <div className="h-11 w-40 rounded-full bg-[#E4D9BC]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------- page ---------- */

export function Orders() {
    useGalleryFonts();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0); // bump to retry
    const [wishlistCount, setWishlistCount] = useState(0);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        axiosInstance
            .get('/wishlist')
            .then((res) => setWishlistCount((res.data?.wishlist ?? []).length))
            .catch(() => setWishlistCount(0));
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadOrders() {
            setStatus('loading');
            setError(null);
            try {
                const res = await axiosInstance.get('/orders');
                const list = res.data?.orders ?? [];
                if (!cancelled) {
                    setOrders(SHOW_UNPAID ? list : list.filter((o) => o.status !== 'PENDING_PAYMENT'));
                    setStatus('success');
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        (err.response?.status === 401 ? 'Please sign in to see your orders.' : null) ||
                        err.message ||
                        'Something went wrong'
                    );
                    setStatus('error');
                }
            }
        }

        loadOrders();
        return () => {
            cancelled = true;
        };
    }, [attempt]);

    /* filter pills: only the statuses that actually exist, each with its count */
    const filters = useMemo(() => {
        const counts = {};
        orders.forEach((o) => {
            counts[o.status] = (counts[o.status] ?? 0) + 1;
        });
        return [{ key: 'ALL', label: 'All', count: orders.length }, ...Object.keys(counts).map((k) => ({ key: k, label: statusLabel(k), count: counts[k] }))];
    }, [orders]);

    const visible = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);
    const handleView = (order) => navigate(`/orders/${order._id}`);

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#F3ECDB] [background-image:radial-gradient(#00000009_1px,transparent_1px)] [background-size:24px_24px]">
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
                @keyframes od-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
                .od-enter { animation: od-enter 650ms cubic-bezier(.2,.7,.2,1) both; }
                @media (prefers-reduced-motion: reduce) { .od-enter { animation: none; } }
            `}</style>

            <div className="relative z-10">
                <Navbar wishlistCount={wishlistCount} />

                <main className="mx-auto max-w-6xl px-6 pb-24 pt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="inline-flex items-center gap-1.5 font-['Cinzel'] text-[10px] tracking-[0.2em] text-[#6B5D4F] transition-colors hover:text-[#4A2F08]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        CONTINUE BROWSING
                    </button>

                    {/* ---------- header ---------- */}
                    <header className="mb-10 mt-6 flex flex-col items-center text-center">
                        <Seal />
                        <h1 className="mt-5 font-['Italiana'] text-[clamp(2.8rem,7vw,5rem)] leading-none tracking-[0.05em] text-[#4A2F08]">
                            My Orders
                        </h1>
                        <DiamondRule className="mt-4" />
                        {status === 'success' && orders.length > 0 && (
                            <p className="mt-3 font-['Cormorant_Garamond'] text-xl italic text-[#6B4513]">
                                {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed with Loom &amp; Jade
                            </p>
                        )}
                    </header>

                    {/* ---------- filters ---------- */}
                    {status === 'success' && filters.length > 2 && (
                        <div className="mb-10 flex flex-wrap justify-center gap-3" role="tablist" aria-label="Filter orders by status">
                            {filters.map((f) => {
                                const active = filter === f.key;
                                return (
                                    <button
                                        key={f.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => setFilter(f.key)}
                                        className={`rounded-full border px-5 py-2 font-['Cinzel'] text-[10px] font-bold tracking-[0.18em] transition-colors ${
                                            active
                                                ? 'border-[#8A6A1D] text-[#4A2F08]'
                                                : 'border-[#B08D2B]/60 bg-[#FBF6EA] text-[#6B5D4F] hover:border-[#6B4513] hover:text-[#4A2F08]'
                                        }`}
                                        style={active ? GOLD_FOIL_STYLE : undefined}
                                    >
                                        {f.label.toUpperCase()} · {f.count}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ---------- states ---------- */}
                    {status === 'loading' && <OrdersSkeleton />}

                    {status === 'error' && (
                        <div role="alert" className="py-16 text-center">
                            <p className="font-['Cormorant_Garamond'] text-xl italic" style={{ color: ERROR }}>
                                We couldn't load your orders — {error}
                            </p>
                            <button
                                type="button"
                                onClick={() => setAttempt((n) => n + 1)}
                                className="mt-6 rounded-full border-2 border-[#6B4513] px-8 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#6B4513] transition-colors hover:bg-[#6B4513] hover:text-[#F7E7B0]"
                            >
                                TRY AGAIN
                            </button>
                        </div>
                    )}

                    {status === 'success' && orders.length === 0 && (
                        <div className="od-enter mx-auto max-w-md rounded-3xl bg-gradient-to-br from-[#F2DC9B] via-[#B08D2B] to-[#E4C77A] p-[2px] shadow-[0_22px_40px_-20px_rgba(90,56,12,0.5)]">
                            <div className="flex flex-col items-center rounded-[22px] px-8 pb-10 pt-10 text-center" style={PARCHMENT_STYLE}>
                                <Seal Icon={PackageOpen} />
                                <h2 className="mt-6 font-['Bodoni_Moda'] text-2xl font-semibold text-[#4A2F08]">You have not placed any orders yet.</h2>
                                <DiamondRule className="my-4" />
                                <button
                                    type="button"
                                    onClick={() => navigate('/products')}
                                    className="rounded-full bg-[#6B4513] px-8 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#F7E7B0] transition-colors hover:bg-[#4A2F08]"
                                >
                                    START SHOPPING
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'success' && visible.length > 0 && (
                        <div className="grid gap-8 lg:grid-cols-2">
                            {visible.map((order, i) => (
                                <OrderCard key={order._id} order={order} index={i} onView={handleView} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Orders;