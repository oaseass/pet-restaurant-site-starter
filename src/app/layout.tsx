import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BRAND_DESCRIPTION, BRAND_TITLE, absoluteUrl } from "@/lib/brand";

export const metadata: Metadata = {
  title: BRAND_TITLE,
  description: BRAND_DESCRIPTION,
  metadataBase: new URL((process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim()),
  applicationName: "댕냥지도",
  manifest: absoluteUrl("/manifest.webmanifest"),
  openGraph: {
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: "댕냥지도",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#fbf6f0] antialiased md:pb-0">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[-9rem] top-[-7rem] h-[24rem] w-[24rem] rounded-full bg-[#e9d7ca]/80 blur-3xl" />
          <div className="absolute right-[-10rem] top-[4rem] h-[24rem] w-[24rem] rounded-full bg-[#d6ebe2]/85 blur-3xl" />
          <div className="absolute bottom-[-12rem] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#f1debf]/55 blur-3xl" />
        </div>

        <div className="relative isolate flex min-h-screen flex-col">
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}
