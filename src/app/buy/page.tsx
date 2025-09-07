// app/Buy/page.tsx

"use client";

import { Suspense } from "react";
import BuyPageInner from "./BuyPageInner";
//import GoogleMapsLoader from "components/GoogleMapsLoader";

export default function ListingsPage() {
  return (
    <Suspense fallback={null}>
      <BuyPageInner />
    </Suspense>
  );
}
