"use client";

import { useState, useEffect } from "react";
import { signInWithEmail, signUpWithEmail } from "../lib/auth";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  FacebookAuthProvider, // ✅ added
} from "firebase/auth"; // ✅ changed (added FacebookAuthProvider)
import { auth, provider } from "../lib/firebase";
import { FirebaseError } from "firebase/app";
import { ensureUserDocument } from "../lib/createUserDoc";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");

  // --- GA helper (inline, no new imports) ---
  const track = (name: string, params?: Record<string, any>) => {
    (window as any)?.gtag?.("event", name, params || {});
  };
  const setGaUser = (uid?: string | null, props?: Record<string, any>) => {
    (window as any)?.gtag?.("set", { user_id: uid ?? null });
    if (props) (window as any)?.gtag?.("set", "user_properties", props);
  };

  // Modal view
  useEffect(() => {
    track("auth_modal_view", { mode });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Complete redirect flow if we just returned from Google or Facebook
  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await ensureUserDocument();

          const uid = auth.currentUser?.uid;
          const prov =
            (result.providerId as string | null) ||
            result.user.providerData?.[0]?.providerId ||
            "oauth";
          const method = prov.includes("facebook")
            ? "facebook"
            : prov.includes("google")
            ? "google"
            : prov;

          if (uid) setGaUser(uid, { auth_method: method });
          track("auth_success", { method, via: "redirect_result" });
          onClose();
        }
      } catch (e) {
        console.error("getRedirectResult error:", e);
        track("auth_error", { where: "oauth_redirect", code: "getRedirectResult_error" });
      }
    })();
  }, []); // run once when modal mounts

  const handleEmailAuth = async () => {
    try {
      track("auth_sign_in_click", { source: "auth_modal", method: "password", mode });

      if (mode === "signup" && password !== confirmPassword) {
        setError("Passwords do not match.");
        track("auth_error", { where: "email", code: "password_mismatch", mode });
        return;
      }

      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }

      await ensureUserDocument();

      const uid = auth.currentUser?.uid;
      if (uid) setGaUser(uid, { auth_method: "password" });

      track("auth_success", { method: "password", mode });
      onClose();
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/wrong-password":
            setError("Incorrect password. Please try again.");
            break;
          case "auth/user-not-found":
            setError("No account found with that email.");
            break;
          case "auth/email-already-in-use":
            setError("An account already exists with that email.");
            break;
          case "auth/weak-password":
            setError("Password should be at least 6 characters.");
            break;
          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;
          default:
            setError("An unexpected error occurred.");
        }
        track("auth_error", { where: "email", code: err.code, mode });
      } else {
        setError("Something went wrong.");
        track("auth_error", { where: "email", code: "unknown", mode });
      }
    }
  };

  // ✅ Helper: decide if we should avoid popups
  const shouldForceRedirect = async () => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    let isBrave = false;
    try {
      isBrave = !!(navigator as any).brave && (await (navigator as any).brave.isBrave?.());
    } catch {}
    return isSafari || isBrave;
  };

  const handleGoogleAuth = async () => {
    try {
      track("auth_sign_in_click", { source: "auth_modal", method: "google" });

      // Optional but helpful: ensure account chooser appears
      provider.setCustomParameters?.({ prompt: "select_account" });

      // Some browsers (Brave/Safari) block popups/cookies -> go straight to redirect
      if (await shouldForceRedirect()) {
        await signInWithRedirect(auth, provider);
        return;
      }

      // Try popup first
      try {
        await signInWithPopup(auth, provider);
      } catch (err: any) {
        const code = err?.code as string | undefined;
        const fallbackCodes = new Set([
          "auth/popup-blocked",
          "auth/popup-closed-by-user",
          "auth/cancelled-popup-request",
          "auth/operation-not-supported-in-this-environment",
          "auth/unauthorized-domain",
        ]);
        if (code && fallbackCodes.has(code)) {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw err;
      }

      await ensureUserDocument();
      const uid = auth.currentUser?.uid;
      if (uid) setGaUser(uid, { auth_method: "google" });
      track("auth_success", { method: "google", via: "popup" });
      onClose();
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Google sign-in failed. Please try again.");
      track("auth_error", { where: "google", code: (err as any)?.code || "google_signin_failed" });
    }
  };

  // ✅ NEW: Facebook OAuth flow (popup → redirect fallback)
  const fbProvider = new FacebookAuthProvider(); // local instance to avoid touching lib/firebase
  const handleFacebookAuth = async () => {
    try {
      track("auth_sign_in_click", { source: "auth_modal", method: "facebook" });

      // Ask for basic scopes; email is common for contact
      fbProvider.addScope?.("email");

      if (await shouldForceRedirect()) {
        await signInWithRedirect(auth, fbProvider);
        return;
      }

      try {
        await signInWithPopup(auth, fbProvider);
      } catch (err: any) {
        const code = err?.code as string | undefined;
        const fallbackCodes = new Set([
          "auth/popup-blocked",
          "auth/popup-closed-by-user",
          "auth/cancelled-popup-request",
          "auth/operation-not-supported-in-this-environment",
          "auth/unauthorized-domain",
        ]);
        if (code && fallbackCodes.has(code)) {
          await signInWithRedirect(auth, fbProvider);
          return;
        }
        throw err;
      }

      await ensureUserDocument();
      const uid = auth.currentUser?.uid;
      if (uid) setGaUser(uid, { auth_method: "facebook" });
      track("auth_success", { method: "facebook", via: "popup" });
      onClose();
    } catch (err) {
      console.error("Facebook sign-in failed:", err);
      setError("Facebook sign-in failed. Please try again.");
      track("auth_error", {
        where: "facebook",
        code: (err as any)?.code || "facebook_signin_failed",
      });
    }
  };

  const toggleMode = () => {
    const next = mode === "signin" ? "signup" : "signin";
    track("auth_mode_toggle", { from: mode, to: next });
    setMode(next);
  };

  const toggleShowPassword = () => {
    const next = !showPassword;
    track("auth_password_visibility", { show: next });
    setShowPassword(next);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[350px] space-y-4 shadow-lg">
        <h2 className="text-xl font-semibold text-center">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-2 border rounded-md pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 cursor-pointer"
            onClick={toggleShowPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        {mode === "signup" && (
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full p-2 border rounded-md pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 cursor-pointer"
              onClick={toggleShowPassword}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleEmailAuth}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </button>

        <div className="relative text-center my-2">
          <span className="text-sm text-gray-500">or</span>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full bg-white border border-gray-300 text-black py-3 px-4 rounded-md hover:bg-gray-100 flex items-center space-x-4"
        >
          {/* Google icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* ✅ NEW: Facebook button */}
        <button
          onClick={handleFacebookAuth}
          className="w-full bg-white border border-gray-300 text-black py-3 px-4 rounded-md hover:bg-gray-100 flex items-center space-x-4"
        >
          {/* Simple Facebook “f” icon */}
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22 12.06C22 6.49 17.52 2 12 2S2 6.49 2 12.06c0 4.99 3.66 9.13 8.44 9.94v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.48h-1.26c-1.24 0-1.63.77-1.63 1.55v1.86h2.78l-.44 2.91h-2.34V22c4.78-.81 8.44-4.95 8.44-9.94z"
              fill="currentColor"
            />
          </svg>
          <span>Continue with Facebook</span>
        </button>

        <p
          className="text-sm text-center text-blue-600 cursor-pointer hover:underline"
          onClick={toggleMode}
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </p>

        <button
          onClick={() => {
            track("auth_modal_cancel", { where: "button" });
            onClose();
          }}
          className="text-sm text-gray-400 text-center w-full hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
