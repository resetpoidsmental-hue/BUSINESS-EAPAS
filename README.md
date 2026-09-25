# EAPAS Suite

Application de suivi patient, nutrition, administratif et portail client pour un
Enseignant en Activité Physique Adaptée et Santé (EAPAS) / Coach Nutrition.

Construite pour être **auto-hébergée** : toutes les données (y compris les données
de santé) restent sur ton propre serveur — aucune donnée n'est envoyée à un
service tiers. Coût d'hébergement : 0 € de plus que ton VPS actuel.

## Fonctionnalités

- **Patients & clients** : dossier complet, entretien initial guidé, bilans
  cliniques (les 7 tests PASS : TM6, TUG, équilibre, force, souplesse) avec
  comparaison T0/T1/T2, objectifs SMART, calculateur IPAQ, calculateur
  nutritionnel (Mifflin-St Jeor), planning des séances.
- **Tableau de bord** : vue d'ensemble, alertes (risque de chute TUG > 12s,
  bilans en retard, objectifs dépassés).
- **Nutrition** : calculateur rapide autonome + suivi des clients nutrition.
- **Administratif** : devis, contrats (avec préréglages Formule Essentiel /
  Premium), factures — tous exportables en PDF —, suivi des abonnements,
  livre de comptes et estimation URSSAF, modèles de messages prêts à copier.
- **SAV** : tickets de suivi des demandes et réclamations.
- **Portail patient** (à activer dans Réglages) : chaque patient reçoit un code
  d'accès personnel pour consulter son programme, ses bilans et ses factures.

## Stack technique

- [Next.js](https://nextjs.org) (React) + TypeScript + Tailwind CSS
- Base de données SQLite (fichier unique, via [Prisma](https://prisma.io)) —
  simple à sauvegarder, aucun serveur de base de données à gérer
- Génération de PDF avec [@react-pdf/renderer](https://react-pdf.org)
- Authentification maison (cookies signés), pas de dépendance à un service
  d'auth tiers

## Démarrage en local (développement)

```bash
npm install
cp .env.example .env        # puis remplace AUTH_SECRET par une vraie valeur
npx prisma db push          # crée la base SQLite
npm run seed                # (optionnel) données de démonstration
npm run dev
```

Ouvre <http://localhost:3000> — la première visite te propose de créer ton
compte professionnel.

## Déploiement sur ton VPS (Docker)

Ce guide part du principe que tu as déjà un VPS (celui qui fait tourner n8n) et
un nom de domaine ou sous-domaine que tu peux pointer dessus (ex.
`suivi.ton-domaine.fr`).

### 1. Prérequis sur le VPS

Connecte-toi en SSH à ton VPS, puis installe Docker si ce n'est pas déjà fait :

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Récupérer le projet

```bash
git clone <URL_DE_TON_DEPOT> eapas-suite
cd eapas-suite
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
nano .env
```

Renseigne :

```
DATABASE_URL="file:/app/data/prod.db"
AUTH_SECRET="<colle ici le résultat de : openssl rand -hex 32>"
```

### 4. Lancer l'application

```bash
docker compose up -d --build
```

L'application tourne maintenant sur le port `3000` du VPS. Va sur
`http://IP_DE_TON_VPS:3000` pour vérifier que ça répond (tu devrais voir la
page de connexion). **Ne t'arrête pas là** : sans HTTPS, la connexion ne
fonctionnera pas correctement (les cookies de sécurité exigent une connexion
chiffrée) — passe à l'étape suivante.

### 5. Exposer l'application en HTTPS (obligatoire)

Le plus simple pour un débutant est [Caddy](https://caddyserver.com/), qui
obtient et renouvelle automatiquement un certificat HTTPS gratuit (Let's
Encrypt) sans configuration complexe.

**Si tu n'as pas encore de reverse proxy sur ce VPS :**

```bash
curl -fsSL https://get.docker.com | sh   # si pas déjà fait
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Édite `/etc/caddy/Caddyfile` et ajoute :

```
suivi.ton-domaine.fr {
    reverse_proxy localhost:3000
}
```

Puis :

```bash
sudo systemctl reload caddy
```

Assure-toi que le DNS de `suivi.ton-domaine.fr` pointe vers l'IP de ton VPS
(enregistrement A). Caddy obtient le certificat HTTPS automatiquement dès la
première requête.

**Si tu as déjà un reverse proxy (nginx, Caddy…) pour n8n :** ajoute simplement
un nouveau bloc / server pointant vers `localhost:3000`, sur ton sous-domaine
dédié à cette application.

### 6. Créer ton compte

Va sur `https://suivi.ton-domaine.fr` — la première visite te propose de créer
ton compte professionnel (email + mot de passe). Ensuite, va dans **Réglages**
pour renseigner ton nom d'activité, SIRET, adresse, etc. (utilisés sur tes
devis/factures).

## Sauvegardes

Toutes tes données vivent dans un unique fichier SQLite, stocké dans le volume
Docker `eapas_data`. Pour le sauvegarder régulièrement (recommandé : un script
cron hebdomadaire) :

```bash
docker compose exec app sh -c "cp /app/data/prod.db /app/data/backup-$(date +%F).db"
docker cp $(docker compose ps -q app):/app/data/backup-$(date +%F).db ./sauvegardes/
```

Ou plus simplement, sauvegarde le volume Docker complet avec ton outil de
sauvegarde habituel.

## Mettre à jour l'application

```bash
git pull
docker compose up -d --build
```

Le schéma de base de données se met à jour automatiquement au démarrage
(`prisma db push`). En cas de changement de structure important, fais une
sauvegarde avant de mettre à jour.

## Sécurité & RGPD

- Les mots de passe sont hachés (bcrypt), les sessions sont des cookies signés
  et **httpOnly** (inaccessibles en JavaScript).
- Les codes d'accès patients sont à usage unique par patient et révocables à
  tout moment depuis sa fiche.
- Les données de santé restent sur ton serveur — aucun tiers n'y a accès.
- Pense à activer les sauvegardes automatiques et à protéger l'accès SSH à ton
  VPS (clé SSH plutôt que mot de passe).
- Les modèles de devis/contrats/factures reprennent les mentions légales
  usuelles (auto-entrepreneur, TVA art. 293B, RGPD) mais **ne remplacent pas un
  avis juridique** — fais-les valider par un comptable/juriste avant usage réel.

## Pistes d'évolution non incluses dans cette v1

- Intégration directe avec tes automatisations n8n existantes (ex. webhook de
  notification à l'arrivée d'un nouveau patient, relance automatique) — les
  routes `/api/documents/*` peuvent servir de point de départ.
- Questionnaire Ricci & Gagnon (mentionné dans certaines de tes ressources) en
  complément du calculateur IPAQ déjà implémenté.
- Bibliothèque de séances/exercices type "programme du jour".
