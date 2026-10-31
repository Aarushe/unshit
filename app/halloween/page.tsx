import type { Metadata } from "next";
import localFont from "next/font/local";
import { Seance } from "./seance";

// Geist Serif, variable. Its one axis, ELSH, only changes the dots: the
// tittles on i and j, full stops, colons and umlauts go round, square,
// triangle, then heart from 0 to 100.
const geistSerif = localFont({
  src: "../fonts/GeistSerifVF.woff2",
  variable: "--font-geist-serif",
  weight: "400",
  display: "block",
});

export const metadata: Metadata = {
  title: "Do not look at the dots",
  description: "A Halloween page set in Geist Serif, where every dot is awake.",
};

export default function Page() {
  return (
    <div className={geistSerif.variable}>
      <Seance />
    </div>
  );
}
