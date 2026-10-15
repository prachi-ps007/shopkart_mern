import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link , useNavigate } from "react-router-dom";
import goldenFrame from "../assets/gold-frame2.png";
import { axiosInstance } from "../axiosCalls/axios.js";
import {useAuth} from "../context/AuthContext.jsx";

const EASE = [0.16, 1, 0.3, 1];

function useGoogleFonts() {
  useEffect(() => {
    if (document.getElementById("gallery-auth-fonts")) return;
    const link = document.createElement("link");
    link.id = "gallery-auth-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500;1,600&family=Pinyon+Script&display=swap";
    document.head.appendChild(link);
  }, []);
}

const frameVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: EASE,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

function Field({ id, label, type, icon: Icon, value, onChange, placeholder, autoComplete, rightSlot, hint }) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between px-0.5">
        <label
          htmlFor={id}
          className="text-[10.5px] uppercase tracking-[0.2em] text-[#916E31]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {label}
        </label>
        {hint && (
          <span
            className="text-[11px] italic text-[#C49B4B]"
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
          className={`ml-3.5 h-4 w-4 shrink-0 transition-colors duration-300 ${
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
          className="w-full bg-transparent px-3.5 py-2.5 text-[14px] text-[#2B241E] placeholder:text-[#BAA78A] focus:outline-none"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        />
        {rightSlot}
      </div>
    </motion.div>
  );
}

export function Login() {
  useGoogleFonts();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();
  const {setUser} = useAuth()
 
  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setLoader(true);
    try{
        const res = await axiosInstance.post("/customers/login", form)
        console.log(res.data.customer)
        setUser(res.data.customer)

        console.log(res)
        setLoader(false)
        console.log("You are successfully Logged In")
        navigate("/home")
    }
    catch(err){
        setLoader(false)
        console.log(err.message)
    }
    console.log("Customer signed in:", form);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F4EFEA] px-4 py-12">
      {/* Brown Checkbox / Grid Pattern Matching Signup */}
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

      {/* Expanded Museum Frame Container */}
      <motion.div
        variants={frameVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[620px] drop-shadow-[0_32px_60px_rgba(74,55,40,0.48)]"
      >
        {/* Real Gilded Frame Image Overlay */}
        <img
          src={goldenFrame}
          alt="Antique Gilded Gallery Frame"
          className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none object-fill drop-shadow-[0_6px_16px_rgba(0,0,0,0.22)]"
        />

        {/* Canvas Interior - Scaled to fill the vertical frame opening */}
        <div className="relative z-10 mx-[10%] my-[11%] flex min-h-[580px] flex-col justify-between rounded-sm bg-[#FCFAF5] px-8 pb-8 pt-10 shadow-[inset_0_2px_18px_rgba(44,28,16,0.12)] sm:px-10">
          
          {/* Decorative Framing Inset */}
          <div className="pointer-events-none absolute inset-[6px] border border-[#D4AF37]/35" />
          <div className="pointer-events-none absolute inset-[10px] border border-[#E8D6B5]/50" />

          {/* Header */}
          <div className="relative flex flex-col items-center text-center">
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-1.5 border border-[#D4AF37]/60 bg-[#F5EEDF] px-4 py-1 text-[9px] uppercase tracking-[0.3em] text-[#A67C2E]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
              Account Login
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-3 text-[28px] leading-tight text-[#2B241E]"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600 }}
            >
              Sign In To Your Account
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-0.5 text-[21px] text-[#C49126] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              Loom & Jade
            </motion.p>

            <motion.div variants={itemVariants} className="mx-auto mt-2 h-px w-14 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

            <motion.p
              variants={itemVariants}
              className="mx-auto mt-2 max-w-[320px] text-[13px] leading-relaxed text-[#7A6A55]"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
            >
              Access your order history, track active dispatches, and access saved wishlists.
            </motion.p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="my-auto flex flex-col gap-4 py-2 px-6" noValidate>
            <Field
              id="email"
              label="Email Address"
              type="email"
              icon={Mail}
              value={form.email}
              onChange={handleChange("email")}
              placeholder="order-receipts@domain.com"
              autoComplete="email"
            />

            <Field
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              icon={Lock}
              value={form.password}
              onChange={handleChange("password")}
              placeholder="Enter your password"
              autoComplete="current-password"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="mr-2.5 text-[#B89858] transition-colors duration-200 hover:text-[#C49126]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {/* Forgot Password Link */}
            <motion.div variants={itemVariants} className="-mt-1 flex justify-end">
              <a
                href="#forgot-password"
                className="text-[12px] italic text-[#916E31] transition-colors hover:text-[#6E4F18]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Forgot your password?
              </a>
            </motion.div>

            {/* Gilded Gold Button */}
            <motion.div variants={itemVariants} className="mt-1">
              <button
                type="submit"
                disabled={loader}
                className="group relative w-full overflow-hidden rounded-[3px] border border-[#E6B84A] bg-gradient-to-r from-[#B88728] via-[#C99834] to-[#B88728] px-5 py-3 text-[11.5px] uppercase tracking-[0.22em] text-[#FFFDF8] shadow-[0_2px_8px_rgba(184,135,40,0.35)] transition-all duration-300 hover:border-[#F4D068] hover:shadow-[0_4px_14px_rgba(184,135,40,0.5)] focus:outline-none focus:ring-2 focus:ring-[#E6B84A]/60"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <span className="relative z-10 font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                  {loader ? "Signing In..." : "Sign In"}
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
                Signing you in... Welcome back.
              </p>
            </motion.div>
          </form>

          {/* Footer Link */}
          <motion.p
            variants={itemVariants}
            className="text-center text-[13px] text-[#7A6A55]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="relative font-medium text-[#B88728] transition-colors duration-200 hover:text-[#8B5F14] after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-[#B88728] after:transition-all after:duration-300 hover:after:w-full"
            >
              Create an account
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;