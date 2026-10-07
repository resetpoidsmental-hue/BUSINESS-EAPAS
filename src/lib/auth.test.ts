import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateAccessCode, hashAccessCode } from "./auth";

describe("hashPassword / verifyPassword", () => {
  it("vérifie un mot de passe correct contre son hash", async () => {
    const hash = await hashPassword("un-mot-de-passe-solide");
    expect(await verifyPassword("un-mot-de-passe-solide", hash)).toBe(true);
  });

  it("rejette un mot de passe incorrect", async () => {
    const hash = await hashPassword("un-mot-de-passe-solide");
    expect(await verifyPassword("mauvais-mot-de-passe", hash)).toBe(false);
  });

  it("ne stocke jamais le mot de passe en clair dans le hash", async () => {
    const password = "un-mot-de-passe-solide";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
  });

  it("génère un hash différent à chaque appel (salage bcrypt)", async () => {
    const h1 = await hashPassword("meme-mot-de-passe");
    const h2 = await hashPassword("meme-mot-de-passe");
    expect(h1).not.toBe(h2);
  });
});

describe("generateAccessCode", () => {
  it("génère un code au format XXXX-XXXX avec des caractères non ambigus", () => {
    const code = generateAccessCode();
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it("n'utilise jamais les caractères ambigus (0, O, 1, I)", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateAccessCode();
      expect(code).not.toMatch(/[01OI]/);
    }
  });
});

describe("hashAccessCode", () => {
  it("normalise en majuscules et ignore les espaces avant de hacher", () => {
    expect(hashAccessCode("ab12-cd34")).toBe(hashAccessCode("AB12-CD34"));
    expect(hashAccessCode("  AB12-CD34  ")).toBe(hashAccessCode("AB12-CD34"));
  });

  it("produit le digest SHA-256 attendu (vérifié indépendamment)", () => {
    // Valeur de référence calculée hors de l'app : sha256("AB12-CD34")
    expect(hashAccessCode("ab12-cd34")).toBe(
      "6da86a1647806bbd7643c17b3374b67e00a1ea9bfc2f6dd34836f1e22b70c380"
    );
  });

  it("produit des hashs différents pour des codes différents", () => {
    expect(hashAccessCode("AB12-CD34")).not.toBe(hashAccessCode("AB12-CD35"));
  });
});
