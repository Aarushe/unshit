import { Site } from "@/components/site";
import { defaultContent } from "@/lib/content";

export default function Home() {
  return (
    <Site
      variant="v0"
      content={defaultContent}
      links={{ alternate: "/1", action: "#apply" }}
    />
  );
}
