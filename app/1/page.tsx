import { redirect } from "next/navigation";

// The serif version is now the main page.
export default function V1() {
  redirect("/");
}
