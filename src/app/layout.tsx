import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fichelo.es"),

  title: {
    default: "Fichelo.es — Control horario con GPS para empresas | Desde 19,90€/mes",
    template: "%s | Fichelo.es",
  },
  description:
    "Software de fichaje con GPS verificado para empresas. Cumple la normativa 2026 (Art. 34.9 ET). Avisos por email automáticos. 7 días gratis sin tarjeta.",

  keywords: [
    "control horario",
    "fichaje GPS",
    "registro jornada laboral",
    "normativa 2026",
    "software fichajes",
    "control empleados",
    "fichaje digital",
  ],

  openGraph: {
    title: "Fichelo.es — Control horario con GPS para empresas",
    description:
      "Fichaje GPS verificado en tiempo real. Cumple la normativa 2026. Avisos automáticos por email. Desde 19,90€/mes · 7 días gratis.",
    url: "https://www.fichelo.es",
    siteName: "Fichelo.es",
    locale: "es_ES",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Fichelo.es — Control horario con GPS para empresas",
    description:
      "Fichaje GPS verificado en tiempo real. Cumple la normativa 2026. Desde 19,90€/mes · 7 días gratis sin tarjeta.",
  },

  icons: {
    icon: [
      { url: "/favicon.ico",        sizes: "any" },
      { url: "/logo.png",           type: "image/png" },
    ],
    apple: "/logo.png",
  },

  manifest: "/manifest.json",

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  alternates: {
    canonical: "https://www.fichelo.es",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
