import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ChevronDown } from 'lucide-react';
import { axiosInstance } from '../axiosCalls/axios.js';
import Navbar from '../components/Navbar.jsx';

/*
  Loom & Jade — Products
  Reuses the same devices as Home.jsx (GoldFrame, Seal, corner-bracket
  texture, Cinzel / Cormorant Garamond / Pinyon Script type system) so
  the listing page reads as part of the same gallery rather than a
  generic product grid bolted onto the site.

  Fetches GET /products?search=&category= and renders cards dynamically
  — nothing here is hardcoded. Expected shape per product (adjust field
  names to match your actual API if they differ):

    {
      _id: string,
      name: string,
      image: string,
      price: number,
      category: string,
      stock: number
    }
*/

const CATEGORIES = ['All Categories', 'Electronics', 'Fashion', 'Books', 'Home'];
const SEARCH_DEBOUNCE_MS = 400;

/* Same gilt-mat frame construction as Home.jsx's GoldFrame */
function GoldFrame({ children, ratio = 'aspect-[4/5]' }) {
    return (
        <div className="relative p-[5px] bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] shadow-[0_10px_24px_-12px_rgba(43,38,32,0.45)]">
            <div className="p-[2px] border border-[#7C5F1A]/60">
                <div className={`group relative overflow-hidden bg-[#0F0D0B] ${ratio}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function useGalleryFonts() {
    useEffect(() => {
        const href =
            'https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Pinyon+Script&display=swap';
        if (document.querySelector(`link[href="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }, []);
}

function formatPrice(value) {
    if (typeof value !== 'number') return value;

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

/* ---------- Search bar + category dropdown, styled to match the
   gallery's gilt hairline inputs (same border/type treatment as the
   footer's email input on Home.jsx) ---------- */
/* Same L-shaped gilt corner brackets used on the hero scroll card in Home.jsx */
function CornerBrackets({ color = '#B08D2B' }) {
    return (
        <>
            {['top-2 left-2', 'top-2 right-2 rotate-90', 'bottom-2 left-2 -rotate-90', 'bottom-2 right-2 rotate-180'].map((pos, i) => (
                <span
                    key={i}
                    className={`absolute ${pos} h-3 w-3 border-t-2 border-l-2`}
                    style={{ borderColor: color }}
                />
            ))}
        </>
    );
}

/* One "plaque" — the shared texture + corner-bracket treatment used for
   both the search field and the category dropdown below, so each reads
   as its own small museum placard rather than a plain form control. */
function Plaque({ children, className = '' }) {
    return (
        <div
            className={`relative border border-[#B08D2B]/50 shadow-[0_8px_20px_-12px_rgba(43,38,32,0.35)] transition-colors focus-within:border-[#6B1423] focus-within:shadow-[0_8px_20px_-10px_rgba(107,20,35,0.35)] ${className}`}
            style={{
                backgroundColor: '#FBF6EA',
                backgroundImage: `
                    repeating-linear-gradient(135deg, rgba(139,107,58,0.05) 0px, rgba(139,107,58,0.05) 1px, transparent 1px, transparent 3px),
                    repeating-linear-gradient(45deg, rgba(139,107,58,0.035) 0px, rgba(139,107,58,0.035) 1px, transparent 1px, transparent 3px)
                `,
            }}
        >
            <CornerBrackets />
            {children}
        </div>
    );
}

/* ---------- Search + filter — two individual plaques (same texture +
   gilt corner brackets as the hero card), sitting side by side rather
   than fused into one shared bar. ---------- */
function SearchFilterBar({ search, onSearchChange, category, onCategoryChange }) {
    return (
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
                <span className="font-['Cinzel'] text-[10px] tracking-[0.25em] text-[#8A6A1D]">
                    SEEK &amp; DISCOVER
                </span>
                <span className="flex-1 h-px bg-gradient-to-r from-[#6B1423]/40 to-transparent" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <Plaque className="group flex-[2]">
                    <div className="flex items-center px-5">
                        <Search className="h-4 w-4 text-[#8A6A1D] shrink-0 transition-colors group-focus-within:text-[#6B1423]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search the collection..."
                            className="h-14 w-full bg-transparent pl-3 pr-2 font-['Cormorant_Garamond'] text-lg text-[#2B2620] placeholder:text-[#8A7F6C] placeholder:italic focus:outline-none"
                        />
                    </div>
                </Plaque>

                <Plaque className="sm:flex-1">
                    <div className="flex items-center px-5">
                        <select
                            value={category}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="h-14 w-full appearance-none bg-transparent pr-6 font-['Cinzel'] text-[11px] tracking-[0.15em] text-[#6B1423] focus:outline-none cursor-pointer"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c.toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A6A1D] pointer-events-none" />
                    </div>
                </Plaque>
            </div>
        </div>
    );
}

function StockBadge({ stock }) {
    const outOfStock = !stock || stock <= 0;
    return (
        <p
            className={`font-['Cormorant_Garamond'] text-sm mt-1 ${
                outOfStock ? 'text-[#6B1423] italic' : 'text-[#6B5D4F]'
            }`}
        >
            {outOfStock ? 'Out of stock' : `${stock} units left`}
        </p>
    );
}

function ProductCard({ product, onViewDetails, wishlisted, onToggleWishlist }) {
    const { name, image, price, category, stock } = product;
    const outOfStock = !stock || stock <= 0;

    return (
        <div className="group h-full flex flex-col">
            <GoldFrame ratio="aspect-[4/5]">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-[#8A7F6C] font-['Cinzel'] text-[10px] tracking-[0.2em]">
                        NO IMAGE
                    </div>
                )}

                {/* Wishlist — visible on hover only, slides up from the frame's bottom edge */}
                <button
                    type="button"
                    onClick={() => onToggleWishlist(product._id)}
                    aria-pressed={wishlisted}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    style={{
                        backgroundColor: '#F3E7C9',
                        backgroundImage: `
                            repeating-linear-gradient(135deg, rgba(139,107,58,0.16) 0px, rgba(139,107,58,0.16) 1px, transparent 1px, transparent 4px),
                            repeating-linear-gradient(45deg, rgba(139,107,58,0.10) 0px, rgba(139,107,58,0.10) 1px, transparent 1px, transparent 4px)
                        `,
                    }}
                    className={`absolute z-10 inset-x-0 bottom-0 flex items-center justify-center gap-2 py-3
                        border-t-2 border-[#B08D2B]
                        font-['Cinzel'] font-bold text-[11px] tracking-[0.2em]
                        translate-y-full opacity-0 transition-all duration-300 ease-out
                        group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100
                        ${wishlisted ? 'text-[#6B1423]' : 'text-[#2B2620] hover:text-[#6B1423]'}`}
                >
                    <Heart
                        className="h-4 w-4 transition-transform duration-200 active:scale-125"
                        strokeWidth={1.5}
                        fill={wishlisted ? '#6B1423' : 'none'}
                        stroke={wishlisted ? '#6B1423' : 'currentColor'}
                    />
                    {wishlisted ? 'WISHLISTED' : 'WISHLIST'}
                </button>
            </GoldFrame>

            <div className="mt-3 flex-1">
                <p className="font-['Cinzel'] text-[10px] tracking-[0.2em] text-[#8A6A1D]">
                    {category?.toUpperCase()}
                </p>
                <h3 className="font-['Cormorant_Garamond'] text-lg text-[#2B2620] mt-1 leading-snug line-clamp-2">
                    {name}
                </h3>
                <p className="font-['Cinzel'] text-xs text-[#6B1423] mt-1">{formatPrice(price)}</p>
                <StockBadge stock={stock} />
            </div>

            <button
                onClick={() => onViewDetails(product)}
                disabled={outOfStock}
                className={`mt-3 w-full border font-['Cinzel'] text-[10px] tracking-[0.2em] py-2.5 transition-colors ${
                    outOfStock
                        ? 'border-[#D9BB74]/60 text-[#B0A88F] cursor-not-allowed'
                        : 'border-[#B08D2B] text-[#6B5D4F] hover:text-[#2B2620] hover:border-[#2B2620]'
                }`}
            >
                VIEW DETAILS
            </button>
        </div>
    );
}

function ProductGridSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-[#E4D9BC]" />
                    <div className="h-2 w-16 bg-[#E4D9BC] mt-3" />
                    <div className="h-4 w-32 bg-[#E4D9BC] mt-2" />
                    <div className="h-3 w-20 bg-[#E4D9BC] mt-2" />
                </div>
            ))}
        </div>
    );
}

export function Products() {
    useGalleryFonts();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [error, setError] = useState(null);

    // Raw input the user is typing — updates every keystroke.
    const [searchInput, setSearchInput] = useState('');
    // Debounced value actually sent to the API.
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All Categories');

    // Wishlisted product ids — loaded from GET /wishlist on mount.
    const [wishlist, setWishlist] = useState(() => new Set());

    // Ids with a wishlist request in flight — blocks double-clicks racing each other.
    const pendingWishlist = useRef(new Set());
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    function setWishlisted(id, on) {
        setWishlist((prev) => {
            const next = new Set(prev);
            on ? next.add(id) : next.delete(id);
            return next;
        });
    }

    // Load the saved wishlist once so hearts are filled on first paint.
    // Accepts { wishlist: [...] }, { products: [...] } or a bare array, where
    // each entry is an id or an object ({ _id } or { product }) — adjust to your API.
    useEffect(() => {
        let cancelled = false;

        async function loadWishlist() {
            try {
                const res = await axiosInstance.get('/wishlist');
                const raw = res.data?.wishlist ?? res.data?.products ?? res.data ?? [];
                const list = Array.isArray(raw) ? raw : raw.items ?? [];
                const ids = list.map((item) => {
                    if (typeof item === 'string') return item;
                    const p = item.product ?? item;
                    return typeof p === 'string' ? p : p._id;
                });
                if (!cancelled) setWishlist(new Set(ids.filter(Boolean)));
            } catch (err) {
                // Not signed in or request failed — start with an empty wishlist.
                console.error('Could not load wishlist:', err.response?.status, err.message);
            }
        }

        loadWishlist();
        return () => {
            cancelled = true;
        };
    }, []);

    // Optimistic: the heart flips instantly, then POST/DELETE runs in the
    // background. If the request fails, the heart is rolled back.
    async function toggleWishlist(id) {
        if (pendingWishlist.current.has(id)) return;
        pendingWishlist.current.add(id);

        const wasWishlisted = wishlist.has(id);
        setWishlisted(id, !wasWishlisted);

        try {
            if (wasWishlisted) {
                await axiosInstance.delete(`/wishlist/${id}`);
            } else {
                await axiosInstance.post(`/wishlist/${id}`);
            }
        } catch (err) {
            setWishlisted(id, wasWishlisted);
            const message =
                err.response?.data?.message ||
                (err.response?.status === 401 ? 'Please sign in to use your wishlist.' : null) ||
                err.message ||
                'Could not update wishlist';
            console.error('Wishlist update failed:', err.response?.status, message, err);
            setToast(message);
            clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setToast(null), 3500);
        } finally {
            pendingWishlist.current.delete(id);
        }
    }

    // Debounce: wait for the user to pause typing before updating `search`,
    // so we don't fire a request on every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        let cancelled = false;

        async function fetchProducts() {
            setStatus('loading');
            setError(null);

            try {
                const params = {};
                if (search) params.search = search;
                if (category && category !== 'All Categories') params.category = category;

                const res = await axiosInstance.get('/products', { params });

                const list = res.data.products ?? [];

                if (!cancelled) {
                    setProducts(list);
                    setStatus('success');
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        'Something went wrong'
                    );
                    setStatus('error');
                }
            }
        }

        fetchProducts();
        return () => {
            cancelled = true;
        };
    }, [search, category]);

    function handleViewDetails(product) {
        navigate(`/products/${product._id}`);
    }

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

            {toast && (
                <div
                    role="alert"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 border-2 border-[#B08D2B] bg-[#FBF6EA] px-6 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.15em] text-[#6B1423] shadow-[0_10px_24px_-12px_rgba(43,38,32,0.45)]"
                >
                    {toast}
                </div>
            )}

            <div className="relative z-10">
                <Navbar wishlistCount={wishlist.size} />

                <section className="max-w-7xl mx-auto px-6 pt-8 pb-20">
                    <div className="text-center mb-6">
                        <p className="font-['Cinzel'] text-[11px] tracking-[0.25em] text-[#8A6A1D]">
                            THE COLLECTION
                        </p>
                        <h1 className="font-['Cormorant_Garamond'] text-5xl text-[#2B2620] mt-2">
                            All Products
                        </h1>
                    </div>

                    <SearchFilterBar
                        search={searchInput}
                        onSearchChange={setSearchInput}
                        category={category}
                        onCategoryChange={setCategory}
                    />

                    {status === 'loading' && <ProductGridSkeleton />}

                    {status === 'error' && (
                        <div className="text-center py-20">
                            <p className="font-['Cormorant_Garamond'] italic text-lg text-[#6B1423]">
                                Couldn't load the collection — {error}
                            </p>
                        </div>
                    )}

                    {status === 'success' && products.length === 0 && (
                        <div className="text-center py-20">
                            <p className="font-['Cormorant_Garamond'] italic text-lg text-[#6B5D4F]">
                                {search || category !== 'All Categories'
                                    ? 'No pieces match your search.'
                                    : 'No pieces in the collection yet.'}
                            </p>
                        </div>
                    )}

                    {status === 'success' && products.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                            {products.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onViewDetails={handleViewDetails}
                                    wishlisted={wishlist.has(product._id)}
                                    onToggleWishlist={toggleWishlist}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Products;