import type { Metadata } from "next";
import { Site } from "@/components/site";
import { defaultContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "New Internet Society — sans",
};

export default function Sans() {
  return (
    <Site
      variant="v0"
      content={defaultContent}
      links={{ alternate: "/", action: "#apply" }}
    />
  );
}
