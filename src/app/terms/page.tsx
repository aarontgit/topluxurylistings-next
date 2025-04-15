// src/app/terms/page.tsx
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>

        <p className="mb-4">
          Welcome to Top Luxury Listings. By accessing or using our website, you agree to be bound by these Terms of Service. Please read them carefully.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By using our services, you agree to comply with and be legally bound by these terms. If you do not agree to these terms, you should not use our services.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Use of Services</h2>
        <p className="mb-4">
          Our services are intended for users seeking home valuations. You agree not to misuse the service, including attempting to reverse-engineer, overload, or disrupt our systems.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Account and Access</h2>
        <p className="mb-4">
          Access to the valuation tool may require authentication through Google Sign-In. You agree to provide accurate and complete information during sign-in and to keep your account secure.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. API Usage Limits</h2>
        <p className="mb-4">
          Use of our valuation tools may be limited per user tier. We reserve the right to limit or revoke access if abuse or excessive usage is detected.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Intellectual Property</h2>
        <p className="mb-4">
          All content, branding, and design elements are the property of Top Luxury Listings and may not be copied or used without permission.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Disclaimer</h2>
        <p className="mb-4">
          Home valuations provided are estimates based on available data and are not guarantees of property value. Users should consult professionals before making financial decisions.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to Terms</h2>
        <p className="mb-4">
          We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact</h2>
        <p>
          If you have any questions about these Terms of Service, please contact us at info@topluxurylistings.com.
        </p>
      </main>
      <Footer />
    </div>
  );
}
