import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

import { Handshake, Home, Hammer } from "lucide-react";

export default function SellPage() {
  return (
    <>
      <NavBar />
      <div className="bg-white text-gray-900">
      <section
        className="relative h-[60vh] bg-cover bg-center flex items-center justify-center px-6 text-center text-white"
        style={{
            backgroundImage: "url('/hero2.png')",
        }}
        >
        <div className="absolute inset-0 bg-black/60" /> {/* ⬅ Dark overlay */}
        <div className="relative max-w-3xl mx-auto p-8">
            <h1 className="text-4xl font-bold mb-4">Sell your home with confidence</h1>
            <p className="text-lg mb-6">
            Whether you work with an agent or take another approach, we’ll help you navigate the
            process and get the most out of your sale.
            </p>
            <button className="bg-gold-500 text-black px-6 py-3 rounded hover:bg-gold-400 transition font-semibold">
            Get your home value estimate
            </button>
        </div>
        </section>

        <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-semibold mb-10 text-center">Ways to sell your home</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            
            {/* Card 1 */}
            <div className="p-6 border rounded-lg shadow-sm text-center">
            <Handshake className="w-10 h-10 mx-auto mb-4 text-gold-500" />
            <h3 className="text-xl font-bold mb-2">Work with an agent</h3>
            <p className="text-gray-700 mb-4">
                Find the right agent to sell your home for the best price.
            </p>
            <a href="/agents" className="text-blue-600 font-medium hover:underline">
                Find an agent
            </a>
            </div>

            {/* Card 2 */}
            <div className="p-6 border rounded-lg shadow-sm text-center">
            <Home className="w-10 h-10 mx-auto mb-4 text-gold-500" />
            <h3 className="text-xl font-bold mb-2">List it yourself</h3>
            <p className="text-gray-700 mb-4">
                Explore options for selling your home without an agent.
            </p>
            <a href="#" className="text-blue-600 font-medium hover:underline">
                Learn more
            </a>
            </div>

            {/* Card 3 */}
            <div className="p-6 border rounded-lg shadow-sm text-center">
            <Hammer className="w-10 h-10 mx-auto mb-4 text-gold-500" />
            <h3 className="text-xl font-bold mb-2">Get help prepping your home</h3>
            <p className="text-gray-700 mb-4">
                We can connect you with trusted professionals for repairs, staging, and cleaning.
            </p>
            <a href="#" className="text-blue-600 font-medium hover:underline">
                Explore services
            </a>
            </div>

        </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
