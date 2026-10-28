import type { Metadata } from "next";
import { Examples, Hero, Page, UrlForm } from "@/components/landing";

export const metadata: Metadata = {
  title: "Redesign any site — New Internet Society",
};

export default function RedesignHome() {
  return (
    <Page>
      <Hero />
      <UrlForm />
      <Examples />
    </Page>
  );
}
