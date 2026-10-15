import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { axiosInstance } from "../axiosCalls/axios.js";
import { useNavigate } from "react-router-dom";

const EASE = [0.16, 1, 0.3, 1];
const UNROLL_DURATION = 1.15;
const UNROLL_DELAY = 0.1;
const CONTENT_READY = UNROLL_DELAY + UNROLL_DURATION - 0.15;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useGoogleFonts() {
  useEffect(() => {
    if (document.getElementById("signup-scroll-fonts")) return;
    const link = document.createElement("link");
    link.id = "signup-scroll-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500;1,600&family=Pinyon+Script&display=swap";
    document.head.appendChild(link);
  }, []);
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: CONTENT_READY },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

function Rod({ position, reduced }) {
  const isTop = position === "top";
  return (
    <motion.div
      initial={reduced ? false : { scaleX: 0.35, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE, delay: reduced ? 0 : UNROLL_DELAY }}
      className="relative z-20 mx-auto shrink-0"
      style={{ width: "calc(100% + 36px)" }}
    >
      <motion.div
        initial={false}
        animate={reduced ? {} : { scaleY: [1, 1.25, 1] }}
        transition={{ duration: 0.4, ease: EASE, delay: UNROLL_DELAY + UNROLL_DURATION }}
        className="h-[11px] w-full rounded-full"
        style={{
          background:
            "linear-gradient(180deg, #FFF0B8 0%, #E6B84A 32%, #C49126 65%, #8B5F14 100%)",
          boxShadow: isTop
            ? "0 2px 6px rgba(184,135,40,0.45), inset 0 1px 1px rgba(255,255,255,0.7)"
            : "0 -2px 6px rgba(184,135,40,0.35), inset 0 1px 1px rgba(255,255,255,0.7)",
        }}
      />
      {["left", "right"].map((side) => (
        <div
          key={side}
          className="absolute top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full border border-[#FFF0B8]/40"
          style={{
            [side]: "-5px",
            background:
              "radial-gradient(circle at 35% 30%, #FFF4C6 0%, #E6B84A 45%, #B88728 78%, #7A5311 100%)",
            boxShadow: "0 2px 4px rgba(122,83,17,0.55), inset 0 1px 1px rgba(255,255,255,0.6)",
          }}
        />
      ))}
    </motion.div>
  );
}

function WaxSeal({ reduced }) {
  return (
    <motion.div
      initial={reduced ? false : { scale: 0, opacity: 0, rotate: -10, y: -6 }}
      animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: reduced ? 0 : UNROLL_DELAY + UNROLL_DURATION - 0.1 }}
      className="relative z-30 mx-auto -mb-1 flex h-11 w-11 items-center justify-center rounded-full"
      style={{
        background:
          "radial-gradient(circle at 32% 28%, #9E2632 0%, #7A1923 55%, #520F16 100%)",
        boxShadow:
          "0 3px 8px rgba(184,135,40,0.3), inset 0 1px 2px rgba(255,230,160,0.4), inset 0 -2px 3px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full border"
        style={{ borderColor: "rgba(230,184,74,0.75)" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F4D068"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22C12 15 17 9 21 6C20 12 17 19 12 22Z" fill="#F4D068" fillOpacity="0.3" />
          <path d="M12 22C12 16 7 11 3 8C4 13 7 19 12 22Z" fill="#F4D068" fillOpacity="0.3" />
          <path d="M12 22V6" />
          <path d="M12 14C14 12 16 11 18 11" />
          <path d="M12 17C10 15 8 14 6 14" />
        </svg>
      </div>
    </motion.div>
  );
}

function Field({ id, label, type, icon: Icon, value, onChange, placeholder, autoComplete, rightSlot, hint }) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div variants={fieldVariants} className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between px-0.5">
        <label
          htmlFor={id}
          className="text-[10px] uppercase tracking-[0.2em] text-[#916E31]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {label}
        </label>
        {hint && (
          <span
            className="text-[10px] italic text-[#C49B4B]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {hint}
          </span>
        )}
      </div>
      <div
        className={[
          "relative flex items-center rounded-[3px] border transition-all duration-300",
          "bg-[#FDFCFA] shadow-[inset_0_1px_2px_rgba(184,135,40,0.06)]",
          focused 
            ? "border-[#D4AF37] ring-2 ring-[#E6B84A]/35 shadow-[0_0_8px_rgba(212,175,55,0.2)]" 
            : "border-[#E8D6B5] hover:border-[#D4AF37]/60",
        ].join(" ")}
      >
        <Icon
          className={`ml-3.5 h-3.5 w-3.5 shrink-0 transition-colors duration-300 ${
            focused ? "text-[#C49126]" : "text-[#B89858]"
          }`}
          aria-hidden="true"
        />
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent px-3.5 py-2 text-[13.5px] text-[#2B241E] placeholder:text-[#BAA78A] focus:outline-none"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        />
        {rightSlot}
      </div>
    </motion.div>
  );
}

export function Signup() {
  useGoogleFonts();
  const reduced = usePrefersReducedMotion();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loader, setLoader] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    try {
      await axiosInstance.post("/customers/register", form);
      setSubmitted(true);
      setLoader(false);
      console.log("Account created:", form);
      setForm({ fullName: "", email: "", password: "", phone: "" });
      navigate("/login")
    } catch (err) {
      console.log(err);
      setLoader(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F4EFEA] px-4 py-8">
      {/* Brown Checkbox / Grid Pattern Layer */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: "#F4EFEA",
          backgroundImage: `
            linear-gradient(to right, rgba(138, 115, 93, 0.28) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(138, 115, 93, 0.28) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      {/* Subtle Central Illumination Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255,255,255,0.65) 0%, rgba(244,239,234,0.4) 60%, rgba(228,220,210,0.7) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Increased Width: max-w-[490px] */}
      <div className="relative flex w-full max-w-[490px] flex-col">
        <Rod position="top" reduced={reduced} />

        <motion.div
          initial={reduced ? false : { height: 0 }}
          animate={{ height: "auto" }}
          transition={{ duration: reduced ? 0 : UNROLL_DURATION, ease: EASE, delay: reduced ? 0 : UNROLL_DELAY }}
          className="relative z-10 flex justify-center overflow-hidden border-x-2 border-[#D4AF37]/80 bg-[#FCFAF5] shadow-[0_22px_50px_-12px_rgba(139,95,20,0.30)]"
          style={{ transformOrigin: "center" }}
        >
          {/* Subtle clean rod shadows for depth */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-gradient-to-b from-[#8B5F14]/12 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-[#8B5F14]/14 via-transparent to-transparent" />

          {/* Precision Architectural Hairline Moldings */}
          <div className="pointer-events-none absolute inset-[7px] border border-[#D4AF37]/45" />
          <div className="pointer-events-none absolute inset-[11px] border border-[#E6B84A]/30" />

          {/* Ornate Gold Corner Flourishes */}
          {[
            { top: "13px", left: "13px", rotate: "0deg" },
            { top: "13px", right: "13px", rotate: "90deg" },
            { bottom: "13px", right: "13px", rotate: "180deg" },
            { bottom: "13px", left: "13px", rotate: "270deg" },
          ].map((pos, i) => (
            <svg
              key={i}
              width="16"
              height="16"
              viewBox="0 0 14 14"
              className="pointer-events-none absolute z-10"
              style={{ ...pos, transform: `rotate(${pos.rotate})` }}
              aria-hidden="true"
            >
              <path
                d="M1 1 L1 8 Q1 1 8 1 Z"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="1.3"
                opacity="0.85"
              />
            </svg>
          ))}

          <div className="flex w-full flex-col justify-center px-9 py-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="relative flex flex-col items-center"
            >
              <WaxSeal reduced={reduced} />

              {/* Header */}
              <motion.div variants={fieldVariants} className="mb-4 mt-2.5 text-center">
                <p
                  className="text-[9px] uppercase tracking-[0.32em] text-[#A67C2E]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Account Register № 2026
                </p>
                <h1
                  className="mt-1 text-[26px] leading-tight text-[#2B241E]"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600 }}
                >
                  Create Your Account
                </h1>
                
                <p
                  className="mt-0.5 text-[19px] text-[#C49126] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
                  style={{ fontFamily: "'Pinyon Script', cursive" }}
                >
                  Loom & Jade
                </p>

                {/* Shimmering Gold Divider */}
                <div className="mx-auto mt-2 h-px w-14 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                
                <p
                  className="mx-auto mt-2.5 max-w-[360px] text-[13px] leading-snug text-[#7A6A55]"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
                >
                  Register to unlock private collection launches, archival order tracking, saved patronage wishlists, and complimentary international shipping.
                </p>
              </motion.div>

              {/* Form with 4 requested fields */}
              <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2.5" noValidate>
                <Field
                  id="fullName"
                  label="Full Name"
                  type="text"
                  icon={User}
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  placeholder="Your full name"
                  autoComplete="name"
                />
                <Field
                  id="email"
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="order-receipts@domain.com"
                  autoComplete="email"
                  hint="For dispatch notices"
                />
                <Field
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  icon={Lock}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="8+ characters"
                  autoComplete="new-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="mr-2.5 text-[#B89858] transition-colors duration-200 hover:text-[#C49126]"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  }
                />
                <Field
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  icon={Phone}
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="+1 (000) 000-0000"
                  autoComplete="tel"
                  hint="Courier updates"
                />

                {/* Radiant Gilded Gold Button */}
                <motion.div variants={fieldVariants} className="mt-1.5">
                  <button
                    type="submit"
                    disabled={loader}
                    className="group relative w-full overflow-hidden rounded-[3px] border border-[#E6B84A] bg-gradient-to-r from-[#B88728] via-[#C99834] to-[#B88728] px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#FFFDF8] shadow-[0_2px_8px_rgba(184,135,40,0.35)] transition-all duration-300 hover:border-[#F4D068] hover:shadow-[0_4px_14px_rgba(184,135,40,0.5)] focus:outline-none focus:ring-2 focus:ring-[#E6B84A]/60 focus:ring-offset-2 focus:ring-offset-[#FCFAF5] disabled:opacity-70"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <span className="relative z-10 font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                      {loader ? "ENROLLING..." : "SIGN UP"}
                    </span>
                    <span
                      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/25 transition-transform duration-700 ease-out group-hover:translate-x-[350%]"
                      aria-hidden="true"
                    />
                  </button>
                  <p
                    role="status"
                    aria-live="polite"
                    className={`mt-1.5 text-center text-[11px] text-[#8C6D34] transition-opacity duration-300 ${
                      submitted ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
                  >
                    Welcome in — your account has been successfully registered.
                  </p>
                </motion.div>

                <motion.p
                  variants={fieldVariants}
                  className="-mt-0.5 text-center text-[13px] text-[#7A6A55]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Already registered?{" "}
                  <Link
                    to="/login"
                    className="relative font-medium text-[#B88728] transition-colors duration-200 hover:text-[#8B5F14] after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-[#B88728] after:transition-all after:duration-300 hover:after:w-full"
                  >
                    Sign in to your Account
                  </Link>
                </motion.p>
              </form>
            </motion.div>
          </div>
        </motion.div>

        <Rod position="bottom" reduced={reduced} />
      </div>
    </div>
  );
}

export default Signup;