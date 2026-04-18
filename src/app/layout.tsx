import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Capilux | Nutricion Premium",
  description: "Suplementos nutricionales de alta calidad para potenciar tu salud, energia y bienestar. Productos premium formulados con los mejores ingredientes.",
  keywords: ["Capilux", "nutricion", "suplementos", "bienestar", "salud", "vitaminas", "colageno", "proteinas"],
  icons: {
    icon: "/capilux-logo.png",
  },
  openGraph: {
    title: "Capilux | Nutricion Premium",
    description: "Suplementos nutricionales de alta calidad para potenciar tu salud, energia y bienestar.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
