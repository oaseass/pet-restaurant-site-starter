import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "반려동물 동반 가능 식당 조회",
  description: "식품안전나라 공개 정보를 보기 쉽게 정리한 반려동물 동반 가능 식당 조회 사이트입니다.",
  metadataBase: new URL((process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim()),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
