import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COACH_COOKIE = "eapas_session";
const PATIENT_COOKIE = "eapas_patient_session";

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

// Les deux cookies sont signés avec le même secret : vérifier seulement la
// signature laisserait un token patient valide, posé dans le cookie coach,
// passer pour une session coach légitime (et inversement). Le champ `kind`
// posé par src/lib/auth.ts doit donc correspondre au rôle attendu ici.
async function hasRole(token: string | undefined, kind: "coach" | "patient") {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.kind === kind;
  } catch {
    return false;
  }
}

// Toutes les routes sous (coach) doivent figurer ici : une route oubliée
// échappe entièrement au contrôle du proxy (seul le layout protège alors la
// page, jamais les server actions qu'elle expose).
const COACH_PROTECTED = [
  "/dashboard",
  "/patients",
  "/nutrition",
  "/administratif",
  "/sav",
  "/reglages",
  "/prospects",
  "/prestations",
  "/agenda",
  "/assistant",
  "/analytique",
];
const PATIENT_PROTECTED = ["/portail"];
const PATIENT_PUBLIC = ["/portail/connexion"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (COACH_PROTECTED.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get(COACH_COOKIE)?.value;
    if (!(await hasRole(token, "coach"))) {
      const url = req.nextUrl.clone();
      url.pathname = "/connexion";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (
    PATIENT_PROTECTED.some((p) => pathname.startsWith(p)) &&
    !PATIENT_PUBLIC.some((p) => pathname.startsWith(p))
  ) {
    const token = req.cookies.get(PATIENT_COOKIE)?.value;
    if (!(await hasRole(token, "patient"))) {
      const url = req.nextUrl.clone();
      url.pathname = "/portail/connexion";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/patients/:path*",
    "/nutrition/:path*",
    "/administratif/:path*",
    "/sav/:path*",
    "/reglages/:path*",
    "/prospects/:path*",
    "/prestations/:path*",
    "/agenda/:path*",
    "/assistant/:path*",
    "/analytique/:path*",
    "/portail/:path*",
  ],
};
