import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCoachSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm, SetupForm } from "./login-form";

export default async function ConnexionPage() {
  const session = await getCoachSession();
  if (session) redirect("/dashboard");

  const userCount = await prisma.user.count();
  const isFirstRun = userCount === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-lg font-bold">
            E
          </div>
          <h1 className="text-xl font-semibold">EAPAS Suite</h1>
          <p className="text-sm text-muted">Le suivi patient, la nutrition et l&apos;administratif, au même endroit.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{isFirstRun ? "Bienvenue — créons ton compte" : "Connexion"}</CardTitle>
            <CardDescription>
              {isFirstRun
                ? "Cette application n'a pas encore de compte. Crée le tien pour commencer."
                : "Connecte-toi à ton espace professionnel."}
            </CardDescription>
          </CardHeader>
          <CardContent>{isFirstRun ? <SetupForm /> : <LoginForm />}</CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted">
          Espace patient ?{" "}
          <Link href="/portail/connexion" className="text-primary hover:underline">
            Accéder au portail patient
          </Link>
        </p>
      </div>
    </div>
  );
}
