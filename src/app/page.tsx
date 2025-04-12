'use client';

import Header from "../components/Header";
import NavBar from "../components/NavBar";
import ContactForm from "../components/ContactForm";
import ChatSection from "../components/ChatSection";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <NavBar />
      <main className="max-w-2xl mx-auto p-6">
        <ContactForm />
        <ChatSection />
      </main>
      <Footer />
    </div>
  );
}
