import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import { ToastContainer } from 'react-toastify';
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Marketplace from "@/components/Marketplace";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stake Wars",
  description: "A PvP solana honeycomb protocol game",
  creator: 'DoyeCodes',
  keywords: [
    'demo',
    'wallet',
    'connect',
    'web3',
    'crypto',
    'blockchain',
    'dapp',
    'solana',
    'game',
    'mini app',
    'pvp',
    'staking',
    'staking wars',
    'stakingwars',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SolanaWalletProvider>
          <div className="min-h-screen bg-[url('/grid-lines.png')] bg-cover bg-center relative">
            <div className="min-h-screen bg-[url('/bg-gradient.png')] bg-cover bg-center">
              <NavBar />
              {children}
              <Marketplace />
              <Footer />
            </div>
          </div>
        </SolanaWalletProvider>
        <ToastContainer autoClose={3000} />
      </body>
    </html>
  );
}
