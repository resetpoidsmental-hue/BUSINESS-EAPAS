import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, randomInt } from "node:crypto";

const COACH_COOKIE = "eapas_session";
const PATIENT_COOKIE = "eapas_patient_session";
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 jours

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant dans l'environnement");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export interface CoachSessionPayload {
  userId: string;
  email: string;
  nom: string;
}

export interface PatientSessionPayload {
  patientId: string;
}

async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
}

async function verifyToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

/**
 * Les deux cookies de session sont signés avec le même secret, donc sans un
 * champ de rôle vérifié ici, un token patient valide copié dans le cookie
 * coach (ou inversement) passerait la vérification de signature et serait
 * traité comme une session légitime de l'autre rôle — un patient obtiendrait
 * l'accès complet aux dossiers de tous les patients.
 */
export async function createCoachSession(payload: CoachSessionPayload) {
  const token = await signToken({ ...payload, kind: "coach" });
  const store = await cookies();
  store.set(COACH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function getCoachSession(): Promise<CoachSessionPayload | null> {
  const store = await cookies();
  const token = store.get(COACH_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken<CoachSessionPayload & { kind?: string }>(token);
  if (!payload || payload.kind !== "coach" || typeof payload.userId !== "string" || typeof payload.email !== "string") {
    return null;
  }
  return payload;
}

export async function destroyCoachSession() {
  const store = await cookies();
  store.delete(COACH_COOKIE);
}

export async function createPatientSession(payload: PatientSessionPayload) {
  const token = await signToken({ ...payload, kind: "patient" });
  const store = await cookies();
  store.set(PATIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function getPatientSession(): Promise<PatientSessionPayload | null> {
  const store = await cookies();
  const token = store.get(PATIENT_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken<PatientSessionPayload & { kind?: string }>(token);
  if (!payload || payload.kind !== "patient" || typeof payload.patientId !== "string") {
    return null;
  }
  return payload;
}

export async function destroyPatientSession() {
  const store = await cookies();
  store.delete(PATIENT_COOKIE);
}

/**
 * Lève une erreur si aucune session coach valide n'est présente. À appeler en
 * premier dans CHAQUE server action réservée au coach : Next.js expose une
 * server action comme un endpoint POST indépendant, atteignable directement
 * (id d'action visible dans le bundle client) sans jamais repasser par le
 * rendu de la page ni par son layout protégé — le layout seul ne suffit pas.
 */
export async function requireCoachSession(): Promise<CoachSessionPayload> {
  const session = await getCoachSession();
  if (!session) throw new Error("Non autorisé.");
  return session;
}

/** Même principe que requireCoachSession, côté portail patient. */
export async function requirePatientSession(): Promise<PatientSessionPayload> {
  const session = await getPatientSession();
  if (!session) throw new Error("Non autorisé.");
  return session;
}

export function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[randomInt(chars.length)];
    if (i === 3) code += "-";
  }
  return code;
}

export function hashAccessCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}
