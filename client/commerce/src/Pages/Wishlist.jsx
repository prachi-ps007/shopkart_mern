import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, ArrowRight } from 'lucide-react';
import { axiosInstance } from '../axiosCalls/axios.js';
import Navbar from '../components/Navbar.jsx';
import PaperPlaneLoader from '../components/PaperPlaneLoader.jsx';

/*
  Loom & Jade — Wishlist ("The Private Collection")
  Flow: GET /wishlist -> products render as cards -> DELETE /wishlist/:id removes
  a card instantly (rolled back if the request fails).

  Expected response: { success, count, wishlist: [ { _id, name, price, category, image, stock } ] }

  Design: an oxblood (#6B1423) gallery wall with a gilt damask lattice, each piece
  hung in a gilt frame above a beige, hatch-textured museum placard.
*/

const OXBLOOD = '#6B1423';

/* Diamond trellis drawn as one 40px SVG tile: diagonals cross at the tile corners and centre,
   and a gilt dot sits in the middle of every diamond (tile edge midpoints). */
const WALL_TILE = "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M0 0L40 40M40 0L0 40' stroke='%23D9BB74' stroke-opacity='.14' stroke-width='1' fill='none'/><g fill='%23D9BB74' fill-opacity='.2'><circle cx='20' cy='0' r='1.5'/><circle cx='20' cy='40' r='1.5'/><circle cx='0' cy='20' r='1.5'/><circle cx='40' cy='20' r='1.5'/></g></svg>\")";

const WALL_STYLE = {
    backgroundColor: OXBLOOD,
    backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0) 0%, rgba(30,4,10,0.55) 100%), ${WALL_TILE}`,
    backgroundSize: '100% 100%, 40px 40px',
};

/* Beige placard texture — same hatch family as the plaques on the Products page. */
const PLACARD_STYLE = {
    backgroundColor: '#F3E7C9',
    backgroundImage: `
        repeating-linear-gradient(135deg, rgba(139,107,58,0.10) 0px, rgba(139,107,58,0.10) 1px, transparent 1px, transparent 4px),
        repeating-linear-gradient(45deg, rgba(139,107,58,0.06) 0px, rgba(139,107,58,0.06) 1px, transparent 1px, transparent 4px)
    `,
};

function useGalleryFonts() {
    useEffect(() => {
        const href =
            "https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Italiana&family=Pinyon+Script&display=swap";

        if (document.querySelector(`link[href="${href}"]`)) {
            return;
        }

        const link = document.createElement("link");

        link.rel = "stylesheet";
        link.href = href;

        document.head.appendChild(link);
    }, []);
}

function formatPrice(value) {
    if (typeof value !== "number") {
        return value;
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

function GoldFrame({ children, ratio = "aspect-[5/6]" }) {
    return (
        <div
            className="relative p-[6px] bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] shadow-[0_18px_30px_-14px_rgba(0,0,0,0.65)]"
        >
            <div className="p-[2px] border border-[#7C5F1A]/60">
                <div
                    className={`relative overflow-hidden bg-[#0F0D0B] ${ratio}`}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

function WishlistCard({ product, index, onView, onRemove }) {
    const { name, image, price, category, stock } = product;
    const outOfStock = !stock || stock <= 0;

    return (
        <article
            className="wl-hang wl-card group flex flex-col"
            style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
        >
            <GoldFrame>
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        onClick={() => onView(product)}
                        className="h-full w-full object-cover cursor-pointer transition duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-[#8A7F6C] font-['Cinzel'] text-[10px] tracking-[0.2em]">
                        NO IMAGE
                    </div>
                )}

                {/* Wax-seal heart: filled = it's on your wishlist. Hover turns it into an X
                    and reveals a REMOVE tag; click un-hearts it and the card leaves the wall. */}
                <button
                    type="button"
                    onClick={() => onRemove(product._id)}
                    title="Remove from wishlist"
                    aria-label={`Remove ${name} from wishlist`}
                    className="wl-seal absolute right-2.5 top-2.5 z-10 flex items-center gap-2"
                >
                    <span className="wl-tag rounded-full border border-[#D9BB74] bg-[#4E0E19] px-3 py-1 font-['Cinzel'] text-[9px] font-bold tracking-[0.2em] text-[#F3E7C9]">
                        REMOVE
                    </span>
                    <span className="wl-disc relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#D9BB74] bg-gradient-to-br from-[#7A1B2C] to-[#5A0F1C]">
                        <Heart className="wl-heart absolute h-4 w-4" fill="#D9BB74" strokeWidth={0} />
                        <X className="wl-x absolute h-4 w-4 text-[#F3E7C9]" strokeWidth={2.25} />
                    </span>
                </button>
            </GoldFrame>

            {/* museum placard — text block, then a full-bleed action strip */}
            <div
                className="flex w-full flex-1 flex-col border border-t-0 border-[#B08D2B]/60 text-center shadow-[0_14px_24px_-14px_rgba(0,0,0,0.7)]"
                style={PLACARD_STYLE}
            >
                <div className="flex flex-1 flex-col items-center justify-center px-3 pb-3 pt-2.5">
                    <h3 className="font-['Cormorant_Garamond'] text-[18px] font-semibold text-[#2B2620] leading-tight">
                        {name}
                    </h3>
                    <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2.5 leading-none">
                        <span className="font-['Cinzel'] text-[10px] font-bold tracking-[0.2em] text-[#7A5A12]">
                            {category?.toUpperCase()}
                        </span>
                        <span className="h-3 w-px bg-[#B08D2B]/70" />
                        <span className="font-['Cinzel'] text-[14px] font-extrabold text-[#6B1423]">{formatPrice(price)}</span>
                        <span className="h-3 w-px bg-[#B08D2B]/70" />
                        <span
                            className={`font-['Cormorant_Garamond'] text-[15px] font-semibold ${
                                outOfStock ? 'text-[#6B1423]' : 'text-[#4A3F33]'
                            }`}
                        >
                            {outOfStock ? 'Out of stock' : `${stock} left`}
                        </span>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onView(product)}
                    className="wl-view relative flex w-full items-center justify-center gap-2 bg-[#6B1423] py-3 font-['Cinzel'] text-[10px] font-bold tracking-[0.25em] text-[#F3E7C9] transition-colors hover:bg-[#560F1C]"
                >
                    VIEW DETAILS
                    <ArrowRight className="wl-arrow h-3.5 w-3.5 text-[#D9BB74]" strokeWidth={2} />
                </button>
            </div>
        </article>
    );
}

function Ornament() {
    return (
        <div className="flex items-center justify-center gap-3 text-[#D9BB74]" aria-hidden="true">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#D9BB74]/70" />
            <Heart className="h-3.5 w-3.5" fill="#D9BB74" strokeWidth={0} />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#D9BB74]/70" />
        </div>
    );
}

export function Wishlist() {
    useGalleryFonts();
    const navigate = useNavigate();

    const [wishlist, setWishlist] = useState([]);
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [error, setError] = useState(null);
    const [planeFlown, setPlaneFlown] = useState(false); // true once the paper plane has flown off
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const pending = useRef(new Set());

    // The loader stays up until the data has arrived AND the plane has flown.
    // Errors skip the wait so nobody watches an animation for a failed request.
    const showLoader = status !== 'error' && (status === 'loading' || !planeFlown);
    const ready = status === 'success' && planeFlown;

    const handleCycleEnd = useCallback(() => setPlaneFlown(true), []);

    function showToast(message) {
        setToast(message);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    }

    
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setStatus('loading');
            setError(null);
            try {
                const res = await axiosInstance.get('/wishlist');
                const list = res.data?.wishlist ?? [];
                if (!cancelled) {
                    setWishlist(list);
                    setStatus('success');
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        (err.response?.status === 401 ? 'Please sign in to view your wishlist.' : null) ||
                        err.message ||
                        'Something went wrong'
                    );
                    setStatus('error');
                }
            }
        }

        load();
        return () => {
            cancelled = true;
            clearTimeout(toastTimer.current);
        };
    }, []);

    
    async function handleRemove(id) {
        if (pending.current.has(id)) return;
        pending.current.add(id);

        const index = wishlist.findIndex((p) => p._id === id);
        const removed = wishlist[index];
        setWishlist((prev) => prev.filter((p) => p._id !== id));

        try {
            await axiosInstance.delete(`/wishlist/${id}`);
        } catch (err) {
            setWishlist((prev) => {
                if (prev.some((p) => p._id === id)) return prev;
                const next = [...prev];
                next.splice(Math.min(index, next.length), 0, removed);
                return next;
            });
            showToast(err.response?.data?.message || err.message || 'Could not remove from wishlist');
        } finally {
            pending.current.delete(id);
        }
    }

    function handleView(product) {
        navigate(`/products/${product._id}`);
    }

    return (
        <div className="relative min-h-screen" style={WALL_STYLE}>
            <style>{`
                @keyframes wl-hang {
                    from { opacity: 0; transform: translateY(-14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .wl-card { width: 100%; max-width: 264px; }
                @media (min-width: 640px)  { .wl-card { width: calc(50% - 1rem); max-width: 264px; } }
                @media (min-width: 1024px) { .wl-card { width: calc(25% - 1.5rem); max-width: 264px; } }
                .wl-seal .wl-disc { box-shadow: 0 6px 14px -4px rgba(0,0,0,0.6); transition: transform 250ms ease; }
                .wl-seal:hover .wl-disc, .wl-seal:focus-visible .wl-disc { transform: scale(1.08); }
                .wl-seal .wl-heart, .wl-seal .wl-x { transition: opacity 220ms ease, transform 280ms ease; }
                .wl-seal .wl-x { opacity: 0; transform: rotate(-90deg) scale(0.5); }
                .wl-seal:hover .wl-x, .wl-seal:focus-visible .wl-x { opacity: 1; transform: none; }
                .wl-seal:hover .wl-heart, .wl-seal:focus-visible .wl-heart { opacity: 0; transform: scale(0.5); }
                .wl-seal .wl-tag { opacity: 0; transform: translateX(10px); pointer-events: none; transition: opacity 220ms ease, transform 260ms ease; }
                .wl-seal:hover .wl-tag, .wl-seal:focus-visible .wl-tag { opacity: 1; transform: none; }
                .wl-view::before { content: ''; position: absolute; inset: 3px; border: 1px solid rgba(217,187,116,0.5); pointer-events: none; transition: inset 250ms ease, border-color 250ms ease; }
                .wl-view:hover::before { inset: 2px; border-color: rgba(217,187,116,0.95); }
                .wl-view .wl-arrow { transition: transform 250ms ease; }
                .wl-view:hover .wl-arrow { transform: translateX(5px); }
                .wl-hang { opacity: 0; animation: wl-hang 600ms cubic-bezier(.2,.7,.2,1) forwards; }
                @media (prefers-reduced-motion: reduce) { .wl-hang { animation: none; opacity: 1; } }
            `}</style>

            {toast && (
                <div
                    role="alert"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 border-2 border-[#B08D2B] px-6 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.15em] text-[#6B1423] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)]"
                    style={PLACARD_STYLE}
                >
                    {toast}
                </div>
            )}

            <Navbar wishlistCount={wishlist.length} />

            {/* picture rail */}
            <div className="h-[3px] bg-gradient-to-r from-[#7C5F1A] via-[#E4C77A] to-[#7C5F1A]" aria-hidden="true" />

            <main className="relative max-w-[1400px] mx-auto px-6 pt-14 pb-24">
                <div className="text-center mb-14">
                    <p className="font-['Cinzel'] text-[11px] font-semibold tracking-[0.4em] text-[#D9BB74] uppercase">
                        The Private Collection
                    </p>
                    <h1
                        className="font-['Italiana'] text-5xl sm:text-6xl md:text-7xl tracking-[0.06em] mt-3 leading-none bg-gradient-to-b from-[#FFF5DA] via-[#F3E7C9] to-[#D9BB74] bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]"
                    >
                        Your WishList
                    </h1>
                    <div className="mt-5">
                        <Ornament />
                    </div>
                    {ready && wishlist.length > 0 && (
                        <p className="font-['Cormorant_Garamond'] italic text-lg text-[#E4D9BC]/85 mt-4 tracking-wide">
                            {wishlist.length} {wishlist.length === 1 ? 'piece' : 'pieces'} held for your consideration
                        </p>
                    )}
                </div>

                {showLoader && (
                    <PaperPlaneLoader onCycleEnd={handleCycleEnd} label="Loading wishlist…" />
                )}

                {status === 'error' && (
                    <div className="text-center py-20">
                        <p className="font-['Cormorant_Garamond'] italic text-xl text-[#F3E7C9]">
                            Couldn't open the collection — {error}
                        </p>
                    </div>
                )}

                {ready && wishlist.length === 0 && (
                    <div className="text-center py-16">
                        {/* an empty frame awaiting its first piece */}
                        <div className="mx-auto w-44">
                            <GoldFrame ratio="aspect-[4/5]">
                                <div className="h-full w-full flex items-center justify-center" style={PLACARD_STYLE}>
                                    <Heart className="h-8 w-8 text-[#B08D2B]" strokeWidth={1.25} />
                                </div>
                            </GoldFrame>
                        </div>
                        <p className="font-['Cormorant_Garamond'] italic text-2xl text-[#F3E7C9] mt-8">
                            The wall awaits its first piece.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/products')}
                            className="mt-6 border border-[#D9BB74] px-8 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#F3E7C9] transition-colors hover:bg-[#D9BB74] hover:text-[#4E0E19]"
                        >
                            BROWSE THE COLLECTION
                        </button>
                    </div>
                )}

                {ready && wishlist.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-12">
                        {wishlist.map((product, i) => (
                            <WishlistCard
                                key={product._id}
                                product={product}
                                index={i}
                                onView={handleView}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Wishlist;