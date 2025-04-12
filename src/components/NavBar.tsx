import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="bg-white border-b shadow px-6 py-4 mb-6">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Top Luxury Listings</h1>
        <div className="space-x-4">
          <Link href="/" className="text-blue-600 hover:underline">
            Home
          </Link>
          <Link href="/valuation" className="text-blue-600 hover:underline">
            Valuation Tool
          </Link>
        </div>
      </div>
    </nav>
  );
}