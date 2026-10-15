import React from 'react';
import { Minus, Plus, X } from 'lucide-react';

/*
  Loom & Jade — CartItem
  One line of the acquisition ledger: a small gilt-framed portrait of the piece,
  a roman-numeral lot seal, the catalogue entry (category, name, unit price),
  a brass quantity stepper and the line total.

  Props:
    item        cart entry — either { product: {...}, quantity } or a flat product with `quantity`
    index       zero-based position, shown as a roman numeral lot seal
    busy        boolean — a request for this line is in flight (dims + locks the controls)
    onChangeQty (productId, nextQuantity) => void
    onRemove    (productId) => void
    onView      (product) => void
*/

export function formatPrice(value) {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

/* Normalises whatever shape the API returns into { product, id, quantity } */
export function toLine(item) {
    const product = item?.product && typeof item.product === 'object' ? item.product : item;
    const quantity = Math.max(1, Number(item?.quantity ?? item?.qty) || 1);
    return { product, id: product?._id ?? item?.product ?? item?._id, quantity };
}

const ROMAN = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];
function toRoman(n) {
    let out = '';
    for (const [value, sym] of ROMAN) {
        while (n >= value) { out += sym; n -= value; }
    }
    return out;
}

function GoldFrame({ children }) {
    return (
        <div className="relative p-[4px] bg-gradient-to-br from-[#E4C77A] via-[#B08D2B] to-[#7C5F1A] shadow-[0_10px_20px_-10px_rgba(43,38,32,0.55)]">
            <div className="p-[2px] border border-[#7C5F1A]/60">
                <div className="relative overflow-hidden bg-[#0F0D0B] aspect-[4/5]">{children}</div>
            </div>
        </div>
    );
}

export function CartItem({ item, index = 0, busy = false, onChangeQty, onRemove, onView }) {
    const { product, id, quantity } = toLine(item);
    if (!product) return null;

    const { name, image, price, category, stock } = product;
    const maxQty = typeof stock === 'number' && stock > 0 ? stock : Infinity;
    const atMax = quantity >= maxQty;
    const lineTotal = typeof price === 'number' ? price * quantity : null;

    return (
        <article
            className={`ci-row relative flex gap-4 sm:gap-6 py-6 transition-opacity duration-300 ${
                busy ? 'opacity-50 pointer-events-none' : ''
            }`}
            aria-busy={busy}
        >
            {/* portrait + lot seal */}
            <div className="relative w-24 sm:w-32 shrink-0">
                <button
                    type="button"
                    onClick={() => onView?.(product)}
                    aria-label={`View ${name}`}
                    className="block w-full text-left"
                >
                    <GoldFrame>
                        {image ? (
                            <img
                                src={image}
                                alt={name}
                                className="h-full w-full object-cover transition duration-700 hover:scale-105"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-[#8A7F6C] font-['Cinzel'] text-[9px] tracking-[0.2em]">
                                NO IMAGE
                            </div>
                        )}
                    </GoldFrame>
                </button>

                <span
                    className="absolute -top-2 -left-2 flex h-8 min-w-8 px-1.5 items-center justify-center rounded-full border-2 border-[#D9BB74] bg-gradient-to-br from-[#7A1B2C] to-[#5A0F1C] font-['Bodoni_Moda'] text-[11px] font-semibold text-[#D9BB74] shadow-[0_4px_8px_-2px_rgba(0,0,0,0.5)]"
                    title={`Lot ${toRoman(index + 1)}`}
                >
                    {toRoman(index + 1)}
                </span>
            </div>

            {/* catalogue entry */}
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-['Cinzel'] text-[10px] tracking-[0.2em] text-[#8A6A1D]">
                            {category?.toUpperCase()}
                        </p>
                        <h3 className="font-['Bodoni_Moda'] font-semibold text-xl sm:text-2xl leading-tight text-[#2B2620] mt-1 line-clamp-2">
                            {name}
                        </h3>
                        <p className="font-['Cormorant_Garamond'] italic text-base text-[#6B5D4F] mt-1">
                            {formatPrice(price)} each
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onRemove?.(id)}
                        aria-label={`Remove ${name} from bag`}
                        className="group/rm shrink-0 inline-flex items-center gap-1.5 font-['Cinzel'] text-[9px] font-semibold tracking-[0.2em] text-[#8A7F6C] hover:text-[#6B1423] transition-colors"
                    >
                        <span className="hidden sm:inline">REMOVE</span>
                        <X className="h-3.5 w-3.5 transition-transform duration-300 group-hover/rm:rotate-90" strokeWidth={1.75} />
                    </button>
                </div>

                {/* leader line: dotted rule between the entry and its figures, like a catalogue price list */}
                <div className="mt-auto pt-5 flex items-end gap-3">
                    <div
                        className="inline-flex items-center border border-[#B08D2B]/70 bg-[#FBF6EA]"
                        role="group"
                        aria-label={`Quantity for ${name}`}
                    >
                        <button
                            type="button"
                            onClick={() => onChangeQty?.(id, quantity - 1)}
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                            className="h-9 w-9 flex items-center justify-center text-[#6B1423] hover:bg-[#6B1423] hover:text-[#F3E7C9] disabled:text-[#B0A88F] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                        >
                            <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <span
                            className="w-10 text-center font-['Bodoni_Moda'] text-base font-semibold text-[#2B2620] border-x border-[#B08D2B]/40 leading-9"
                            aria-live="polite"
                        >
                            {quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => onChangeQty?.(id, quantity + 1)}
                            disabled={atMax}
                            aria-label="Increase quantity"
                            className="h-9 w-9 flex items-center justify-center text-[#6B1423] hover:bg-[#6B1423] hover:text-[#F3E7C9] disabled:text-[#B0A88F] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                    </div>

                    <span className="flex-1 mb-2 border-b-2 border-dotted border-[#B08D2B]/50" aria-hidden="true" />

                    <p className="font-['Bodoni_Moda'] font-semibold text-xl sm:text-2xl text-[#6B1423] leading-none mb-1">
                        {formatPrice(lineTotal)}
                    </p>
                </div>

                {atMax && Number.isFinite(maxQty) && (
                    <p className="font-['Cormorant_Garamond'] italic text-sm text-[#6B1423] mt-2">
                        All {maxQty} in stock are in your bag.
                    </p>
                )}
            </div>
        </article>
    );
}

export default CartItem;