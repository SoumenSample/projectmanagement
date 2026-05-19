// "use client";

// import { useEffect, useState } from "react";
// import { signIn, useSession } from "next-auth/react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";

// export default function LoginPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { status } = useSession();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

//   useEffect(() => {
//     if (status === "authenticated") {
//       router.replace("/dashboard");
//     }
//   }, [status, router]);

//   async function handleSubmit(event) {
//     event.preventDefault();
//     setError("");
//     setIsSubmitting(true);

//     try {
//       const response = await signIn("credentials", {
//         email,
//         password,
//         callbackUrl,
//         redirect: false,
//       });

//       if (response?.error) {
//         setError("Invalid credentials or inactive account.");
//         return;
//       }

//       if (response?.url) {
//         router.replace(response.url);
//         return;
//       }

//       router.replace(callbackUrl);
//     } catch (err) {
//       setError("Unable to sign in right now. Please try again.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4">
//       <div className="pointer-events-none absolute inset-0 opacity-60">
//         <div className="absolute -left-24 top-8 h-80 w-80 rounded-full bg-cyan-500/20 blur-[120px]" />
//         <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-400/20 blur-[140px]" />
//       </div>

//       <Card className="relative z-10 w-full max-w-md">
//         <CardHeader>
//           <CardTitle>Dashboard Login</CardTitle>
//           <CardDescription>
//             Sign in as admin, client, or employee. New users are created by admin only.
//           </CardDescription>
//         </CardHeader>

//         <CardContent>
//           <form className="space-y-4" onSubmit={handleSubmit}>
//             <div>
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="name@company.com"
//                 required
//               />
//             </div>

//             <div>
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Enter your password"
//                 required
//               />
//             </div>

//             {error ? <p className="text-sm text-red-400">{error}</p> : null}

//             <Button className="w-full" type="submit" disabled={isSubmitting}>
//               {isSubmitting ? "Signing in..." : "Login"}
//             </Button>
//           </form>

//           <div className="mt-4 text-center text-xs text-cyan-100/70">
//             <a href="/forgot-password" style={{ color: "blue" }}>
//   Forgot Password?
// </a>
//             <div className="mt-2">
//               <Link href="/" className="text-cyan-300 hover:text-cyan-200">
//                 Return to homepage
//               </Link>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </section>
//   );
// }




"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (response?.error) {
        setError("Invalid credentials or inactive account.");
        return;
      }

      if (response?.url) {
        router.replace(response.url);
        return;
      }

      router.replace(callbackUrl);
    } catch (err) {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* Subtle animated background grid */
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: gridShift 20s linear infinite;
        }

        @keyframes gridShift {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        /* Floating accent blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
          animation: blobFloat 8s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .blob-1 {
          width: 320px; height: 320px;
          background: #111;
          top: -80px; left: -80px;
          animation-delay: 0s;
        }
        .blob-2 {
          width: 240px; height: 240px;
          background: #444;
          bottom: -60px; right: -60px;
          animation-delay: 3s;
        }
        @keyframes blobFloat {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 20px) scale(1.08); }
        }

        /* Card */
        .card {
          position: relative;
          z-index: 10;
          background: #fff;
          border: 1.5px solid rgba(0,0,0,0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
          padding: 2.5rem 2.5rem 2rem;
          box-shadow:
            0 4px 6px rgba(0,0,0,0.04),
            0 20px 60px rgba(0,0,0,0.08);
          opacity: 0;
          transform: translateY(28px);
          animation: cardReveal 0.65s cubic-bezier(0.22,1,0.36,1) 0.1s forwards;
        }
        @keyframes cardReveal {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Logo mark */
        .logo-mark {
          width: 44px; height: 44px;
          background: #111;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.5rem;
          animation: logoReveal 0.5s ease 0.4s both;
        }
        @keyframes logoReveal {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        .logo-mark svg { color: #fff; }

        /* Heading */
        .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #0a0a0a;
          letter-spacing: -0.02em;
          line-height: 1.2;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.45s forwards;
        }
        .card-desc {
          font-size: 0.82rem;
          color: #6b7280;
          margin-top: 0.4rem;
          font-weight: 300;
          line-height: 1.5;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.5s forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Divider */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
          margin: 1.5rem 0;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.55s forwards;
        }

        /* Form fields */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.6s forwards;
        }

        .field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.4rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .input-wrap {
          position: relative;
        }

        .input-wrap input {
          width: 100%;
          padding: 0.7rem 1rem;
          border: 1.5px solid rgba(0,0,0,0.12);
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #111;
          background: #fafafa;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          -webkit-appearance: none;
        }
        .input-wrap input::placeholder { color: #9ca3af; }
        .input-wrap input:focus {
          border-color: #111;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
        .input-wrap input.has-toggle {
          padding-right: 2.8rem;
        }

        /* Show/hide password button */
        .toggle-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: #9ca3af;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .toggle-btn:hover { color: #111; }

        /* Error */
        .error-msg {
          font-size: 0.8rem;
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 0.78rem;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          margin-top: 0.25rem;
        }
        .submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .submit-btn:hover:not(:disabled)::after { transform: translateX(100%); }
        .submit-btn:hover:not(:disabled) {
          background: #222;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { background: #9ca3af; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer links */
        .footer-links {
          margin-top: 1.4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.75s forwards;
        }
        .forgot-link {
          font-size: 0.82rem;
          color: #374151;
          text-decoration: none;
          border-bottom: 1px dashed rgba(0,0,0,0.25);
          padding-bottom: 1px;
          transition: color 0.15s, border-color 0.15s;
        }
        .forgot-link:hover { color: #111; border-color: #111; }

        .home-link {
          font-size: 0.78rem;
          color: #9ca3af;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: color 0.15s;
        }
        .home-link:hover { color: #374151; }
        .home-link svg { transition: transform 0.2s; }
        .home-link:hover svg { transform: translateX(-3px); }
      `}</style>

      <div className="login-root">
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <div className="card">
          {/* Logo */}
          <div className="logo-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <div className="card-title">Welcome back</div>
          <p className="card-desc">Good to see you again!</p>

          <div className="divider" />

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              {/* Email */}
              <div className="field">
                <label htmlFor="email">Email address</label>
                <div className="input-wrap">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="has-toggle"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      /* Eye-off */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      /* Eye */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="error-msg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button className="submit-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting && <span className="spinner" />}
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="footer-links">
            <a href="/forgot-password" className="forgot-link">Forgot your password?</a>
            <Link href="/" className="home-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}