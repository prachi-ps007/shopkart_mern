import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux"
import { addToCart } from "../redux/cartSlice.js"
import {
    ArrowLeft,
    Truck,
    RotateCcw,
    ShieldCheck,
} from 'lucide-react';
import { axiosInstance } from '../axiosCalls/axios.js';
import Navbar from '../components/Navbar.jsx';

/* ---------- Fonts ---------- */

function useGalleryFonts() {
    useEffect(() => {
        const href =
            'https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Bodoni+Moda:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Pinyon+Script&display=swap';

        if (document.querySelector(`link[href="${href}"]`)) {
            return;
        }

        const link = document.createElement('link');

        link.rel = 'stylesheet';
        link.href = href;

        document.head.appendChild(link);
    }, []);
}

/* ---------- Helpers ---------- */

function formatPrice(value) {
    if (typeof value !== 'number') {
        return value;
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

function shortSku(product) {
    if (product.sku) {
        return product.sku;
    }

    if (!product._id) {
        return null;
    }

    return `#${product._id.slice(-6).toUpperCase()}`;
}

/* ---------- Decorative corners ---------- */

function CornerBrackets({ color = '#B08D2B' }) {
    return (
        <>
            {[
                'top-3 left-3',
                'top-3 right-3 rotate-90',
                'bottom-3 left-3 -rotate-90',
                'bottom-3 right-3 rotate-180',
            ].map((position, index) => (
                <span
                    key={index}
                    className={`absolute ${position} h-3 w-3 border-t-2 border-l-2 pointer-events-none`}
                    style={{ borderColor: color }}
                />
            ))}
        </>
    );
}

/* ---------- Hanging scroll ---------- */

function Dowel({ flip = false }) {
    return (
        <div className="relative flex items-center h-6 -mx-3 shrink-0">

            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] border border-[#7C5F1A]/70 shadow-[0_2px_4px_rgba(43,38,32,0.35)] shrink-0" />

            <span
                className={`flex-1 h-3 bg-gradient-to-b from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] ${
                    flip
                        ? 'shadow-[0_-3px_8px_-3px_rgba(43,38,32,0.4)]'
                        : 'shadow-[0_3px_8px_-3px_rgba(43,38,32,0.4)]'
                }`}
            />

            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] border border-[#7C5F1A]/70 shadow-[0_2px_4px_rgba(43,38,32,0.35)] shrink-0" />

        </div>
    );
}

function ScrollFrame({ children }) {
    return (
        <div className="h-full min-h-0 flex flex-col">

            <Dowel />

            <div
                className="relative flex-1 min-h-0 flex flex-col border-x border-[#B08D2B]/40 shadow-[0_20px_45px_-18px_rgba(43,38,32,0.4)]"
                style={{
                    backgroundColor: '#FBF6EA',
                    backgroundImage:
                        'repeating-linear-gradient(135deg, rgba(139,107,58,0.05) 0px, rgba(139,107,58,0.05) 1px, transparent 1px, transparent 3px)',
                }}
            >

                <div className="p-3 flex-1 min-h-0 flex">

                    <div className="relative overflow-hidden bg-[#FBF6EA] flex-1 min-h-0">
                        {children}
                    </div>

                </div>

                <span className="absolute -top-1 left-8 h-3 w-[3px] bg-[#6B1423] rotate-6" />

                <span className="absolute -bottom-1 right-8 h-3 w-[3px] bg-[#6B1423] -rotate-6" />

            </div>

            <Dowel flip />

        </div>
    );
}

/* ---------- Section label ---------- */

function SectionLabel({ children }) {
    return (
        <div className="flex items-center gap-3 mb-2">

            <span className="font-['Bodoni_Moda'] font-semibold text-[12px] tracking-[0.06em] text-[#D9BB74]">
                {children}
            </span>

            <span className="flex-1 h-px bg-[#D9BB74]/30" />

        </div>
    );
}

/* ---------- Loading skeleton ---------- */

function DetailsSkeleton() {
    return (
        <div className="grid md:grid-cols-[1.15fr_1fr] gap-6 h-full min-h-0 animate-pulse">

            <div className="h-full min-h-0 bg-[#E4D9BC]" />

            <div className="space-y-4 pt-4">

                <div className="h-2 w-32 bg-[#E4D9BC]" />

                <div className="h-10 w-3/4 bg-[#E4D9BC]" />

                <div className="h-3 w-24 bg-[#E4D9BC]" />

                <div className="h-3 w-full bg-[#E4D9BC]" />

                <div className="h-3 w-5/6 bg-[#E4D9BC]" />

                <div className="h-3 w-2/3 bg-[#E4D9BC]" />

                <div className="h-12 w-48 bg-[#E4D9BC] mt-6" />

            </div>

        </div>
    );
}

/* ---------- Product Details Page ---------- */

export function ProductDetails() {

    useGalleryFonts();

    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const { loading } = useSelector((state) => state.cart)

    const [product, setProduct] = useState(null);

    const [status, setStatus] = useState('loading');

    const [error, setError] = useState(null);

    const [added, setAdded] = useState(false);

    const [imageFailed, setImageFailed] = useState(false);

    const [wishlistCount, setWishlistCount] = useState(0);


    /* ---------- Get Product ---------- */

    useEffect(() => {

        let cancelled = false;

        async function fetchProduct() {

            setStatus('loading');

            setError(null);

            setAdded(false);

            setImageFailed(false);

            try {

                const res = await axiosInstance.get(`/products/${id}`);

                const data = res.data?.product ?? res.data;

                if (!cancelled) {

                    setProduct(data);

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

        fetchProduct();

        return () => {
            cancelled = true;
        };

    }, [id]);


    /* ---------- Get Wishlist Count ---------- */

    useEffect(() => {

        async function getWishlistCount() {

            try {

                const res = await axiosInstance.get('/wishlist');

                const list = res.data?.wishlist ?? [];

                setWishlistCount(list.length);

            } catch (err) {

                // User may not be logged in.
                // In that case, just show 0.
                setWishlistCount(0);

            }
        }

        getWishlistCount();

    }, []);


    /* ---------- Product State ---------- */

    const outOfStock =
        !product?.stock || product.stock <= 0;

    const lowStock =
        !outOfStock && product.stock <= 5;


    /* ---------- Product Specifications ---------- */

    const specRows = product
        ? [
              ['Category', product.category],
              ['Material', product.material],
              ['Dimensions', product.dimensions],
              ['SKU', shortSku(product)],
          ].filter(([, value]) => Boolean(value))
        : [];


    const handleAddToCart = async () => {
    try {
        await dispatch(addToCart(product._id)).unwrap()
        setAdded(true)
    } catch (error) {
        console.log(error)
    }
}


    /* ---------- Render ---------- */

    return (

        <div className="relative h-screen overflow-hidden bg-[#F3ECDB] [background-image:radial-gradient(#00000009_1px,transparent_1px)] [background-size:24px_24px]">

            {/* Background grid */}

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

            <div className="relative z-10 h-full flex flex-col">

                {/* ---------- NEW NAVBAR ---------- */}

                <Navbar wishlistCount={wishlistCount} />


                {/* ---------- Main Content ---------- */}

                <main className="flex-1 min-h-0 overflow-hidden">

                    <section className="max-w-7xl mx-auto px-6 py-3 h-full flex flex-col">


                        {/* ---------- Back Button ---------- */}

                        <button
                            onClick={() => navigate('/products')}
                            className="shrink-0 inline-flex items-center gap-1.5 font-['Cinzel'] text-[10px] tracking-[0.2em] text-[#6B5D4F] hover:text-[#6B1423] transition-colors mb-3"
                        >

                            <ArrowLeft className="h-3.5 w-3.5" />

                            BACK TO THE COLLECTION

                        </button>


                        {/* ---------- Loading ---------- */}

                        {status === 'loading' && (

                            <div className="flex-1 min-h-0">

                                <DetailsSkeleton />

                            </div>

                        )}


                        {/* ---------- Error ---------- */}

                        {status === 'error' && (

                            <div className="flex-1 flex items-center justify-center text-center">

                                <p className="font-['Cormorant_Garamond'] italic text-lg text-[#6B1423]">

                                    Couldn't load this piece — {error}

                                </p>

                            </div>

                        )}


                        {/* ---------- Product ---------- */}

                        {status === 'success' && product && (

                            <div className="flex-1 min-h-0 grid md:grid-cols-[1.15fr_1fr] gap-6 items-stretch">


                                {/* ---------- Product Image ---------- */}

                                <div className="min-h-0 h-full w-[84%] justify-self-center">

                                    <ScrollFrame>

                                        {product.image && !imageFailed ? (

                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                onError={() =>
                                                    setImageFailed(true)
                                                }
                                                className="h-full w-full object-cover object-center"
                                            />

                                        ) : (

                                            <div className="h-full w-full flex items-center justify-center text-[#8A7F6C] font-['Cinzel'] text-[10px] tracking-[0.2em]">

                                                NO IMAGE

                                            </div>

                                        )}

                                    </ScrollFrame>

                                </div>


                                {/* ---------- Details Card ---------- */}

                                <div className="relative min-h-0 overflow-hidden rounded-3xl border border-[#D9BB74]/40 bg-[#4A0E18] shadow-[0_20px_45px_-20px_rgba(43,38,32,0.5)] px-6 py-6 sm:px-7 sm:py-7">

                                    <CornerBrackets color="#D9BB74" />

                                    <div className="relative z-10 h-full flex flex-col justify-between gap-4">


                                        {/* ---------- Category ---------- */}

                                        <div
                                            className="self-start inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B08D2B]/60"
                                            style={{
                                                backgroundColor: '#F3ECDB',
                                                backgroundImage:
                                                    'repeating-linear-gradient(45deg, rgba(139,107,58,0.09) 0px, rgba(139,107,58,0.09) 1px, transparent 1px, transparent 4px)',
                                            }}
                                        >

                                            <span className="h-1.5 w-1.5 rotate-45 bg-[#8A6A1D] shrink-0" />

                                            <p className="font-['Cinzel'] text-[9px] tracking-[0.2em] text-[#8A6A1D]">

                                                {(
                                                    product.category ||
                                                    'The Collection'
                                                ).toUpperCase()}

                                            </p>

                                        </div>


                                        {/* ---------- Product Name ---------- */}

                                        <h1 className="font-['Bodoni_Moda'] font-semibold text-3xl sm:text-4xl text-[#D9BB74] leading-[1.05] tracking-tight">

                                            {product.name}

                                        </h1>


                                        {/* ---------- Price + Stock ---------- */}

                                        <div className="space-y-1">

                                            <div className="inline-block px-4 py-1 rounded-full bg-[#D9BB74] text-[#4A1019]">

                                                <span className="font-['Cinzel'] text-xs tracking-[0.1em]">

                                                    {formatPrice(product.price)}

                                                </span>

                                            </div>


                                            <p
                                                className={`font-['Cormorant_Garamond'] text-sm ${
                                                    outOfStock || lowStock
                                                        ? 'text-[#F8F2E2] font-medium italic'
                                                        : 'text-[#D9BB74]'
                                                }`}
                                            >

                                                {outOfStock
                                                    ? 'Out of stock'
                                                    : lowStock
                                                      ? `Only ${product.stock} left — going quickly`
                                                      : `${product.stock} units left`}

                                            </p>

                                        </div>


                                        {/* ---------- Description ---------- */}

                                        {product.description && (

                                            <div>

                                                <SectionLabel>
                                                    The Story
                                                </SectionLabel>

                                                <p className="font-['Cormorant_Garamond'] text-base text-[#E9DCC0] leading-snug max-w-md">

                                                    {product.description}

                                                </p>

                                            </div>

                                        )}


                                        {/* ---------- Product Details ---------- */}

                                        {specRows.length > 0 && (

                                            <div>

                                                <SectionLabel>
                                                    The Details
                                                </SectionLabel>


                                                <dl className="max-w-md divide-y divide-[#D9BB74]/25 rounded-2xl border border-[#D9BB74]/40 px-4">

                                                    {specRows.map(
                                                        ([label, value]) => (

                                                            <div
                                                                key={label}
                                                                className="flex items-center justify-between gap-4 py-2.5"
                                                            >

                                                                <dt className="font-['Cinzel'] text-[9px] tracking-[0.12em] text-[#D9BB74]">

                                                                    {label.toUpperCase()}

                                                                </dt>


                                                                <dd className="font-['Cormorant_Garamond'] text-sm font-medium text-white text-right">

                                                                    {value}

                                                                </dd>

                                                            </div>

                                                        )
                                                    )}

                                                </dl>

                                            </div>

                                        )}


                                        {/* ---------- Shipping ---------- */}

                                        <div>

                                            <SectionLabel>
                                                Shipping &amp; Care
                                            </SectionLabel>


                                            <ul className="space-y-2 max-w-md">

                                                <li className="flex items-center gap-3 font-['Cormorant_Garamond'] text-sm text-[#E9DCC0]">

                                                    <Truck
                                                        className="h-4 w-4 text-[#D9BB74] shrink-0"
                                                        strokeWidth={1.5}
                                                    />

                                                    Dispatched within 2–3 business
                                                    days

                                                </li>


                                                <li className="flex items-center gap-3 font-['Cormorant_Garamond'] text-sm text-[#E9DCC0]">

                                                    <RotateCcw
                                                        className="h-4 w-4 text-[#D9BB74] shrink-0"
                                                        strokeWidth={1.5}
                                                    />

                                                    30-day returns on unused
                                                    pieces

                                                </li>


                                                <li className="flex items-center gap-3 font-['Cormorant_Garamond'] text-sm text-[#E9DCC0]">

                                                    <ShieldCheck
                                                        className="h-4 w-4 text-[#D9BB74] shrink-0"
                                                        strokeWidth={1.5}
                                                    />

                                                    1-year warranty against
                                                    defects

                                                </li>

                                            </ul>

                                        </div>


                                        {/* ---------- Add To Cart ---------- */}

                                        <div>

                                            <button
                                                onClick={handleAddToCart}
                                                disabled={outOfStock || loading}
                                                
                                                className={`rounded-full font-['Cinzel'] text-[10px] tracking-[0.2em] px-7 py-3 transition-colors ${
                                                    outOfStock
                                                        ? 'bg-[#D9BB74]/50 text-[#F3ECDB] cursor-not-allowed'
                                                        : 'bg-[#B08D2B] hover:bg-[#8A6A1D] text-[#F3ECDB]'
                                                }`}
                                            >

                                               {outOfStock
                                                ? "OUT OF STOCK"
                                                : loading
                                                ? "ADDING..."
                                                : added
                                                ? "ADDED TO BAG"
                                                : "ADD TO BAG"}

                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        )}

                    </section>

                </main>

            </div>

        </div>
    );
}

export default ProductDetails;