import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GtagPageView from "../components/GtagPageview";
import { Suspense } from "react";
import GoogleMapsLoader from "../components/GoogleMapsLoader"; // ✅ add this

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Top Luxury Listings",
  description: "Sell your home fast and stress-free.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-60DZCQBLGM" />
        <script
          id="gtag-init"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-60DZCQBLGM', { page_path: window.location.pathname });
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <GtagPageView />
        </Suspense>

        {/* ✅ Load Google Maps once for the whole app */}
        <GoogleMapsLoader>
          {children}
        </GoogleMapsLoader>
      </body>
    </html>
  );
}
