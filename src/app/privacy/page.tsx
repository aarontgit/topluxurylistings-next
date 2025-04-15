// src/app/privacy/page.tsx
"use client";

import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p>
          At Top Luxury Listings, we take your privacy seriously. We only collect the
          personal data you provide to us voluntarily — including your name, phone
          number, and property address — for the sole purpose of delivering valuation
          services and home sale consultations.
        </p>
        <p>
          We never share or sell your data to third parties. Your information is stored
          securely and used only to provide services, communicate with you, and
          improve our offerings.
        </p>
        <p>
          You may request to access, update, or delete your personal data at any time
          by contacting us at support@topluxurylistings.com.
        </p>
        <p>
          This policy may be updated periodically. Continued use of our services
          constitutes acceptance of the most recent version.
        </p>
      </main>
      <Footer />
    </div>
  );
}
