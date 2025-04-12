"use client";

import React, { useState, useRef, useEffect } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formAttempted, setFormAttempted] = useState(false);
  const [validAddress, setValidAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const addressInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!addressInputRef.current || !(window as any).google) return;

    const google = (window as any).google;
    const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setValidAddress(true);
        setAddressError("");
      } else {
        setValidAddress(false);
      }
    });
  }, []);

  const validatePhone = (phone: string) => {
    const phoneRegex =
      /^(\+?1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormAttempted(true);

    const phone = phoneInputRef.current?.value || "";
    const isPhoneValid = validatePhone(phone);

    if (!validAddress) {
      setAddressError("Please pick a valid address from the dropdown.");
    }

    if (!isPhoneValid) {
      setPhoneError("Please enter a valid US phone number.");
    } else {
      setPhoneError("");
    }

    if (validAddress && isPhoneValid) {
      setSubmitted(true);
      (e.target as HTMLFormElement).submit();
    }
  };

  return (
    <section className="bg-gray-100 rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Get a Free Home Valuation</h2>
      <form
        action="https://script.google.com/macros/s/AKfycbxM5qdKnuTp7hn8eXcApIfy29B6EMFUHRtqPSruj34OfMfq9IOkbcCj_E-Qv10ojp4G/exec"
        method="POST"
        target="hidden_iframe"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="w-full p-3 rounded border border-gray-300"
          required
        />

        <input
          type="text"
          name="address"
          placeholder="Property Address"
          ref={addressInputRef}
          className="w-full p-3 rounded border border-gray-300"
          required
        />
        {formAttempted && addressInputRef.current?.value && !validAddress && (
          <p className="text-red-500 text-sm">{addressError}</p>
        )}

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

        <textarea
          name="notes"
          placeholder="Tell us anything else (optional)"
          className="w-full p-3 rounded border border-gray-300"
        />
        <div className="flex items-center">
          <input type="checkbox" className="mr-2" required />
          <label className="text-sm text-gray-600">
            I agree to receive texts or calls from this business about selling my home.
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition"
        >
          Get My Free Consultation
        </button>
        <iframe name="hidden_iframe" style={{ display: "none" }} />
      </form>
      {submitted && (
        <p className="text-green-600 mt-2">✅ Form submitted! We’ll be in touch soon.</p>
      )}
    </section>
  );
}
