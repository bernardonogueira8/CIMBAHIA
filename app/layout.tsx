import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { MainContainer } from "@/components/layout/MainContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const instant = false;

export const metadata: Metadata = {
  title: "PharmaCare | Gestão do Cuidado Farmacêutico",
  description:
    "Sistema Oficial de Monitoramento e Indicadores de Acompanhamento Farmacoterapêutico para Macrorregionais de Saúde.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F4F4F6] text-[#171A20]">
        <AppProvider>
          <Header />
          <Navigation />
          <MainContainer>{children}</MainContainer>
        </AppProvider>
      </body>
    </html>
  );
}
