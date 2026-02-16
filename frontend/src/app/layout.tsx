import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import QueryProvider from "@/providers/query-provider";
import UiPreferencesProvider from "@/components/ui-preferences-provider";
import ParallaxBackground from "@/components/ParallaxBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EnvControl Dashboard",
  description: "Advanced environment monitoring and control system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} relative overflow-x-hidden bg-transparent antialiased font-sans text-foreground`}
      >
        <UiPreferencesProvider>
          <QueryProvider>
            <ParallaxBackground />
            <div className="relative z-10">{children}</div>
          </QueryProvider>
        </UiPreferencesProvider>
      </body>
    </html>
  );
}
