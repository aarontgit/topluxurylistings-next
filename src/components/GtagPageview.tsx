"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GtagPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    window.gtag?.("event", "page_view", {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}
