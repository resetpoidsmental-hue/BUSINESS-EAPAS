import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

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

export async function createCoachSession(payload: CoachSessionPayload) {
  const token = await signToken({ ...payload });
  const store = await cookies();
  store.set(COACH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function getCoachSession() {
  const store = await cookies();
  const token = store.get(COACH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken<CoachSessionPayload>(token);
}

export async function destroyCoachSession() {
  const store = await cookies();
  store.delete(COACH_COOKIE);
}

export async function createPatientSession(payload: PatientSessionPayload) {
  const token = await signToken({ ...payload });
  const store = await cookies();
  store.set(PATIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function getPatientSession() {
  const store = await cookies();
  const token = store.get(PATIENT_COOKIE)?.value;
  if (!token) return null;
  return verifyToken<PatientSessionPayload>(token);
}

export async function destroyPatientSession() {
  const store = await cookies();
  store.delete(PATIENT_COOKIE);
}

export function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if (i === 3) code += "-";
  }
  return code;
}

export function hashAccessCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}
