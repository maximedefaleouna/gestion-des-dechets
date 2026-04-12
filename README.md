# RecycleTrack API

API RESTful de gestion et de suivi des stations de recyclage.

## Demarrage rapide

1. Installer les dependances avec `npm install`
2. Verifier le fichier `.env`
3. Lancer le projet avec `npm run dev`
4. Ouvrir la documentation Swagger sur `http://localhost:3000/api-docs`

## Bootstrap automatique au demarrage

Au demarrage de l'application, un jeu de donnees de demonstration est synchronise automatiquement en base pour permettre a toute l'equipe de tester immediatement.

Les donnees creees ou remises a jour sont :

- 1 utilisateur `SUPER_ADMIN`
- 1 utilisateur `ADMIN`
- 1 utilisateur `AGENT`
- 1 type de dechet
- 1 station
- 1 collecte
- 1 rapport

## Mot de passe par defaut des utilisateurs crees

Quand un utilisateur est cree via l'API, son mot de passe initial est `123456` si aucun mot de passe n'est fourni dans la requete.

Le module `auth` expose aussi:

- `POST /api/v1/auth/change-password` pour changer le mot de passe du compte connecte
- `POST /api/v1/auth/forgot-password/request` pour demander un code a 6 chiffres
- `POST /api/v1/auth/forgot-password/verify` pour verifier le code
- `POST /api/v1/auth/forgot-password/reset` pour definir le nouveau mot de passe

Le bootstrap est idempotent :

- si la donnee n'existe pas, elle est creee
- si elle existe deja avec les memes identifiants fonctionnels, elle est remise a jour
- les comptes de test sont reinitialises avec les mots de passe ci-dessous a chaque demarrage

## Comptes de test

### SUPER_ADMIN

- Email : `superadmin@recycletrack.local`
- Mot de passe : `SuperAdmin123!`
- Role : `SUPER_ADMIN`

### ADMIN

- Email : `admin@recycletrack.local`
- Mot de passe : `Admin123!`
- Role : `ADMIN`

### AGENT

- Email : `agent@recycletrack.local`
- Mot de passe : `Agent123!`
- Role : `AGENT`

## Donnees de demonstration injectees

### Dechet

- Nom : `Plastique PET`
- Categorie : `PLASTIQUE`
- Unite de mesure : `kg`

### Station

- Nom : `Station Centrale RecycleTrack`
- Adresse : `Boulevard du Mono`
- Ville : `Lome`

### Collecte

- Commentaire : `Collecte bootstrap de demonstration`
- Quantite : `120`
- Statut : `VALIDEE`
- Agent associe : `agent@recycletrack.local`

### Rapport

- Titre : `Rapport bootstrap initial`
- Statut : `GENERE`
- Utilisateur generateur : `admin@recycletrack.local`

## URLs utiles

- API : `http://localhost:3000`
- Swagger UI : `http://localhost:3000/api-docs`
- Swagger JSON : `http://localhost:3000/api-docs.json`

## Notes equipe

- personne n'a besoin d'attendre un autre membre pour tester le login ou les routes protegees
- si vous relancez le serveur, les comptes de demo restent reutilisables avec les memes identifiants
- les erreurs techniques detaillees sont ecrites dans les logs du projet
