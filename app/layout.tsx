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

const description =
  "A browser extension that rebuilds any website in one clean, consistent layout. One click, any site.";

export const metadata: Metadata = {
  // Absolute addresses for the share image: the production domain on Vercel, localhost otherwise.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000",
  ),
  title: "New Internet Society",
  description,
  openGraph: { title: "New Internet Society", description, type: "website" },
  twitter: { card: "summary_large_image", title: "New Internet Society", description, creator: "@aarushe_reddy" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plexMono.variable} ${superiorSerif.variable} ${interDisplay.variable} antialiased`}
    >
      <head>
        {/* Lets CSS hide content that will animate in, only when scripts run, and
            shows it anyway if the animation script hasn't started in 3s. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!d.dataset.motion)d.classList.remove('js')},3000)",
          }}
        />
      </head>
      <body className="min-h-dvh bg-white font-sans text-gray-950">
        {children}
      </body>
    </html>
  );
}
