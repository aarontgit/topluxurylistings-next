import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f0ece8] to-[#e8e4df] text-gray-900">
      <NavBar />

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight max-w-3xl">
          Get the Most for Your Home — Effortlessly
        </h1>
        <p className="text-lg md:text-xl max-w-xl mb-10">
          Our expert-backed platform helps you sell your home faster and for top dollar. No stress. No guesswork. Just results.
        </p>
        <a
          href="/contact"
          className="inline-block bg-blue-700 text-white text-lg font-medium px-6 py-3 rounded-full shadow hover:bg-blue-800 transition"
        >
          Request a Free Consultation
        </a>
      </main>

      <section className="bg-white py-16 px-6 text-center">
        <h2 className="text-3xl font-semibold mb-4">Why Homeowners Choose Us</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          With deep market knowledge, strategic pricing, and expert presentation, we help homeowners like you get more from your most valuable asset.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div>
            <h3 className="text-xl font-bold mb-2">Top Market Insights</h3>
            <p className="text-gray-600">Our data-backed analysis ensures your home is priced to sell for maximum return.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Effortless Experience</h3>
            <p className="text-gray-600">We handle the details so you can focus on your next chapter.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Trusted by Sellers</h3>
            <p className="text-gray-600">Join hundreds of satisfied homeowners who got more by working with us.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
