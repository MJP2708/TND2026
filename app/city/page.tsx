import { redirect } from "next/navigation";

// /city → /community (city is the My City tab within community)
export default function CityPage() {
  redirect("/community");
}
