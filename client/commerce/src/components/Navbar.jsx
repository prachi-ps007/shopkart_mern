import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Search, Home, Heart, Wheat, LogOut } from 'lucide-react';
import { fetchCart } from '../redux/cartSlice.js';
import { useAuth } from '../context/AuthContext';
import { axiosInstance } from '../axiosCalls/axios.js';

/*
  Loom & Jade — Navbar
  Centre: seal + wordmark.
  Right: icon actions, each with a small Cinzel label underneath, plus Logout.

  Props:
    wishlistCount  number  — optional override. By default the Wishlist badge is
                             fetched from the API (no Redux needed) on first load
                             and on every route change.
    bagCount       number  — optional override. By default the Bag badge is read
                             live from the Redux cart (sum of item quantities),
                             so it updates on every page without passing props.

  To refresh the wishlist badge instantly after adding/removing an item,
  dispatch this after the API call succeeds:
    window.dispatchEvent(new Event('wishlist:changed'));
*/

const ACTIONS = [
    { key: 'search', label: 'SEARCH', Icon: Search, to: '/products', hideOnMobile: false },
    { key: 'home', label: 'HOME', Icon: Home, to: '/home', hideOnMobile: true },
    { key: 'wishlist', label: 'WISHLIST', Icon: Heart, to: '/wishlist', hideOnMobile: true },
    { key: 'bag', label: 'BAG', Icon: ShoppingBag, to: '/cart', hideOnMobile: false },
];

function Seal({ size = 'h-11 w-11' }) {
    return (
        <div className={`${size} rounded-full bg-gradient-to-br from-[#7A1B2C] to-[#5A0F1C] border-2 border-[#D9BB74] flex items-center justify-center shrink-0`}>
            <Wheat className="h-5 w-5 text-[#D9BB74]" strokeWidth={1.5} />
        </div>
    );
}

/* Cart items may be { product, quantity } or flat product objects with a quantity */
function countBag(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (Number(item?.quantity ?? item?.qty) || 1), 0);
}

export function Navbar({ wishlistCount, bagCount }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useAuth();
    const { cartItems, hydrated, fetching } = useSelector((state) => state.cart);
    const [wishlistTotal, setWishlistTotal] = useState(0);

    // Load the saved bag once per session so the badge is right on first paint.
    useEffect(() => {
        if (!hydrated && !fetching) dispatch(fetchCart());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadWishlistCount = async () => {
        try {
            const { data } = await axiosInstance.get('/wishlist'); // match your endpoint
            const list = Array.isArray(data) ? data : data?.wishlist ?? data?.items ?? [];
            setWishlistTotal(list.length);
        } catch {
            setWishlistTotal(0);
        }
    };

    // Reload on first load and every time the page changes
    useEffect(() => {
        loadWishlistCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Pages can trigger an instant refresh with window.dispatchEvent(new Event('wishlist:changed'))
    useEffect(() => {
        window.addEventListener('wishlist:changed', loadWishlistCount);
        return () => window.removeEventListener('wishlist:changed', loadWishlistCount);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const counts = {
        wishlist: wishlistCount ?? wishlistTotal,
        bag: bagCount ?? countBag(cartItems),
    };

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/customers/logout');
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            setUser(null); // clear auth state so PublicRoute doesn't bounce back to /home
            setWishlistTotal(0);
            navigate('/login');
        }
    };

    return (
        <header className="border-b border-[#B08D2B]/40 bg-[#F3ECDB]/95 backdrop-blur sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center">
                {/* Left spacer keeps the logo centred */}
                <div />

                <Link to="/home" className="flex items-center gap-3">
                    <Seal size="h-9 w-9" />
                    <span className="font-['Pinyon_Script'] text-3xl text-[#6B1423] leading-none">Loom &amp; Jade</span>
                </Link>

                <div className="flex items-start justify-end gap-5 sm:gap-6 text-[#2B2620]">
                    {ACTIONS.map(({ key, label, Icon, to, hideOnMobile }) => {
                        const count = counts[key] || 0;
                        return (
                            <Link
                                key={key}
                                to={to}
                                aria-label={
                                    (label.charAt(0) + label.slice(1).toLowerCase()) +
                                    (count > 0 ? ` (${count})` : '')
                                }
                                className={`group flex-col items-center gap-1 hover:text-[#6B1423] transition-colors ${
                                    hideOnMobile ? 'hidden sm:flex' : 'flex'
                                }`}
                            >
                                <span className="relative">
                                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                                    {count > 0 && (
                                        <span className="absolute -top-2 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#6B1423] text-[#F3E7C9] font-['Cinzel'] text-[9px] font-bold flex items-center justify-center">
                                            {count > 99 ? '99+' : count}
                                        </span>
                                    )}
                                </span>
                                <span className="font-['Cinzel'] text-[9px] font-semibold tracking-[0.18em]">
                                    {label}
                                </span>
                            </Link>
                        );
                    })}

                    <button
                        type="button"
                        onClick={handleLogout}
                        aria-label="Logout"
                        className="group flex flex-col items-center gap-1 hover:text-[#6B1423] transition-colors"
                    >
                        <LogOut className="h-4 w-4" strokeWidth={1.5} />
                        <span className="font-['Cinzel'] text-[9px] font-semibold tracking-[0.18em]">
                            LOGOUT
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Navbar;