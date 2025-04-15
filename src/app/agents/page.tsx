import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <NavBar />
      <main className="flex-grow flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon</h1>
          <p className="text-lg text-gray-600 mb-6">
            Our Listings and Agents pages are currently under development.  
            Stay tuned for exclusive properties and trusted professionals!
          </p>
          <div className="text-gray-400 text-sm">© {new Date().getFullYear()} YourBrandName</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
