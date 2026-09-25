import { redirect } from "next/navigation";
import { getCoachSession } from "@/lib/auth";

export default async function Home() {
  const session = await getCoachSession();
  redirect(session ? "/dashboard" : "/connexion");
}
