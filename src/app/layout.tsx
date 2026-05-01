import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BRAND_DESCRIPTION, BRAND_TITLE, absoluteUrl } from "@/lib/brand";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
  variable: "--font-body",
});

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
      <body className={`${notoSansKr.variable} min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased md:pb-0`}>
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
