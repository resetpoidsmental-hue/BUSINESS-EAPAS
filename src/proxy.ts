import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COACH_COOKIE = "eapas_session";
const PATIENT_COOKIE = "eapas_patient_session";

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

async function isValid(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

const COACH_PROTECTED = ["/dashboard", "/patients", "/nutrition", "/administratif", "/sav", "/reglages"];
const PATIENT_PROTECTED = ["/portail"];
const PATIENT_PUBLIC = ["/portail/connexion"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (COACH_PROTECTED.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get(COACH_COOKIE)?.value;
    if (!(await isValid(token))) {
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
    if (!(await isValid(token))) {
      const url = req.nextUrl.clone();
      url.pathname = "/portail/connexion";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/patients/:path*", "/nutrition/:path*", "/administratif/:path*", "/sav/:path*", "/reglages/:path*", "/portail/:path*"],
};
