"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // ✅ added

export default function ContactForm() {
  // --- GA helper (no PII) ---
  const track = (name: string, params?: Record<string, any>) =>
    (window as any)?.gtag?.("event", name, params || {});

  const OPTIONS = [
    { label: "I'm interested in selling a home", code: "selling" as const },
    { label: "I'm interested in buying a home", code: "buying" as const },
    { label: "I want more information about Colorado Real Estate", code: "info" as const },
    { label: "I'm interested in home prep services", code: "prep" as const },
    { label: "Other", code: "other" as const },
  ];
  type InterestCode = typeof OPTIONS[number]["code"];
  type ContactMethod = "phone" | "email";

  const [submitted, setSubmitted] = useState(false);
  const [formAttempted, setFormAttempted] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [interestCode, setInterestCode] = useState<InterestCode>("selling");
  const [method, setMethod] = useState<ContactMethod>("phone");

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams(); // ✅ added
  const [notesPrefill, setNotesPrefill] = useState(""); // ✅ added

  // ✅ prefill interest from query (?interest=prep|selling|buying|info|other)
  useEffect(() => {
    const q = searchParams.get("interest");
    if (q) {
      const valid = new Set(OPTIONS.map(o => o.code));
      if (valid.has(q as InterestCode)) {
        setInterestCode(q as InterestCode);
        (window as any)?.gtag?.("event", "contact_interest_prefill", { interest: q });
      }
    }
    // ✅ prefill notes from query (?notes=...)
    const nRaw = searchParams.get("notes");
    if (nRaw) {
      const n = nRaw.replace(/\+/g, " "); // handle '+' from URL encoding if present
      setNotesPrefill(n);
      (window as any)?.gtag?.("event", "contact_notes_prefill", { source: "query" });
    }
  }, [searchParams]); // minimal deps

  // Form view
  useEffect(() => {
    track("contact_form_view");
  }, []);

  // Clear the other field's error when switching method
  useEffect(() => {
    if (method === "phone") setEmailError("");
    else setPhoneError("");
  }, [method]);

  const validatePhone = (phone: string) => {
    const phoneRegex =
      /^(\+?1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const selectedLabel = OPTIONS.find((o) => o.code === interestCode)!.label;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormAttempted(true);

    track("contact_submit_attempt", { interest: interestCode, method });

    if (method === "phone") {
      const phone = phoneInputRef.current?.value || "";
      const isPhoneValid = validatePhone(phone);
      if (!isPhoneValid) {
        setPhoneError("Please enter a valid US phone number.");
        track("contact_submit_blocked", { interest: interestCode, method, invalidPhone: true });
        return;
      } else {
        setPhoneError("");
      }
    } else {
      const email = emailInputRef.current?.value || "";
      const isEmailValid = validateEmail(email);
      if (!isEmailValid) {
        setEmailError("Please enter a valid email address.");
        track("contact_submit_blocked", { interest: interestCode, method, invalidEmail: true });
        return;
      } else {
        setEmailError("");
      }
    }

    setSubmitted(true);
    track("contact_submit_success", { interest: interestCode, method });
    (e.target as HTMLFormElement).submit();
  };

  return (
    <section className="bg-gray-100 rounded-2xl shadow-md p-6">
      <form
        action="https://script.google.com/macros/s/AKfycbxM5qdKnuTp7hn8eXcApIfy29B6EMFUHRtqPSruj34OfMfq9IOkbcCj_E-Qv10ojp4G/exec"
        method="POST"
        target="hidden_iframe"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Interest dropdown (posts the label string) */}
        <div>
          <label className="block text-sm font-medium mb-1">How can we help?</label>
          <select
            name="interest"
            className="w-full p-3 rounded border border-gray-300 bg-white"
            value={selectedLabel}
            onChange={(e) => {
              const next = OPTIONS.find((o) => o.label === e.target.value)?.code ?? "other";
              setInterestCode(next);
              track("contact_interest_change", { interest: next });
            }}
          >
            {OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reuse old "address" column for the interest selection */}
        <input type="hidden" name="address" value={selectedLabel} />

        {/* Preferred contact method */}
        <div>
          <label className="block text-sm font-medium mb-1">Preferred method of contact</label>
          <select
            name="preferred_contact"
            className="w-full p-3 rounded border border-gray-300 bg-white"
            value={method}
            onChange={(e) => {
              const next = (e.target.value as ContactMethod) || "phone";
              setMethod(next);
              track("contact_method_change", { method: next });
            }}
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </select>
        </div>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="w-full p-3 rounded border border-gray-300"
          required
        />

        {/* Conditionally render only the chosen contact field */}
        {method === "phone" ? (
          <>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              ref={phoneInputRef}
              className="w-full p-3 rounded border border-gray-300"
              required
            />
            {formAttempted && phoneError && (
              <p className="text-red-500 text-sm">{phoneError}</p>
            )}
          </>
        ) : (
          <>
            <input
              type="email"
              name="phone"  // ← send email to the same Sheet column used for phone
              placeholder="Email Address"
              ref={emailInputRef}
              className="w-full p-3 rounded border border-gray-300"
              required
            />
            {formAttempted && emailError && (
              <p className="text-red-500 text-sm">{emailError}</p>
            )}
          </>
        )}

        <textarea
          name="notes"
          placeholder="Tell us anything else (optional)"
          className="w-full p-3 rounded border border-gray-300"
          defaultValue={notesPrefill} // ✅ prefilled from query
        />

        <div className="flex items-center">
          <input type="checkbox" className="mr-2" required />
          <label className="text-sm text-gray-600">
            I agree to receive texts or calls from this business about real estate services.
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition"
        >
          Send
        </button>

        <iframe name="hidden_iframe" style={{ display: "none" }} />
      </form>

      {submitted && (
        <p className="text-green-600 mt-2">✅ Form submitted! We’ll be in touch soon.</p>
      )}
    </section>
  );
}
