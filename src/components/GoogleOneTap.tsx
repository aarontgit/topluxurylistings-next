"use client";

import { useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { app } from "../lib/firebase";
import { ensureUserDocument } from "../lib/createUserDoc";

declare global {
  interface Window {
    google?: any;
    __oneTapShown?: boolean; // guard to avoid double-prompt
  }
}

export default function GoogleOneTap() {
  const auth = getAuth(app);
  const initialized = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // If user already signed-in, don't show One Tap
      if (u) return;

      // Avoid multiple init/prompt across rerenders
      if (initialized.current || typeof window === "undefined") return;
      if (!window.google || !window.google.accounts || window.__oneTapShown) return;

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_ONE_TAP_CLIENT_ID;
      if (!clientId) {
        // Silent fail if not configured; avoids console noise in prod
        return;
      }

      try {
        initialized.current = true;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            try {
              if (!response?.credential) return;
              const cred = GoogleAuthProvider.credential(response.credential);
              await signInWithCredential(auth, cred);
              await ensureUserDocument();
              // optional: analytics
              (window as any)?.gtag?.("event", "login", { method: "google_one_tap" });
            } catch (err) {
              console.error("One Tap sign-in failed:", err);
            }
          },
          auto_select: true,
          cancel_on_tap_outside: false,
          // You can tweak the look with 'ux_mode' or 'context' if desired:
          // ux_mode: "popup",
          // context: "signin",
        });

        window.__oneTapShown = true; // guard so we don’t re-present
        window.google.accounts.id.prompt((notification: any) => {
          // Debug / optional handling:
          // console.log("One Tap prompt:", notification);
          // Possible reasons: dismissed, skipped, browser not supported, etc.
        });
      } catch (e) {
        console.error("One Tap init error:", e);
      }
    });

    return () => unsub();
  }, [auth]);

  return null;
}
