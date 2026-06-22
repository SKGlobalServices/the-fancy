import { redirect } from "next/navigation";

export default function Home() {
  // TODO: Check if user is authenticated, redirect accordingly
  redirect("/login");
}
