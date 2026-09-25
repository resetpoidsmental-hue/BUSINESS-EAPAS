import Link from "next/link";
import { redirect } from "next/navigation";
import { getPatientSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PatientLoginForm } from "./login-form";

export default async function PortailConnexionPage() {
  const session = await getPatientSession();
  if (session) redirect("/portail");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-lg font-bold">
            E
          </div>
          <h1 className="text-xl font-semibold">Mon espace suivi</h1>
          <p className="text-sm text-muted">Ton programme, tes progrès et tes documents.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Saisis le code d&apos;accès personnel remis par ton coach.</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientLoginForm />
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted">
          Tu es le coach ?{" "}
          <Link href="/connexion" className="text-primary hover:underline">
            Accéder à l&apos;espace professionnel
          </Link>
        </p>
      </div>
    </div>
  );
}
