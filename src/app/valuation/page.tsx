import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import ValuationTool from "../../components/ValuationTool";
import GoogleMapsLoader from "../../components/GoogleMapsLoader";

export default function ValuationPage() {
  return (
    <div className="pt-10">
    <div className="min-h-screen bg-white text-gray-900">
      <NavBar />
      <main className="w-full">
        <GoogleMapsLoader>
        <ValuationTool />
        </GoogleMapsLoader>
      </main>
      <Footer />
    </div>
    </div>
  );
}
