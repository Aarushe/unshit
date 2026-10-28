import type { Metadata } from "next";
import { Hero, Install, Page } from "@/components/landing";

export const metadata: Metadata = {
  title: "Redesign any site — New Internet Society",
};

export default function RedesignHome() {
  return (
    <Page>
      <Hero />
      <Install />
    </Page>
  );
}
