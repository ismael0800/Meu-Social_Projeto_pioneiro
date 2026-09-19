import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Topbar } from "@/components/layout/Topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tarifa Social - Aegea",
  description: "Plataforma Interna Tarifa Social Aegea",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-superficie min-h-screen flex flex-col`}>
        <Topbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
