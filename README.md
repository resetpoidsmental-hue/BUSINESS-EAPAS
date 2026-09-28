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
git clone -b claude/business-eapas-project-jty172 https://github.com/resetpoidsmental-hue/BUSINESS-EAPAS.git eapas-suite
cd eapas-suite
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
nano .env
```

Renseigne au minimum :

```
DATABASE_URL="file:/app/data/prod.db"
AUTH_SECRET="<colle ici le résultat de : openssl rand -hex 32>"
APP_HOST="suivi.ton-domaine.fr"
```

### 4. Brancher l'application sur le HTTPS

**Cas fréquent : tu as déjà un n8n installé via le template Docker Compose
communautaire (`traefik` + `n8n` dans le même fichier)** — c'est le cas si
`docker ps` montre un conteneur nommé `xxx-traefik-1`. Dans ce cas,
`docker-compose.yml` est déjà prêt à s'y brancher automatiquement : il ajoute
juste les étiquettes ("labels") Traefik nécessaires et rejoint le même réseau
Docker (par défaut `n8n_default` — renseigne `TRAEFIK_NETWORK` dans `.env` si
le tien porte un autre nom, visible avec `docker network ls`). Il te suffit de
lancer l'étape 5, rien d'autre à installer.

**Si tu n'as aucun reverse proxy sur ce VPS**, le plus simple est
[Caddy](https://caddyserver.com/) qui obtient un certificat HTTPS gratuit
automatiquement :

```bash
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

Puis `sudo systemctl reload caddy`, et remplace dans `docker-compose.yml` la
section `networks`/`labels` par un simple `ports: ["3000:3000"]` (tu n'as pas
besoin des étiquettes Traefik dans ce cas).

Dans les deux cas, assure-toi que le DNS de `APP_HOST` pointe vers l'IP de ton
VPS (un enregistrement **A**, à créer chez ton registrar de domaine).

### 5. Lancer l'application

```bash
docker compose up -d --build
```

Le certificat HTTPS se génère automatiquement à la première visite (ça peut
prendre jusqu'à une minute). Va sur `https://<APP_HOST>`.

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

## Site vitrine

Le dossier [`vitrine/`](./vitrine) contient un site public séparé (marketing, SEO,
formules, articles, recettes) connecté à EAPAS Suite via n8n. Voir
[`vitrine/README.md`](./vitrine/README.md) pour le déployer et finir de le connecter
(NocoDB, Telegram, n8n).

## Pistes d'évolution non incluses dans cette v1

- Paiement/réservation en ligne (Stripe) sur la page Formules, connecté à l'agenda
  et à l'application (Devis/Facture/Abonnement créés automatiquement).
- Agent IA de suivi patient (création des séances, suivi courant) avec validation du
  coach obligatoire sur les bilans (initial, intermédiaires, final).
- Questionnaire Ricci & Gagnon (mentionné dans certaines de tes ressources) en
  complément du calculateur IPAQ déjà implémenté.
