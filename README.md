# RecycleTrack API Groupe 2

## Membres du Groupe 2

- **DEFALEOUNA Tchassama Dessoklema Maxime** (Mainteneur du depot GitHub)
- **AKOTO Emefa Justine**
- **GNANSA Liherahom**


API RESTful de gestion et de suivi des stations de recyclage.

## Table des matieres

- [Demarrage rapide](#demarrage-rapide)
- [Configuration](#configuration)
- [Comptes de test](#comptes-de-test)
- [Fonctionnalites](#fonctionnalites)
  - [Mot de passe oublie](#mot-de-passe-oublie)
  - [Bootstrap automatique](#bootstrap-automatique-au-demarrage)
- [Donnees de demonstration](#donnees-de-demonstration-injectees)
- [URLs utiles](#urls-utiles)
- [Tests](#tests)
- [Notes equipe](#notes-equipe)

## Demarrage rapide

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement**
   
   Créer un fichier `.env` à la racine du projet avec les variables suivantes :
   ```env
   # Server
   PORT=3000
   
   # Database
   MONGO_URI=mongodb://127.0.0.1:27017/recycletrack
   
   # JWT Secrets
   JWT_SECRET=dev-access-secret-key-recycletrack-2026
   JWT_REFRESH_SECRET=dev-refresh-secret-key-recycletrack-2026
   
   # Email Configuration (Gmail)
   EMAIL_HOST_USER=defaleounamaxime@gmail.com
   EMAIL_HOST_PASSWORD="pswg ltmx ztyk hvbw"
   ```

3. **Lancer le serveur**
   ```bash
   npm run dev
   ```

4. **Accéder à la documentation**
   
   Ouvrir Swagger UI : http://localhost:3000/api-docs

## Configuration

### Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port du serveur | `3000` |
| `MONGO_URI` | URL de connexion MongoDB | `mongodb://127.0.0.1:27017/recycletrack` |
| `JWT_SECRET` | Clé secrète pour les tokens d'accès | `votre-secret-key` |
| `JWT_REFRESH_SECRET` | Clé secrète pour les tokens de refresh | `votre-refresh-secret` |
| `EMAIL_HOST_USER` | Adresse email Gmail pour l'envoi | `votre@gmail.com` |
| `EMAIL_HOST_PASSWORD` | Mot de passe d'application Gmail | `xxxx xxxx xxxx xxxx` |

### Configuration Email

L'envoi d'email est configure avec **Nodemailer** via Gmail.

**Note** : C'est l'email `defaleounamaxime@gmail.com` qui est utilise pour envoyer tous les emails de l'application (reinitialisation de mot de passe, notifications, etc.).


**Logs d'envoi d'email :**
Les logs detailles des envois d'email (succes et erreurs) sont ecrits dans le fichier `logs/combined.log` a la racine du projet. En environnement de developpement, les codes de verification sont egalement affiché dans ces logs.

## Comptes de test

Trois comptes de démonstration sont créés automatiquement au démarrage :

### SUPER_ADMIN
- **Email** : `superadmin@recycletrack.local`
- **Mot de passe** : `SuperAdmin123!`
- **Rôle** : `SUPER_ADMIN`

### ADMIN
- **Email** : `admin@recycletrack.local`
- **Mot de passe** : `Admin123!`
- **Rôle** : `ADMIN`

### AGENT
- **Email** : `agent@recycletrack.local`
- **Mot de passe** : `Agent123!`
- **Rôle** : `AGENT`

> Note : Le mot de passe par défaut pour tout nouvel utilisateur créé via l'API est `123456` si aucun mot de passe n'est fourni.

## Fonctionnalites

### Mot de passe oublié

Le module d'authentification expose un flux complet de réinitialisation de mot de passe :

1. **Demander un code**
   ```
   POST /api/v1/auth/forgot-password/request
   ```
   - Envoie un code à 6 chiffres par email
   - Le code expire après **15 minutes**

2. **Vérifier le code**
   ```
   POST /api/v1/auth/forgot-password/verify
   ```
   - Valide le code reçu

3. **Définir le nouveau mot de passe**
   ```
   POST /api/v1/auth/forgot-password/reset
   ```
   - Permet de choisir un nouveau mot de passe

**Fonctionnement :**
- Le code est envoyé par email à l'utilisateur
- En environnement de développement (`NODE_ENV !== "production"`), le code est aussi affiché dans les logs
- Si l'envoi d'email échoue, le code reste valide et visible dans les logs

### Bootstrap automatique au démarrage

Au démarrage de l'application, un jeu de données de démonstration est synchronisé automatiquement en base pour permettre à toute l'équipe de tester immédiatement.

**Le bootstrap est idempotent :**
- Si la donnée n'existe pas → elle est **créée**
- Si elle existe déjà avec les mêmes identifiants → elle est **mise à jour**
- Les comptes de test sont **réinitialisés** avec les mêmes mots de passe à chaque démarrage

**Données créées :**
- 1 utilisateur `SUPER_ADMIN`
- 1 utilisateur `ADMIN`
- 1 utilisateur `AGENT`
- 1 type de déchet
- 1 station
- 1 collecte
- 1 rapport

## Donnees de demonstration injectees

### Déchet
- **Nom** : `Plastique PET`
- **Catégorie** : `PLASTIQUE`
- **Unité de mesure** : `kg`

### Station
- **Nom** : `Station Centrale RecycleTrack`
- **Adresse** : `Boulevard du Mono`
- **Ville** : `Lomé`

### Collecte
- **Commentaire** : `Collecte bootstrap de démonstration`
- **Quantité** : `120 kg`
- **Statut** : `VALIDÉE`
- **Agent associé** : `agent@recycletrack.local`

### Rapport
- **Titre** : `Rapport bootstrap initial`
- **Statut** : `GÉNÉRÉ`
- **Utilisateur générateur** : `admin@recycletrack.local`

## URLs utiles

| Ressource | URL |
|-----------|-----|
| **API** | http://localhost:3000 |
| **Swagger UI** | http://localhost:3000/api-docs |
| **Swagger JSON** | http://localhost:3000/api-docs.json |

## Collection Postman

Une collection Postman complete est disponible a la racine du projet : `RecycleTrack_API.postman_collection.json`

### Importer la collection

1. Ouvrir Postman
2. Cliquer sur **Import**
3. Selectionner le fichier `RecycleTrack_API.postman_collection.json`
4. La collection contient toutes les routes de l'API avec des exemples de requetes

### Utiliser la collection

- Les variables d'environnement (token, userId, etc.) sont configurees automatiquement via les scripts de test
- Commencez par la requete **Login** pour obtenir un token d'acces
- Les requetes sont organisees par module (Auth, Users, Stations, Collectes, Dechets, Rapports)

## Tests

### Exécuter les tests

```bash
# Tous les tests avec coverage
npm run test

# Tests en mode watch
npm run test:watch
```

### Coverage actuel

- 270+ tests passing (100%)
- 99%+ code coverage
- Tests unitaires et d'intégration

## Notes equipe

- Personne n'a besoin d'attendre un autre membre pour tester le login ou les routes protégées
- Si vous relancez le serveur, les comptes de démo restent réutilisables avec les mêmes identifiants
- Les erreurs techniques détaillées sont écrites dans les logs du projet (`logs/`)
- Pour réinitialiser les données de test, il suffit de redémarrer le serveur

---

Developpe par Groupe 2
```
