import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white px-6 py-4 shadow flex items-center">
      <Link href="/" className="flex items-center space-x-2">
        <Image src="/favicon.jpg" alt="Top Luxury Listings Logo" width={40} height={40} />
        <span className="font-bold text-lg text-gray-800">Top Luxury Listings</span>
      </Link>
    </header>
  );
}
