import Header from "../../components/Header";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import ValuationTool from "../../components/ValuationTool";

export default function ValuationPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <NavBar />
      <main className="max-w-2xl mx-auto p-6">
        <ValuationTool />
      </main>
      <Footer />
    </div>
  );
}
