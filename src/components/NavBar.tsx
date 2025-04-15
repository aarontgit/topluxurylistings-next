import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  return (
    <header className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#EFEAE4" }}>
      <Link href="/">
        <div className="cursor-pointer">
          <Image
            src="/logo.png"
            alt="Top Luxury Listings Logo"
            width={90}
            height={90}
            priority
          />
        </div>
      </Link>
      <nav className="space-x-6 text-sm font-medium">
        <Link href="/valuation" className="text-gray-800 hover:underline">
          Valuation Tool
        </Link>
        <Link href="/contact" className="text-gray-800 hover:underline">
          Contact
        </Link>
      </nav>
    </header>
  );
}
