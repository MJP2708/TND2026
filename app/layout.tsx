import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { SWRegistration } from "./sw-register";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: "#386a5f",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Tycoon Focus",
  description: "Plan your goal, focus daily, earn rewards, and grow your calm city.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Tycoon Focus",
    statusBarStyle: "default",
  },
  applicationName: "Tycoon Focus",
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <SWRegistration />
      </body>
    </html>
  );
}
