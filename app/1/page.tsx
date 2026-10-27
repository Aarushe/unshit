import type { Metadata } from "next";
import { Site } from "@/components/site";
import { defaultContentV1 } from "@/lib/content";

export const metadata: Metadata = {
  title: "New Internet Society — v1",
};

export default function V1() {
  return (
    <Site
      variant="v1"
      content={defaultContentV1}
      links={{ alternate: "/", action: "#apply" }}
    />
  );
}
