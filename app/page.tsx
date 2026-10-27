import { Site } from "@/components/site";
import { defaultContentV1 } from "@/lib/content";

export default function Home() {
  return (
    <Site
      variant="v1"
      content={defaultContentV1}
      links={{ alternate: "/0", action: "#apply" }}
    />
  );
}
