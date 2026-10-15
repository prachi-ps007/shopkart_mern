import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Star, Wheat } from 'lucide-react';
import Navbar from '../components/Navbar.jsx'; // adjust path to where Navbar.jsx lives

/*
  Loom & Jade — Home
  Built around the same devices as Signup.jsx / Login.jsx, not a
  generic product-grid: the pinned parchment "scroll" card (brass rod
  + corner brackets), the carved gilt picture-frame, and the burgundy
  wax-seal medallion all reappear here so the home page reads as the
  same gallery, not a different site.

  Requires Cinzel, Cormorant Garamond and Pinyon Script loaded
  globally (same stack as Signup.jsx / Login.jsx).

  Palette:
    parchment  #F3ECDB   page ground, faint grid
    cream      #FBF7EC   card / panel ground
    gold       #B08D2B   frames, rods, rules, primary CTA
    gold-light #D9BB74   hover, hairline
    burgundy   #6B1423   seal, wordmark, price, the one bold section
    ink        #2B2620   primary text
    ink-muted  #6B5D4F   secondary text
*/

/* ---------- The brass rod the scroll card hangs from (top & bottom of the hero) ---------- */
function Rod() {
    return (
        <div className="relative h-2 bg-gradient-to-b from-[#E4C77A] via-[#B08D2B] to-[#8A6A1D] rounded-full mx-1">
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-gradient-to-br from-[#E4C77A] to-[#8A6A1D]" />
            <span className="absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-gradient-to-br from-[#E4C77A] to-[#8A6A1D]" />
        </div>
    );
}

/* ---------- Small L-shaped corner brackets, as on the register card ---------- */
function CornerBrackets({ color = '#B08D2B' }) {
    return (
        <>
            {['top-3 left-3', 'top-3 right-3 rotate-90', 'bottom-3 left-3 -rotate-90', 'bottom-3 right-3 rotate-180'].map((pos, i) => (
                <span
                    key={i}
                    className={`absolute ${pos} h-3 w-3 border-t-2 border-l-2`}
                    style={{ borderColor: color }}
                />
            ))}
        </>
    );
}

/* ---------- A tiny hand-drawn flourish for the carved frame corners ---------- */
function Flourish({ className = '' }) {
    return (
        <svg viewBox="0 0 40 40" className={`absolute h-6 w-6 ${className}`} fill="none">
            <path
                d="M2 2c8 0 10 6 10 10s-4 8-8 8 6 10 14 10"
                stroke="#E4C77A"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

/* ---------- The carved gilt picture-frame from Login.jsx, reused for the hero exhibit ---------- */
function OrnateFrame({ children, className = '' }) {
    return (
        <div className={`relative p-4 sm:p-5 bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] shadow-[0_20px_45px_-18px_rgba(43,38,32,0.5)] ${className}`}>
            <div className="p-1.5 border border-[#7C5F1A]/70">
                <div className="relative overflow-hidden bg-[#0F0D0B]">{children}</div>
            </div>
            <Flourish className="top-1 left-1" />
            <Flourish className="top-1 right-1 -scale-x-100" />
            <Flourish className="bottom-1 left-1 -scale-y-100" />
            <Flourish className="bottom-1 right-1 -scale-x-100 -scale-y-100" />
        </div>
    );
}

/* ---------- Lighter-weight gilt frame for grid-scale images (product cards, wing
   tiles, editorial photos). Same gold-gradient-mat construction as OrnateFrame,
   just without the flourishes, so smaller images get the same "framed exhibit"
   treatment as the hero without feeling overloaded. Pass `ratio` for aspect-ratio
   classes and `hoverZoom` to keep the existing image scale-on-hover behavior. */
function GoldFrame({ children, className = '', ratio = 'aspect-[4/5]', hoverZoom = true }) {
    return (
        <div className={`relative p-[5px] bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] shadow-[0_10px_24px_-12px_rgba(43,38,32,0.45)] ${className}`}>
            <div className="p-[2px] border border-[#7C5F1A]/60">
                <div className={`group relative overflow-hidden bg-[#0F0D0B] ${ratio}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ---------- The burgundy wax-seal medallion from Signup.jsx ---------- */
function Seal({ size = 'h-11 w-11' }) {
    return (
        <div className={`${size} rounded-full bg-gradient-to-br from-[#7A1B2C] to-[#5A0F1C] border-2 border-[#D9BB74] flex items-center justify-center shrink-0`}>
            <Wheat className="h-5 w-5 text-[#D9BB74]" strokeWidth={1.5} />
        </div>
    );
}

function Rating({ value, count }) {
    return (
        <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < value ? 'fill-[#B08D2B] text-[#B08D2B]' : 'text-[#D9BB74]'}`} />
                ))}
            </div>
            <span className="text-[11px] text-[#8A7F6C]">({count})</span>
        </div>
    );
}

function ProductCard({ image, title, price, rating, count }) {
    return (
        <div className="group">
            <GoldFrame ratio="aspect-[4/5]">
                <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
            </GoldFrame>
            <div className="mt-3">
                <h3 className="font-['Cormorant_Garamond'] text-lg text-[#2B2620]">{title}</h3>
                <div className="flex items-baseline justify-between mt-0.5">
                    <span className="font-['Cinzel'] text-xs text-[#6B1423]">{price}</span>
                </div>
                <Rating value={rating} count={count} />
            </div>
            <button className="mt-3 w-full border border-[#B08D2B] text-[#6B5D4F] hover:text-[#2B2620] hover:border-[#2B2620] font-['Cinzel'] text-[10px] tracking-[0.2em] py-2.5 transition-colors">
                ADD TO CART
            </button>
        </div>
    );
}

function WingTile({ image, label }) {
    return (
        <a href="#" className="group block text-center">
            <GoldFrame ratio="aspect-square">
                <img src={image} alt={label} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
            </GoldFrame>
            <p className="font-['Cinzel'] text-[11px] tracking-[0.18em] text-[#2B2620] mt-3 group-hover:text-[#6B1423] transition-colors">
                {label}
            </p>
        </a>
    );
}

export function Home() {
    const prefersReducedMotion = useReducedMotion();

    const wings = [
        { label: 'WOMEN', image: 'https://picsum.photos/seed/lj-women/400/400' },
        { label: 'MEN', image: 'https://picsum.photos/seed/lj-men/400/400' },
        { label: 'ELECTRONICS', image: 'https://picsum.photos/seed/lj-electronics/400/400' },
        { label: 'HOME & LIVING', image: 'https://picsum.photos/seed/lj-home/400/400' },
        { label: 'COLLECTIONS', image: 'https://picsum.photos/seed/lj-collections/400/400' },
    ];

    const textileEdit = [
        { title: 'Cashmere Throw', price: '$320', rating: 5, count: 42, image: 'https://picsum.photos/seed/lj-throw/600/750' },
        { title: 'Linen Duvet Set', price: '$280', rating: 4, count: 36, image: 'https://picsum.photos/seed/lj-duvet/600/750' },
        { title: 'Silk Pillowcase', price: '$95', rating: 4, count: 18, image: 'https://picsum.photos/seed/lj-pillowcase/600/750' },
        { title: 'Woven Accent Rug', price: '$420', rating: 5, count: 27, image: 'https://picsum.photos/seed/lj-rug/600/750' },
        { title: 'Cotton Waffle Robe', price: '$160', rating: 4, count: 21, image: 'https://picsum.photos/seed/lj-robe/600/750' },
    ];

    const trending = [
        { title: 'Aura ANC Headphones', price: '$249', rating: 4, count: 182, image: 'https://picsum.photos/seed/lj-headphones/600/750' },
        { title: 'Chronos Pocket Watch', price: '$650', rating: 5, count: 87, image: 'https://picsum.photos/seed/lj-watch/600/750' },
        { title: 'The Bellamy Bag', price: '$420', rating: 5, count: 63, image: 'https://picsum.photos/seed/lj-bag/600/750' },
    ];

    return (
        <div className="relative bg-[#F3ECDB] min-h-screen [background-image:radial-gradient(#00000009_1px,transparent_1px)] [background-size:24px_24px]">

            {/* Checkbox / grid pattern overlay — same device as Login.jsx / Signup.jsx, dialed
                back to 0.15 opacity so it doesn't fight the dot texture and product imagery */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(138, 115, 93, 0.15) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(138, 115, 93, 0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: "28px 28px",
                }}
                aria-hidden="true"
            />

            {/* Page content sits above both background layers */}
            <div className="relative z-10">

                {/* Shared navbar (same as every other page) */}
                <Navbar />

                {/* Hero — the pinned scroll card, exactly like Signup.jsx's device.
                    The card ground carries the same woven mount-board texture
                    + warm vignette as Login.jsx, instead of a flat cream fill. */}
                <section className="max-w-6xl mx-auto px-6 pt-14 pb-20">
                    <Rod />
                    <div
                        className="relative border-x border-[#B08D2B]/30 px-8 sm:px-14 py-14"
                        style={{
                            backgroundColor: "#FBF6EA",
                            backgroundImage: `
                                repeating-linear-gradient(135deg, rgba(139,107,58,0.05) 0px, rgba(139,107,58,0.05) 1px, transparent 1px, transparent 3px),
                                repeating-linear-gradient(45deg, rgba(139,107,58,0.035) 0px, rgba(139,107,58,0.035) 1px, transparent 1px, transparent 3px),
                                radial-gradient(ellipse 80% 65% at 50% 40%, rgba(255,253,247,0.9) 0%, rgba(230,217,190,0.35) 100%)
                            `,
                        }}
                    >
                        <CornerBrackets />

                        <div className="grid md:grid-cols-[1fr_0.95fr] gap-12 items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <Seal size="h-8 w-8" />
                                    <p className="font-['Cinzel'] text-[10px] tracking-[0.25em] text-[#8A6A1D]">
                                        EXHIBIT № 01 — AUTUMN ACQUISITIONS
                                    </p>
                                </div>
                                <h1 className="font-['Cormorant_Garamond'] text-[3.75rem] sm:text-[5rem] md:text-[6rem] text-[#2B2620] leading-[0.95] tracking-tight">
                                    The Hartwell Coat
                                </h1>
                                <p className="font-['Cinzel'] text-[10px] tracking-[0.2em] text-[#6B1423] mt-4">
                                    CATALOGUE № LJ-014 &nbsp;·&nbsp; $680
                                </p>
                                <p className="font-['Cormorant_Garamond'] text-lg text-[#6B5D4F] leading-relaxed max-w-md mt-6">
                                    Cut from Scottish wool and finished entirely by hand — an
                                    heirloom silhouette built to outlast the trends around it.
                                </p>
                                <div className="flex items-center gap-6 mt-8">
                                    <button className="bg-[#B08D2B] hover:bg-[#8A6A1D] text-[#F3ECDB] font-['Cinzel'] text-[11px] tracking-[0.2em] px-8 py-3.5 transition-colors">
                                        SHOP THE PIECE
                                    </button>
                                    <Link to="/products" className="font-['Cormorant_Garamond'] italic text-[#2B2620] inline-flex items-center gap-1.5 hover:text-[#6B1423] transition-colors">
                                        Browse the collection <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>

                            <motion.div
                                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, rotate: -1 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <OrnateFrame>
                                    <div className="aspect-[4/5]">
                                        <img
                                            src="https://i.pinimg.com/1200x/63/1e/bd/631ebd83996ca8bb8bbb102915560da1.jpg"
                                            alt="The Hartwell Coat"
                                            className="h-full w-full object-cover object-top"
                                        />
                                    </div>
                                </OrnateFrame>
                            </motion.div>
                        </div>
                    </div>
                    <Rod />
                </section>

                {/* Wing directory — tiles now sit in the same gilt frame as the product cards */}
                <section className="max-w-7xl mx-auto px-6 pb-20">
                    <p className="font-['Cinzel'] text-[11px] tracking-[0.25em] text-[#8A6A1D] text-center mb-8">
                        THE WINGS
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-8">
                        {wings.map((w) => (
                            <WingTile key={w.label} {...w} />
                        ))}
                    </div>
                </section>

                {/* Featured wing — product row */}
                <section className="bg-[#EAE1C8] border-y border-[#B08D2B]/30">
                    <div className="max-w-7xl mx-auto px-6 py-20">
                        <div className="grid md:grid-cols-[0.55fr_1fr] gap-12 items-center mb-14">
                            <GoldFrame ratio="aspect-[16/10]">
                                <img src="https://picsum.photos/seed/lj-textile/900/560" alt="The Textile Edit" className="h-full w-full object-cover" />
                            </GoldFrame>
                            <div>
                                <p className="font-['Cinzel'] text-[11px] tracking-[0.25em] text-[#8A6A1D]">FEATURED WING</p>
                                <h2 className="font-['Cormorant_Garamond'] text-4xl text-[#2B2620] mt-3">The Textile Collection</h2>
                                <p className="font-['Cormorant_Garamond'] italic text-[#6B5D4F] mt-2">
                                    Heritage weaves. Modern form. Timeless comfort, artfully made.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                            {textileEdit.map((p) => (
                                <ProductCard key={p.title} {...p} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Trending */}
                <section className="max-w-7xl mx-auto px-6 py-20">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <p className="font-['Cinzel'] text-[11px] tracking-[0.25em] text-[#8A6A1D]">TRENDING NOW</p>
                            <h2 className="font-['Cormorant_Garamond'] text-4xl text-[#2B2620] mt-2">What Patrons Are Acquiring</h2>
                        </div>
                        <a href="#" className="font-['Cormorant_Garamond'] italic text-[#2B2620] hover:text-[#6B1423] inline-flex items-center gap-1.5 transition-colors">
                            View all <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {trending.map((p) => (
                            <ProductCard key={p.title} {...p} />
                        ))}
                    </div>
                </section>

                {/* The one bold, dark moment — burgundy, not charcoal, to stay in the seal's own palette */}
                <section className="bg-[#5A0F1C] text-[#F3ECDB]">
                    <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="font-['Cinzel'] text-[11px] tracking-[0.25em] text-[#D9BB74]">FROM THE ARCHIVES</p>
                            <h2 className="font-['Cormorant_Garamond'] text-4xl mt-3 leading-tight">
                                On the Craft Behind a Hand-Finished Seam
                            </h2>
                            <p className="font-['Cormorant_Garamond'] text-lg text-[#E8CFCF] mt-4 leading-relaxed max-w-md">
                                A conversation with our tailoring workshop on why every
                                Hartwell coat takes eleven hours longer to finish than the
                                industry standard — and why that's the point.
                            </p>
                            <a href="#" className="mt-6 inline-flex items-center gap-1.5 font-['Cinzel'] text-[11px] tracking-[0.2em] text-[#D9BB74] hover:text-[#F3ECDB] transition-colors">
                                READ THE ENTRY <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                        </div>
                        <GoldFrame ratio="aspect-[16/10]">
                            <img src="https://picsum.photos/seed/lj-workshop/900/560" alt="The workshop" className="h-full w-full object-cover" />
                        </GoldFrame>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-[#B08D2B]/30">
                    <div className="max-w-7xl mx-auto px-6 py-16 grid sm:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10">
                        <div>
                            <div className="flex items-center gap-3">
                                <Seal size="h-9 w-9" />
                                <span className="font-['Pinyon_Script'] text-3xl text-[#6B1423]">Loom &amp; Jade</span>
                            </div>
                            <p className="font-['Cormorant_Garamond'] italic text-[#6B5D4F] mt-3 max-w-xs">
                                A small gallery of considered things, patronised since 2024.
                            </p>
                            <div className="mt-6">
                                <p className="font-['Cinzel'] text-[10px] tracking-[0.2em] text-[#8A6A1D] mb-2">JOIN THE PATRON LIST</p>
                                <div className="flex border border-[#B08D2B] max-w-xs">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="flex-1 bg-transparent px-3 py-2 text-sm text-[#2B2620] placeholder:text-[#8A7F6C] focus:outline-none"
                                    />
                                    <button className="bg-[#B08D2B] text-[#F3ECDB] font-['Cinzel'] text-[10px] tracking-[0.15em] px-4">JOIN</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="font-['Cinzel'] text-[11px] tracking-[0.2em] text-[#2B2620] mb-4">THE GALLERY</p>
                            <ul className="space-y-2 font-['Cormorant_Garamond'] text-[#6B5D4F]">
                                <li><a href="#" className="hover:text-[#6B1423] transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-[#6B1423] transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-[#6B1423] transition-colors">The Journal</a></li>
                            </ul>
                        </div>

                        <div>
                            <p className="font-['Cinzel'] text-[11px] tracking-[0.2em] text-[#2B2620] mb-4">VISIT</p>
                            <ul className="space-y-2 font-['Cormorant_Garamond'] text-[#6B5D4F]">
                                <li><a href="#" className="hover:text-[#6B1423] transition-colors">Shipping</a></li>
                                <li><a href="#" className="hover:text-[#6B1423] transition-colors">Returns</a></li>
                                <li><a href="#" className="hover:text-[#6B1423] transition-colors">Care Guide</a></li>
                            </ul>
                        </div>

                        <div>
                            <p className="font-['Cinzel'] text-[11px] tracking-[0.2em] text-[#2B2620] mb-4">PATRONAGE</p>
                            <ul className="space-y-2 font-['Cormorant_Garamond'] text-[#6B5D4F]">
                                <li><a href="#" className="hover:text-[#6B1423] transition-colors">Your Account</a></li>
                                <li><a href="#" className="hover:text-[#6B1423] transition-colors">Wishlist</a></li>
                                <li><a href="#" className="hover:text-[#6B1423] transition-colors">Gift Cards</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-[#B08D2B]/20 py-5 text-center font-['Cinzel'] text-[10px] tracking-[0.15em] text-[#8A7F6C]">
                        © 2026 LOOM &amp; JADE — ALL RIGHTS RESERVED
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Home;