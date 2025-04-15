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
          At <strong>Top Luxury Listings</strong>, we are committed to protecting your privacy.
          This policy outlines how we collect, use, and safeguard your personal information.
        </p>

        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>
          When you use our services, we may collect:
          <ul className="list-disc ml-6 mt-2">
            <li>Your name, email address, and profile image (via Google Sign-In)</li>
            <li>Your phone number and property address (submitted for home valuations)</li>
          </ul>
        </p>

        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p>
          We use your information to:
          <ul className="list-disc ml-6 mt-2">
            <li>Authenticate your identity securely via Google Sign-In</li>
            <li>Provide accurate home valuations and consultations</li>
            <li>Contact you with updates or inquiries related to your request</li>
          </ul>
          We do <strong>not</strong> sell or share your data with third parties. Your information
          is securely stored and used solely for service delivery.
        </p>

        <h2 className="text-xl font-semibold">3. Third-Party Services</h2>
        <p>
          We rely on trusted third-party providers to operate our services:
          <ul className="list-disc ml-6 mt-2">
            <li><strong>Google Sign-In</strong> – user authentication</li>
            <li><strong>Firebase</strong> – secure data storage and user management</li>
            <li><strong>Google Maps API</strong> – address and location functionality</li>
            <li><strong>RentCast API</strong> – real estate data and valuation estimates</li>
          </ul>
          These providers may collect limited technical data as part of their service.
        </p>

        <h2 className="text-xl font-semibold">4. Data Control & Retention</h2>
        <p>
          You may request to access, update, or delete your personal data at any time by
          contacting us at <a href="mailto:support@topluxurylistings.com" className="text-blue-600 underline">support@topluxurylistings.com</a>.
          We retain information only as needed to provide services or fulfill legal obligations.
        </p>

        <h2 className="text-xl font-semibold">5. Updates to This Policy</h2>
        <p>
          This policy may be updated periodically. Continued use of our services after an
          update constitutes acceptance of the new version.
        </p>
      </main>
      <Footer />
    </div>
  );
}
