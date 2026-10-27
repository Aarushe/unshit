import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const superiorSerif = localFont({
  variable: "--font-superior",
  src: [
    { path: "./fonts/LTSuperiorSerif-Regular.otf", weight: "400" },
    { path: "./fonts/LTSuperiorSerif-Medium.otf", weight: "500" },
  ],
});

const interDisplay = localFont({
  variable: "--font-inter-display",
  src: [
    { path: "./fonts/InterDisplay-Regular.otf", weight: "400" },
    { path: "./fonts/InterDisplay-Medium.otf", weight: "500" },
    { path: "./fonts/InterDisplay-SemiBold.otf", weight: "600" },
  ],
});

export const metadata: Metadata = {
  title: "New Internet Society",
  description:
    "A society for the people building the internet we actually want to live on.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} ${superiorSerif.variable} ${interDisplay.variable} antialiased`}
    >
      <body className="min-h-dvh bg-white font-sans text-gray-950">
        {children}
      </body>
    </html>
  );
}
