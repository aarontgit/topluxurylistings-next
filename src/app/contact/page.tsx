import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import ChatSection from "../../components/ChatSection";
import ContactForm from "../../components/ContactForm";

export default function ContactPage() {
  return (
    <div className="pt-28">
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-700 mb-6">
          Please fill out the form below and our team will reach out shortly.
        </p>
        <ContactForm />
        <ChatSection />
      </main>
      <Footer />
    </>
    </div>
  );
}