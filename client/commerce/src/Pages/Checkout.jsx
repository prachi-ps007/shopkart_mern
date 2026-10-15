import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShieldCheck, ArrowLeft, Lock, Check, Loader2, ShoppingBag, MapPin } from 'lucide-react';
import { axiosInstance } from '../axiosCalls/axios.js';
import Navbar from '../components/Navbar.jsx';
import { toLine } from '../components/CartItem.jsx';
import { fetchCart } from '../redux/cartSlice.js';

/*
  Loom & Jade — Checkout ("The Rotunda Stair")
  A calm lapis-and-limestone wall. A small pale-blue gingham check sits behind the whole page,
  arched windows with half-dome fanlights flank the title, and three arched chambers show the way (Bag → Details → Confirm). The Acquisition Ledger and the Consignment Invoice stand
  in arched niches; the invoice arch is a plain lapis vault.

  Cart:   Redux cart slice (same source as Cart.jsx); fetched if not hydrated. Empty bag → /cart.
  Pay:    POST /orders/create-payment-order { shippingAddress }  → Razorpay modal
          POST /orders/verify-payment { razorpay_order_id, razorpay_payment_id, razorpay_signature }
          The server builds the order from the customer's saved cart and clears it after verification.
*/

const LAPIS = '#1B365D';
const LAPIS_DARK = '#0F2342';
const MAHOGANY = '#4A2318';
const GOLD = '#D9BB74';
const GOLD_DEEP = '#B08D2B';
const ERROR = '#8A2A1A';

const FREE_DISPATCH_ABOVE = 5000; // ₹ — keep in sync with Cart.jsx
const DISPATCH_FEE = 199;         // ₹

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh',
    'Puducherry',
];

const FIELDS = {
    fullName: { label: 'FULL NAME', placeholder: 'As it should appear on the parcel', autoComplete: 'name' },
    phone: { label: 'PHONE NUMBER', placeholder: '10-digit mobile number', autoComplete: 'tel', inputMode: 'numeric' },
    address: { label: 'SHIPPING ADDRESS', placeholder: 'House, street, landmark', autoComplete: 'street-address' },
    city: { label: 'CITY', placeholder: 'City or town', autoComplete: 'address-level2' },
    state: { label: 'STATE', placeholder: 'Choose or type a state', autoComplete: 'address-level1' },
    pincode: { label: 'PINCODE', placeholder: '6 digits', autoComplete: 'postal-code', inputMode: 'numeric' },
};

const EMPTY_FORM = { fullName: '', phone: '', address: '', city: '', state: '', pincode: '' };

/* ---------- textures ---------- */

/* A small, pale powder-blue gingham on cream — kept light and low-contrast so the wall recedes
   and the two niches carry the page. Two translucent bands; crossings read as the deepest squares. */
const CHECK_BLUE = '#7F9DBB';
const WALL_PATTERN = (() => {
    const T = 40; // one repeat = 2 x 2 cells of 20px
    const C = T / 2;
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}" viewBox="0 0 ${T} ${T}">` +
        `<rect width="${T}" height="${T}" fill="#F7F3EA"/>` +
        `<rect x="0" y="0" width="${C}" height="${T}" fill="${CHECK_BLUE}" fill-opacity="0.22"/>` +
        `<rect x="0" y="0" width="${T}" height="${C}" fill="${CHECK_BLUE}" fill-opacity="0.22"/>` +
        `</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

/* a faint linen weave over the check, plus a soft wash of light behind the title */
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

/* deep lapis, a soft lift of light toward the base — used for the invoice vault and amount due */
const LAPIS_PANEL_STYLE = {
    backgroundColor: LAPIS_DARK,
    backgroundImage: `
        radial-gradient(ellipse at 50% 130%, rgba(217,187,116,0.16), transparent 62%),
        linear-gradient(180deg, #1B365D 0%, #0F2342 100%)
    `,
};

/* arch radii — static strings so Tailwind keeps them */
const ARCH_WIDE = {
    outer: 'rounded-t-[110px] sm:rounded-t-[170px]',
    mid: 'rounded-t-[107px] sm:rounded-t-[167px]',
    inner: 'rounded-t-[105px] sm:rounded-t-[165px]',
};
const ARCH_TALL = {
    outer: 'rounded-t-[170px]',
    mid: 'rounded-t-[167px]',
    inner: 'rounded-t-[165px]',
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
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

/* load Razorpay's checkout script once, on demand */
function loadRazorpay() {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existing) {
            existing.addEventListener('load', () => resolve(true));
            existing.addEventListener('error', () => resolve(false));
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

function validate(form) {
    const errors = {};
    Object.keys(FIELDS).forEach((key) => {
        if (!form[key].trim()) errors[key] = 'This line must be completed.';
    });
    if (!errors.phone && !/^\d{10}$/.test(form.phone.replace(/[\s-]/g, ''))) {
        errors.phone = 'Enter a 10-digit mobile number.';
    }
    if (!errors.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
        errors.pincode = 'Enter a 6-digit pincode.';
    }
    return errors;
}

/* small scroll ornament used as a divider */
function IronworkDivider({ className = 'my-6', color = LAPIS }) {
    return (
        <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden="true">
            <span className="h-px flex-1" style={{ backgroundImage: `linear-gradient(90deg, transparent, ${color}99, ${color})` }} />
            <svg className="h-6 w-20" viewBox="0 0 80 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
                <circle cx="40" cy="12" r="4.5" />
                <path d="M35.5 12C35.5 6.5 28 4 22 7C17 9.5 17.5 15.5 22 16C25.5 16.3 27 13.5 25 11.8" />
                <path d="M44.5 12C44.5 6.5 52 4 58 7C63 9.5 62.5 15.5 58 16C54.5 16.3 53 13.5 55 11.8" />
                <path d="M18 12H4M62 12H76" />
                <circle cx="40" cy="12" r="1.2" fill={GOLD_DEEP} stroke="none" />
            </svg>
            <span className="h-px flex-1" style={{ backgroundImage: `linear-gradient(270deg, transparent, ${color}99, ${color})` }} />
        </div>
    );
}

/* curled corner brackets in lapis iron */
function ScrollBrackets({ color = LAPIS, bottomOnly = false }) {
    const all = [
        'top-2 left-2',
        'top-2 right-2 rotate-90',
        'bottom-2 left-2 -rotate-90',
        'bottom-2 right-2 rotate-180',
    ];
    const spots = bottomOnly ? all.slice(2) : all;
    return (
        <>
            {spots.map((pos) => (
                <svg
                    key={pos}
                    viewBox="0 0 28 28"
                    className={`pointer-events-none absolute h-6 w-6 ${pos}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    aria-hidden="true"
                >
                    <path d="M2 26V11C2 5.5 5.5 2 11 2H26" />
                    <path d="M8 9.5a2.4 2.4 0 1 1 2.4 2.4" />
                    <circle cx="26" cy="2" r="1" fill={color} stroke="none" />
                    <circle cx="2" cy="26" r="1" fill={color} stroke="none" />
                </svg>
            ))}
        </>
    );
}

/* ---------- the header: a loggia of arched windows stepping up to a grand portal ---------- */

/* outermost → innermost; the same list is mirrored on the right */
const SIDE_WINDOWS = [
    { w: 96, h: 176, ribs: 5, show: 'hidden lg:block' },
    { w: 126, h: 226, ribs: 7, show: 'hidden sm:block' },
];

/* One arched window: gilt frame, lapis inner line, a half-dome fanlight (radiating ribs and
   concentric rings) over either glazing bars or a parchment plaque that carries the title.
   A slow band of light crosses each pane in turn. */
function ArchWindow({ uid, w, h, ribs, plaque = false, fluid = false, delay = 0, className = '', children }) {
    const inset = 4;
    const R = w / 2 - inset;
    const cx = w / 2;
    const sy = inset + R; // the spring line, where the half-dome meets the body
    const yb = h - 6; // bottom of the glass, above the sill
    const x0 = inset;
    const x1 = w - inset;
    const R2 = R - 5;

    const archPath = (g) => {
        const r = R - g;
        return `M${x0 + g} ${yb}V${sy}A${r} ${r} 0 0 1 ${x1 - g} ${sy}V${yb}Z`;
    };

    const ribEnds = Array.from({ length: ribs }, (_, i) => {
        const a = Math.PI + (Math.PI * (i + 1)) / (ribs + 1);
        return [cx + R2 * Math.cos(a), sy + R2 * Math.sin(a)];
    });
    const rings = [0.55].map((f) => R2 * f);

    const cols = Math.max(2, Math.round(w / 48));
    const mullions = Array.from({ length: cols - 1 }, (_, k) => x0 + ((x1 - x0) * (k + 1)) / cols);

    return (
        <div
            className={`relative ${fluid ? 'min-w-0 shrink' : 'shrink-0'} ${className}`}
            style={fluid ? { width: '100%', maxWidth: w } : { width: w }}
        >
            <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" aria-hidden="true">
                <defs>
                    <clipPath id={`co-clip-${uid}`}>
                        <path d={archPath(2)} />
                    </clipPath>
                </defs>

                {/* soft ground shadow */}
                <ellipse cx={cx} cy={h - 2} rx={w * 0.46} ry="3" fill={LAPIS} fillOpacity="0.08" />

                {/* glass */}
                <path d={archPath(2)} fill="url(#co-sky)" />
                {plaque && (
                    <g clipPath={`url(#co-clip-${uid})`}>
                        <rect x="0" y={sy} width={w} height={yb - sy + 2} fill="url(#co-parch)" />
                    </g>
                )}

                {/* half-dome fanlight */}
                <g stroke={LAPIS} strokeOpacity="0.42" strokeWidth="0.9" fill="none" strokeLinecap="round">
                    {ribEnds.map(([x, y], i) => (
                        <line key={i} x1={cx} y1={sy} x2={x} y2={y} />
                    ))}
                    {rings.map((r, i) => (
                        <path key={i} d={`M${cx - r} ${sy}A${r} ${r} 0 0 1 ${cx + r} ${sy}`} />
                    ))}
                    <path d={`M${x0 + 4} ${sy}H${x1 - 4}`} strokeOpacity="0.7" strokeWidth="1.2" />
                </g>
                <circle cx={cx} cy={sy} r="2.2" fill="#FBF8F1" stroke="url(#co-gilt)" strokeWidth="1" />

                {/* glazing bars below the spring line */}
                {!plaque && (
                    <g stroke={LAPIS} strokeOpacity="0.4" strokeWidth="0.9" fill="none">
                        {mullions.map((x) => (
                            <line key={`m${x}`} x1={x} y1={sy} x2={x} y2={yb} />
                        ))}
                    </g>
                )}

                {/* a band of light crossing the pane */}
                <g clipPath={`url(#co-clip-${uid})`}>
                    <rect
                        className="co-glint"
                        x={-w * 0.4}
                        y="0"
                        width={w * 0.35}
                        height={h}
                        fill="url(#co-glintg)"
                        style={{ animationDelay: `${delay}s` }}
                    />
                </g>

                {/* frame: gilt outer, lapis inner */}
                <path d={archPath(0)} fill="none" stroke="url(#co-gilt)" strokeWidth="3" strokeLinejoin="round" />
                <path d={archPath(3)} fill="none" stroke={LAPIS} strokeOpacity="0.85" strokeWidth="1" />

                {/* sill */}
                <rect x={x0 - 2} y={yb} width={x1 - x0 + 4} height="6" fill="url(#co-gilt)" />
            </svg>

            {children && (
                <div
                    className="absolute inset-x-[7%] flex flex-col items-center justify-center text-center"
                    style={{ top: `${(sy / h) * 100}%`, bottom: `${(6 / h) * 100}%` }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

function RotundaHeader({ placed }) {
    return (
        <header className="relative mx-auto pt-4">
            {/* shared gradients for every window */}
            <svg width="0" height="0" className="absolute" aria-hidden="true">
                <defs>
                    <linearGradient id="co-gilt" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#F2DC9B" />
                        <stop offset="0.5" stopColor={GOLD_DEEP} />
                        <stop offset="1" stopColor="#E4C77A" />
                    </linearGradient>
                    <linearGradient id="co-sky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#F4F9FF" />
                        <stop offset="0.45" stopColor="#C4DBF3" />
                        <stop offset="1" stopColor="#9CC0E8" />
                    </linearGradient>
                    <linearGradient id="co-parch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#FDFBF5" />
                        <stop offset="1" stopColor="#F0E8D6" />
                    </linearGradient>
                    <linearGradient id="co-glintg" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="#fff" stopOpacity="0" />
                        <stop offset="0.5" stopColor="#fff" stopOpacity="0.3" />
                        <stop offset="1" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            {/* a breath of light behind the whole loggia */}
            <div
                className="co-shaft pointer-events-none absolute inset-x-0 bottom-0 top-6"
                style={{ backgroundImage: 'radial-gradient(ellipse 58% 72% at 50% 62%, rgba(255,255,255,0.92), rgba(255,255,255,0) 72%)' }}
                aria-hidden="true"
            />
            {/* the loggia: arched windows flank the title, set directly on the wall */}
            <div className="relative flex items-end justify-center gap-3 sm:gap-4">
                {SIDE_WINDOWS.map((cfg, i) => (
                    <ArchWindow key={`l${i}`} uid={`l${i}`} w={cfg.w} h={cfg.h} ribs={cfg.ribs} className={cfg.show} delay={i * 0.45} />
                ))}

                <div className="relative flex min-h-[150px] w-full min-w-0 max-w-[480px] shrink flex-col items-center justify-center self-stretch px-2 text-center">
                    <h1
                        className={`font-['Italiana'] leading-[1] tracking-[0.05em] text-[#1B365D] [-webkit-text-stroke:1.2px_#1B365D] [text-shadow:0_0_28px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)] ${
                            placed
                                ? 'max-w-[11ch] text-[clamp(1.9rem,4.4vw,3.2rem)]'
                                : 'text-[clamp(3rem,8vw,6rem)]'
                        }`}
                    >
                        {placed ? 'Acquisition Confirmed' : 'Checkout'}
                    </h1>
                </div>

                {[...SIDE_WINDOWS].reverse().map((cfg, i) => (
                    <ArchWindow
                        key={`r${i}`}
                        uid={`r${i}`}
                        w={cfg.w}
                        h={cfg.h}
                        ribs={cfg.ribs}
                        className={cfg.show}
                        delay={2.7 + i * 0.45}
                    />
                ))}
            </div>

            {/* hairline gilt floor line beneath the loggia */}
            <div
                className="relative h-[2px]"
                style={{ backgroundImage: `linear-gradient(90deg, transparent, ${GOLD_DEEP} 14%, ${GOLD} 50%, ${GOLD_DEEP} 86%, transparent)` }}
                aria-hidden="true"
            />
        </header>
    );
}

/* ---------- three arched chambers: Bag → Details → Confirm ---------- */

function Chambers({ detailsDone, placed }) {
    const steps = [
        { key: 'bag', label: 'YOUR BAG', Icon: ShoppingBag, state: 'done' },
        { key: 'details', label: 'DETAILS', Icon: MapPin, state: placed || detailsDone ? 'done' : 'current' },
        { key: 'confirm', label: 'CONFIRM', Icon: Lock, state: placed ? 'done' : detailsDone ? 'current' : 'pending' },
    ];

    return (
        <ol className="mx-auto mt-5 flex items-start justify-center" aria-label="Checkout progress">
            {steps.map((s, i) => (
                <React.Fragment key={s.key}>
                    {i > 0 && (
                        <li aria-hidden="true" className="mt-10 w-10 border-t-2 border-dotted sm:w-32 md:w-52" style={{ borderColor: `${LAPIS}80` }} />
                    )}
                    <li className="flex flex-col items-center" aria-current={s.state === 'current' ? 'step' : undefined}>
                        <div
                            className={`relative flex h-[76px] w-[58px] items-center justify-center rounded-t-full border-2 transition-all duration-700 ${
                                ''
                            }`}
                            style={{
                                boxShadow: s.state === 'current' ? '0 0 0 4px rgba(217,187,116,0.35)' : undefined,
                                borderColor: s.state === 'pending' ? `${LAPIS}59` : LAPIS,
                                ...(s.state === 'done' ? GOLD_FOIL_STYLE : PARCHMENT_STYLE),
                                opacity: s.state === 'pending' ? 0.75 : 1,
                            }}
                        >
                            <span className="pointer-events-none absolute inset-[4px] rounded-t-full border" style={{ borderColor: `${GOLD_DEEP}99` }} />
                            {s.state === 'done' ? (
                                <Check className="relative h-6 w-6" style={{ color: LAPIS }} strokeWidth={2.4} />
                            ) : (
                                <s.Icon
                                    className="relative h-6 w-6"
                                    style={{ color: s.state === 'pending' ? `${LAPIS}73` : LAPIS }}
                                    strokeWidth={1.5}
                                />
                            )}
                        </div>
                        <span
                            className="mt-2 font-['Cinzel'] text-[10px] font-semibold tracking-[0.2em]"
                            style={{ color: s.state === 'pending' ? '#8A7F6C' : LAPIS }}
                        >
                            {s.label}
                        </span>
                    </li>
                </React.Fragment>
            ))}
        </ol>
    );
}

/* ---------- arched niche (archivolt of gold, lapis and plaster) ---------- */

function ArchNiche({ arch, className = '', style, children, label }) {
    return (
        <section aria-label={label} className={`relative ${className}`} style={style}>
            <div className={`${arch.outer} bg-gradient-to-b from-[#F2DC9B] via-[#B08D2B] to-[#E4C77A] p-[3px] shadow-[0_16px_36px_-12px_rgba(27,54,93,0.35)]`}>
                <div className={`${arch.mid} p-[2px]`} style={{ backgroundColor: LAPIS }}>
                    <div className={`${arch.inner} relative overflow-hidden`} style={PARCHMENT_STYLE}>
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------- ledger field ---------- */

function LedgerField({ name, value, error, ok, onChange, onBlur, className = '', multiline = false, list }) {
    const cfg = FIELDS[name];
    const id = `checkout-${name}`;
    const shared = {
        id,
        name,
        value,
        onChange,
        onBlur,
        placeholder: cfg.placeholder,
        autoComplete: cfg.autoComplete,
        inputMode: cfg.inputMode,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? `${id}-error` : undefined,
        className:
            "w-full bg-transparent pl-5 pr-12 font-['Cormorant_Garamond'] text-lg font-medium text-[#2B2620] placeholder:text-[#8A7F6C] placeholder:italic focus:outline-none",
    };

    return (
        <div className={className}>
            <label htmlFor={id} className="mb-2 block font-['Cinzel'] text-[10px] font-semibold tracking-[0.2em] text-[#1B365D]">
                {cfg.label}
            </label>
            <div
                className={`relative border shadow-[0_8px_18px_-14px_rgba(15,35,66,0.5)] transition-colors focus-within:border-[#1B365D] focus-within:shadow-[0_8px_20px_-10px_rgba(27,54,93,0.45)] ${
                    error ? 'border-[#8A2A1A]' : ok ? 'border-[#1B365D]/60' : 'border-[#B08D2B]/55'
                }`}
                style={PARCHMENT_STYLE}
            >
                {multiline ? (
                    <textarea {...shared} rows={3} className={`${shared.className} resize-none py-3 leading-snug`} />
                ) : (
                    <input {...shared} type="text" list={list} className={`${shared.className} h-12`} />
                )}
                {ok && (
                    <Check
                        className={`pointer-events-none absolute right-4 h-4 w-4 ${multiline ? 'top-4' : 'top-1/2 -translate-y-1/2'}`}
                        style={{ color: GOLD_DEEP }}
                        strokeWidth={2.4}
                        aria-hidden="true"
                    />
                )}
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1.5 font-['Cormorant_Garamond'] text-[15px] font-semibold italic" style={{ color: ERROR }}>
                    {error}
                </p>
            )}
        </div>
    );
}

function SummaryLine({ label, value, valueClass = '' }) {
    return (
        <div className="flex items-end gap-3">
            <span className="font-['Cormorant_Garamond'] text-base font-semibold text-[#2B2620]">{label}</span>
            <span className="mb-1.5 flex-1 border-b-2 border-dotted border-[#1B365D]/40" aria-hidden="true" />
            <span className={`font-['Cinzel'] text-xs font-semibold tracking-[0.08em] text-[#2B2620] ${valueClass}`}>{value}</span>
        </div>
    );
}

function MicroFrame({ children, className = '' }) {
    return (
        <div className={`relative bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] p-[3px] shadow-[0_6px_12px_-6px_rgba(15,35,66,0.55)] ${className}`}>
            <div className="border border-[#1B365D]/70">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#0F0D0B]">{children}</div>
            </div>
        </div>
    );
}

/* a ring of gold sparks released when the order is accepted */
function Burst() {
    return (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
                <span
                    key={i}
                    className="co-burst absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-[6px] w-[6px] rounded-full bg-[#F2DC9B]"
                    style={{ '--a': `${i * 20}deg`, animationDelay: `${(i % 3) * 60}ms`, boxShadow: '0 0 8px 2px rgba(242,220,155,0.9)' }}
                />
            ))}
        </div>
    );
}

/* ---------- page ---------- */

export function Checkout() {
    useGalleryFonts();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { cartItems, fetching, hydrated, error: cartError } = useSelector((state) => state.cart);

    const [form, setForm] = useState(EMPTY_FORM);
    const [touched, setTouched] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [placed, setPlaced] = useState(null); // { orderId, firstName, city } once accepted
    const [wishlistCount, setWishlistCount] = useState(0);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    useEffect(() => {
        if (!hydrated) dispatch(fetchCart());
        return () => clearTimeout(toastTimer.current);
    }, [dispatch, hydrated]);

    useEffect(() => {
        axiosInstance
            .get('/wishlist')
            .then((res) => setWishlistCount((res.data?.wishlist ?? []).length))
            .catch(() => setWishlistCount(0));
    }, []);

    function showToast(message) {
        setToast(message);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 4000);
    }

    /* ---------- totals ---------- */
    const lines = useMemo(() => (cartItems ?? []).map(toLine).filter((l) => l.product), [cartItems]);
    const pieces = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce(
        (sum, l) => sum + (typeof l.product.price === 'number' ? l.product.price * l.quantity : 0),
        0
    );
    const freeDispatch = subtotal >= FREE_DISPATCH_ABOVE;
    const shippingFee = lines.length === 0 || freeDispatch ? 0 : DISPATCH_FEE;
    const total = subtotal + shippingFee;

    const loading = !hydrated || (fetching && lines.length === 0);
    const failed = !loading && cartError && lines.length === 0;
    const empty = !loading && !cartError && lines.length === 0 && !placed;

    // An empty bag has nothing to check out — send the visitor back to it.
    useEffect(() => {
        if (empty) navigate('/cart', { replace: true });
    }, [empty, navigate]);

    /* ---------- form ---------- */
    const errors = validate(form);
    const formValid = Object.keys(errors).length === 0;
    const visibleError = (key) => (touched[key] || submitAttempted ? errors[key] : undefined);
    const isOk = (key) => Boolean(touched[key] && !errors[key] && form[key].trim());

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function handleBlur(e) {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting) return;
        setSubmitAttempted(true);

        const firstInvalid = Object.keys(FIELDS).find((k) => errors[k]);
        if (firstInvalid) {
            document.getElementById(`checkout-${firstInvalid}`)?.focus();
            return;
        }

        // keys must match the shippingAddress schema in order.model.js
        const shippingAddress = {
            fullName: form.fullName.trim(),
            phone: form.phone.replace(/[\s-]/g, ''),
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
        };
        const firstName = shippingAddress.fullName.split(' ')[0];

        setSubmitting(true);
        try {
            const loaded = await loadRazorpay();
            if (!loaded) throw new Error('Could not load the payment window. Check your connection and try again.');

            // the server prices the order from the saved cart and creates the Razorpay order
            const { data } = await axiosInstance.post('/orders/create-payment-order', { shippingAddress });
            const { order, razorpay } = data;

            const rzp = new window.Razorpay({
                key: razorpay.keyId,
                amount: razorpay.amount,
                currency: razorpay.currency,
                order_id: razorpay.orderId,
                name: 'Loom & Jade',
                description: `${pieces} ${pieces === 1 ? 'piece' : 'pieces'}`,
                prefill: { name: shippingAddress.fullName, contact: shippingAddress.phone },
                theme: { color: LAPIS },
                modal: { ondismiss: () => setSubmitting(false) },
                handler: async (response) => {
                    try {
                        const verified = await axiosInstance.post('/orders/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        setPlaced({
                            orderId: verified.data?.orderId ?? order?.id ?? null,
                            firstName,
                            city: shippingAddress.city,
                        });
                        dispatch(fetchCart()); // the server empties the bag after verification
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } catch (err) {
                        showToast(
                            err.response?.data?.message ||
                            'Payment received, but we could not confirm it. Please contact support.'
                        );
                    } finally {
                        setSubmitting(false);
                    }
                },
            });

            rzp.on('payment.failed', (resp) => {
                showToast(resp?.error?.description || 'Payment failed. Please try again.');
                setSubmitting(false);
            });

            rzp.open();
        } catch (err) {
            showToast(
                err.response?.data?.message ||
                (err.response?.status === 401 ? 'Please sign in to place your order.' : null) ||
                err.message ||
                'Could not start your payment'
            );
            setSubmitting(false);
        }
    }

    /* ---------- render ---------- */
    return (
        <div className="relative min-h-screen overflow-x-hidden" style={PAGE_STYLE}>
            <style>{`
                @keyframes co-enter { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
                .co-enter { animation: co-enter 700ms cubic-bezier(.2,.7,.2,1) both; }

                @keyframes co-mote {
                    0%   { opacity: 0; transform: translate(0, 0); }
                    15%  { opacity: .95; }
                    85%  { opacity: .8; }
                    100% { opacity: 0; transform: translate(var(--dx), -230px); }
                }
                .co-mote { animation: co-mote 12s linear infinite; }

                @keyframes co-shaft { 0%, 100% { opacity: .55; } 50% { opacity: .95; } }
                .co-shaft { animation: co-shaft 7s ease-in-out infinite; }

                @keyframes co-glint { 0% { transform: translateX(0); } 38% { transform: translateX(520%); } 100% { transform: translateX(520%); } }
                .co-glint { transform-box: fill-box; animation: co-glint 10s ease-in-out infinite; }

                @keyframes co-stamp { 0% { opacity: 0; transform: scale(1.7) rotate(-10deg); } 60% { opacity: 1; transform: scale(.95) rotate(2deg); } 100% { opacity: 1; transform: none; } }
                .co-stamp { animation: co-stamp 800ms cubic-bezier(.2,.8,.2,1) both; }

                @keyframes co-burst {
                    0%   { opacity: 1; transform: rotate(var(--a)) translateY(-10px) scale(1); }
                    100% { opacity: 0; transform: rotate(var(--a)) translateY(-96px) scale(.2); }
                }
                .co-burst { animation: co-burst 1.3s cubic-bezier(.15,.7,.3,1) both; }

                .co-cta::before { content: ''; position: absolute; inset: 3px; border: 1px solid rgba(217,187,116,.5); pointer-events: none; transition: inset 250ms ease, border-color 250ms ease; }
                .co-cta:not(:disabled):hover::before { inset: 2px; border-color: rgba(217,187,116,.95); }

                @media (prefers-reduced-motion: reduce) {
                    .co-enter, .co-shaft,
                    .co-mote { animation: none; opacity: .5; transform: translateY(-120px); }
                    .co-glint { animation: none; opacity: 0; }
                }
            `}</style>

            {toast && (
                <div
                    role="alert"
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border-2 border-[#1B365D] px-6 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.15em] text-[#1B365D] shadow-[0_16px_36px_-12px_rgba(27,54,93,0.45)]"
                    style={PARCHMENT_STYLE}
                >
                    {toast}
                </div>
            )}

            <Navbar wishlistCount={wishlistCount} />

            {/* plain gilt line beneath the navbar */}
            <div className="h-[3px] bg-[#B08D2B]" aria-hidden="true" />

            <main className="relative mx-auto max-w-7xl px-6 pb-20 pt-6">
                {!placed && (
                    <button
                        type="button"
                        onClick={() => navigate('/cart')}
                        className="mb-5 inline-flex items-center gap-1.5 font-['Cinzel'] text-[10px] tracking-[0.2em] text-[#4A2318] transition-colors hover:text-[#1B365D]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        BACK TO YOUR BAG
                    </button>
                )}

                {/* ---------- header ---------- */}
                <RotundaHeader placed={Boolean(placed)} />

                <Chambers detailsDone={formValid && lines.length > 0} placed={Boolean(placed)} />

                {/* ---------- states ---------- */}
                {(loading || empty) && (
                    <div role="status" className="py-16 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1B365D]" strokeWidth={1.5} />
                        <p className="mt-5 font-['Cormorant_Garamond'] text-xl italic text-[#4A3F33]">Preparing your consignment…</p>
                    </div>
                )}

                {failed && (
                    <div className="py-16 text-center">
                        <p className="font-['Cormorant_Garamond'] text-xl italic text-[#4A3F33]">
                            We couldn't retrieve your bag. Check your connection and try again.
                        </p>
                        <button
                            type="button"
                            onClick={() => dispatch(fetchCart())}
                            className="mt-6 border-2 border-[#1B365D] px-8 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#1B365D] transition-colors hover:bg-[#1B365D] hover:text-[#D9BB74]"
                        >
                            TRY AGAIN
                        </button>
                    </div>
                )}

                {/* ---------- order placed ---------- */}
                {placed && (
                    <div className="co-enter mx-auto mt-12 max-w-xl">
                        <ArchNiche arch={ARCH_WIDE} label="Order confirmation">
                            <div className="relative px-8 pb-10 pt-20 text-center">
                                <ScrollBrackets bottomOnly />
                                <div className="relative mx-auto h-20 w-20">
                                    <Burst />
                                    <div className="co-stamp relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D9BB74] shadow-[0_8px_18px_-6px_rgba(15,35,66,0.7)]" style={LAPIS_PANEL_STYLE}>
                                        <Check className="h-9 w-9 text-[#D9BB74]" strokeWidth={2} />
                                    </div>
                                </div>
                                <h2 className="mt-6 font-['Bodoni_Moda'] text-3xl font-semibold text-[#1B365D]">Thank you, {placed.firstName}.</h2>
                                <p className="mx-auto mt-3 max-w-sm font-['Cormorant_Garamond'] text-lg font-medium leading-snug text-[#2B2620]">
                                    Your order has been placed. We'll dispatch it to {placed.city} within 2–3 business days.
                                </p>
                                {placed.orderId && (
                                    <p className="mt-5 font-['Cinzel'] text-[10px] font-semibold tracking-[0.2em] text-[#5A430F]">
                                        ORDER REFERENCE · {String(placed.orderId).slice(-8).toUpperCase()}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => navigate('/products')}
                                    className="mt-8 bg-[#1B365D] px-8 py-3 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#D9BB74] transition-colors hover:bg-[#0F2342]"
                                >
                                    CONTINUE BROWSING
                                </button>
                            </div>
                        </ArchNiche>
                    </div>
                )}

                {/* ---------- the landing: stair rail, then the two niches ---------- */}
                {!loading && !placed && lines.length > 0 && (
                    <>
                        <form onSubmit={handleSubmit} noValidate className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_400px]">
                            {/* ===== Acquisition Ledger ===== */}
                            <ArchNiche arch={ARCH_WIDE} className="co-enter mt-3" label="Acquisition details">
                                <div className="relative px-6 pb-9 pt-14 sm:px-12 sm:pt-20">
                                    <ScrollBrackets bottomOnly />

                                    <div className="text-center">
                                        <p className="font-['Cinzel'] text-[10px] font-semibold tracking-[0.3em] text-[#8A6A1D]">
                                            SHIPPING LEDGER
                                        </p>
                                        <h2 className="mt-2 font-['Bodoni_Moda'] text-3xl font-semibold leading-none text-[#1B365D] sm:text-4xl">
                                            Acquisition Details
                                        </h2>
                                        <p className="mx-auto mt-4 max-w-md font-['Cormorant_Garamond'] text-lg italic text-[#4A3F33]">
                                            Tell us where your pieces should be sent.
                                        </p>
                                    </div>

                                    <IronworkDivider className="my-7" />

                                    <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
                                        <LedgerField name="fullName" value={form.fullName} error={visibleError('fullName')} ok={isOk('fullName')} onChange={handleChange} onBlur={handleBlur} />
                                        <LedgerField name="phone" value={form.phone} error={visibleError('phone')} ok={isOk('phone')} onChange={handleChange} onBlur={handleBlur} />
                                        <LedgerField name="address" value={form.address} error={visibleError('address')} ok={isOk('address')} onChange={handleChange} onBlur={handleBlur} multiline className="sm:col-span-2" />
                                        <LedgerField name="city" value={form.city} error={visibleError('city')} ok={isOk('city')} onChange={handleChange} onBlur={handleBlur} />
                                        <LedgerField name="state" value={form.state} error={visibleError('state')} ok={isOk('state')} onChange={handleChange} onBlur={handleBlur} list="checkout-states" />
                                        <LedgerField name="pincode" value={form.pincode} error={visibleError('pincode')} ok={isOk('pincode')} onChange={handleChange} onBlur={handleBlur} />
                                    </div>
                                    <datalist id="checkout-states">
                                        {INDIAN_STATES.map((s) => (
                                            <option key={s} value={s} />
                                        ))}
                                    </datalist>

                                    <p className="mt-8 flex items-center gap-2 font-['Cormorant_Garamond'] text-base font-semibold text-[#2B2620]">
                                        <Lock className="h-4 w-4 shrink-0 text-[#1B365D]" strokeWidth={1.5} />
                                        Your details are used only to deliver this order.
                                    </p>
                                </div>
                            </ArchNiche>

                            {/* ===== Rotunda Consignment Invoice ===== */}
                            <ArchNiche
                                arch={ARCH_TALL}
                                className="co-enter mt-3 lg:sticky lg:top-24"
                                style={{ animationDelay: '120ms' }}
                                label="Order summary"
                            >
                                {/* lapis night-sky vault */}
                                <div className="relative px-6 pb-6 pt-16 text-center" style={LAPIS_PANEL_STYLE}>
                                    <span className="pointer-events-none absolute inset-x-[7px] top-[7px] bottom-0 rounded-t-[158px] border border-b-0 border-[#D9BB74]/45" aria-hidden="true" />
                                    <ShoppingBag className="relative mx-auto h-5 w-5 text-[#D9BB74]" strokeWidth={1.5} aria-hidden="true" />
                                    <h2 className="relative mt-2 font-['Bodoni_Moda'] text-2xl font-semibold leading-none text-[#F5EFE0]">Order Summary</h2>
                                    <p className="relative mt-2 font-['Cinzel'] text-[10px] font-semibold tracking-[0.2em] text-[#D9BB74]">
                                        {pieces} {pieces === 1 ? 'PIECE' : 'PIECES'}
                                    </p>
                                </div>
                                <div className="h-[3px]" style={GOLD_FOIL_STYLE} aria-hidden="true" />

                                <div className="px-6 pt-4">
                                    <ul className="max-h-64 divide-y divide-dotted divide-[#1B365D]/30 overflow-y-auto pr-1">
                                        {lines.map((l) => (
                                            <li key={l.id} className="flex items-center gap-4 py-3">
                                                <MicroFrame className="w-14 shrink-0">
                                                    {l.product.image ? (
                                                        <img src={l.product.image} alt={l.product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center font-['Cinzel'] text-[7px] tracking-[0.1em] text-[#8A7F6C]">
                                                            NO IMAGE
                                                        </div>
                                                    )}
                                                </MicroFrame>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-['Cormorant_Garamond'] text-[17px] font-semibold leading-tight text-[#2B2620]">
                                                        {l.product.name}
                                                    </p>
                                                    <p className="mt-1 font-['Cinzel'] text-[10px] font-semibold tracking-[0.15em] text-[#7A5A12]">
                                                        QTY {l.quantity}
                                                    </p>
                                                </div>
                                                <span className="font-['Cinzel'] text-xs font-semibold text-[#1B365D]">
                                                    {formatPrice((l.product.price ?? 0) * l.quantity)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-3 space-y-2.5 border-t border-[#1B365D]/40 pt-3">
                                        <SummaryLine label="Subtotal" value={formatPrice(subtotal)} />
                                        <SummaryLine
                                            label="Shipping"
                                            value={freeDispatch ? 'COMPLIMENTARY' : formatPrice(shippingFee)}
                                            valueClass={freeDispatch ? 'text-[#1F5A49]' : ''}
                                        />
                                    </div>

                                    <div
                                        className={`relative mt-4 h-9 overflow-hidden rounded-full border ${
                                            freeDispatch ? 'border-[#8A6A1D]' : 'border-[#1B365D]/50 bg-[#FBF8F1]'
                                        }`}
                                        style={freeDispatch ? GOLD_FOIL_STYLE : undefined}
                                    >
                                        {!freeDispatch && (
                                            <div
                                                className="absolute inset-y-0 left-0 transition-[width] duration-700"
                                                style={{ ...GOLD_FOIL_STYLE, width: `${Math.min(100, Math.round((subtotal / FREE_DISPATCH_ABOVE) * 100))}%` }}
                                            />
                                        )}
                                        <p className="relative flex h-full items-center justify-center gap-2 px-3 font-['Cormorant_Garamond'] text-sm font-bold italic text-[#0F2342]">
                                            {freeDispatch
                                                ? 'Complimentary shipping applied'
                                                : `${formatPrice(FREE_DISPATCH_ABOVE - subtotal)} away from complimentary shipping`}
                                        </p>
                                    </div>
                                </div>

                                {/* amount due */}
                                <div className="relative mt-5 px-6 py-5" style={LAPIS_PANEL_STYLE}>
                                    <div className="relative flex items-end justify-between gap-3">
                                        <span className="font-['Cinzel'] text-[10px] font-bold tracking-[0.25em] text-[#F5EFE0]">AMOUNT DUE</span>
                                        <span className="font-['Bodoni_Moda'] text-4xl font-semibold leading-none text-[#D9BB74]">
                                            {formatPrice(total)}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-[3px]" style={GOLD_FOIL_STYLE} aria-hidden="true" />

                                <div className="px-6 pb-6 pt-5">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`co-cta group relative flex w-full items-center justify-center gap-3 overflow-hidden bg-gradient-to-b from-[#1B365D] to-[#0F2342] py-4 font-['Cinzel'] text-[11px] font-bold tracking-[0.25em] text-[#D9BB74] shadow-[0_10px_20px_-10px_rgba(15,35,66,0.8)] transition-all hover:from-[#16294A] hover:to-[#0A1932] disabled:cursor-wait disabled:opacity-80 ${
                                            ''
                                        }`}
                                    >
                                        <span
                                            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[150%] -skew-x-12 bg-gradient-to-r from-transparent via-[#F2DC9B]/35 to-transparent transition-transform duration-1000 group-hover:translate-x-[450%]"
                                            aria-hidden="true"
                                        />
                                        {submitting ? (
                                            <>
                                                <Loader2 className="relative h-4 w-4 animate-spin" strokeWidth={2} />
                                                <span className="relative">PLACING ORDER…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={2} />
                                                <span className="relative">CONFIRM ACQUISITION</span>
                                            </>
                                        )}
                                    </button>

                                    {submitAttempted && !formValid && (
                                        <p role="alert" className="mt-3 text-center font-['Cormorant_Garamond'] text-[15px] font-semibold italic" style={{ color: ERROR }}>
                                            Complete the highlighted lines to continue.
                                        </p>
                                    )}

                                    <p className="mt-4 flex items-center justify-center gap-2 font-['Cormorant_Garamond'] text-sm font-semibold text-[#2B2620]">
                                        <ShieldCheck className="h-4 w-4 shrink-0 text-[#1B365D]" strokeWidth={1.5} />
                                        30-day returns on unused pieces
                                    </p>
                                </div>
                            </ArchNiche>
                        </form>
                    </>
                )}

            </main>
        </div>
    );
}

export default Checkout;