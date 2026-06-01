import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { AppStateProvider } from "@/lib/store";
import { auth } from "@/auth";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#5EA9FF",
};

export const metadata: Metadata = {
  title: "FocusVille – Focus. Build. Thrive.",
  description: "Turn your goals into a beautiful city. Build your future, one focus session at a time.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FocusVille",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  return (
    <html lang="en" className={poppins.variable}>
      <body style={{ fontFamily: "var(--font-poppins, Poppins, system-ui, sans-serif)" }}>
        <AppStateProvider userId={userId}>
          {children}
          <Toaster
            position="bottom-center"
            offset={80}
            toastOptions={{
              style: {
                fontFamily: "var(--font-poppins, Poppins, system-ui, sans-serif)",
                fontSize: "0.85rem",
                fontWeight: 600,
                borderRadius: 14,
                maxWidth: "90vw",
              },
            }}
          />
        </AppStateProvider>
      </body>
    </html>
  );
}
