import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import SessionProvider from "@/components/providers/SessionProvider";
import LocaleProvider from "@/components/providers/LocaleProvider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Life RPG",
  description: "Gamified life-management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${manrope.variable} ${jetbrains.variable}`}>
      <body className="bg-bg text-text font-sans antialiased">
        <SessionProvider>
          <LocaleProvider>
            {children}
            <Toaster
              position="bottom-right"
              theme="dark"
              toastOptions={{
                style: {
                  background: "#111118",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#e8e6e3",
                },
              }}
            />
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
