import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppStateProvider } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tycoon Focus",
  description: "Turn your goals into daily wins. Focus, earn, and grow.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
