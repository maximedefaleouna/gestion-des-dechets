/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       required: [id, nom, prenom, email, role, isActive, createdBy, deletedBy, deletedAt, createdAt, updatedAt]
 *       properties:
 *         id:
 *           type: string
 *           example: 6610ff1c8d6f3a001f2c9a55
 *         nom:
 *           type: string
 *           example: Dupont
 *         prenom:
 *           type: string
 *           example: Alice
 *         email:
 *           type: string
 *           format: email
 *           example: alice.dupont@recycletrack.com
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *         isActive:
 *           type: boolean
 *           description: False signifie compte desactive par suppression logique.
 *           example: true
 *         createdBy:
 *           allOf:
 *             - $ref: '#/components/schemas/UserReference'
 *           description: Utilisateur ayant cree ce compte. Null pour le premier SUPER_ADMIN.
 *         deletedBy:
 *           allOf:
 *             - $ref: '#/components/schemas/UserReference'
 *           description: Utilisateur ayant desactive ce compte. Null si le compte est actif.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date de suppression logique. Null si le compte est actif.
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-06T09:30:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-06T10:00:00.000Z
 *     CreateUserRequest:
 *       type: object
 *       required: [nom, prenom, email]
 *       properties:
 *         nom:
 *           type: string
 *           description: Obligatoire.
 *           example: Mensah
 *         prenom:
 *           type: string
 *           description: Obligatoire.
 *           example: Koffi
 *         email:
 *           type: string
 *           format: email
 *           description: Obligatoire et unique.
 *           example: koffi.mensah@recycletrack.com
 *         password:
 *           type: string
 *           format: password
 *           description: Facultatif. Si absent, l'API attribue le mot de passe par defaut `123456`.
 *           example: Agent123!
 *         role:
 *           allOf:
 *             - $ref: '#/components/schemas/UserRole'
 *           description: "Facultatif. Valeur par defaut appliquee par l'API si absent: AGENT."
 *           example: AGENT
 *     UpdateUserRequest:
 *       type: object
 *       description: Tous les champs sont facultatifs mais au moins un champ doit etre fourni.
 *       properties:
 *         nom:
 *           type: string
 *           description: Facultatif.
 *           example: Amavi
 *         prenom:
 *           type: string
 *           description: Facultatif.
 *           example: Sena
 *         email:
 *           type: string
 *           format: email
 *           description: Facultatif et doit rester unique.
 *           example: sena.amavi@recycletrack.com
 *         password:
 *           type: string
 *           format: password
 *           description: Facultatif, minimum 6 caracteres.
 *           example: NewPass123!
 *         role:
 *           allOf:
 *             - $ref: '#/components/schemas/UserRole'
 *           description: Facultatif. Modifiable uniquement selon les droits du demandeur.
 *           example: ADMIN
 *         isActive:
 *           type: boolean
 *           description: Facultatif. False desactive le compte sans supprimer ses donnees d'activite.
 *           example: false
 *     UserSingleResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/UserResponse'
 *     UserListResponse:
 *       type: object
 *       required: [message, data, pagination]
 *       properties:
 *         message:
 *           type: string
 *           example: Liste des utilisateurs
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserResponse'
 *         pagination:
 *           type: object
 *           required: [page, limit, total, totalPages]
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 2
 *             totalPages:
 *               type: integer
 *               example: 1
 *     UserDeleteResponse:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *           example: Utilisateur desactive avec succes. Les donnees d'activite sont conservees.
 *
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: Lister les utilisateurs
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Roles autorises: ADMIN, SUPER_ADMIN.
 *       Par defaut, seuls les utilisateurs actifs sont retournes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numero de page.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'utilisateurs par page.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche sur nom, prenom ou email.
 *         example: alice
 *       - in: query
 *         name: role
 *         schema:
 *           $ref: '#/components/schemas/UserRole'
 *         description: Filtrer par role.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [nom, prenom, email, role, createdAt, updatedAt]
 *           default: createdAt
 *         description: Champ utilise pour le tri.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordre de tri.
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Si true, inclut aussi les comptes desactives.
 *     responses:
 *       '200':
 *         description: Liste paginee retournee avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       '401':
 *         description: JWT absent, invalide ou utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Compte desactive ou role insuffisant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Users]
 *     summary: Creer un utilisateur
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Roles autorises: ADMIN, SUPER_ADMIN.
 *       Le champ role est facultatif.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *           examples:
 *             createAgent:
 *               value:
 *                 nom: Mensah
 *                 prenom: Koffi
 *                 email: koffi.mensah@recycletrack.com
 *                 role: AGENT
 *             createDefaultRole:
 *               value:
 *                 nom: Lawson
 *                 prenom: Nina
 *                 email: nina.lawson@recycletrack.com
 *     responses:
 *       '201':
 *         description: Utilisateur cree avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSingleResponse'
 *             example:
 *               message: Utilisateur cree avec succes
 *               data:
 *                 id: 6610ff1c8d6f3a001f2c9a55
 *                 nom: Mensah
 *                 prenom: Koffi
 *                 email: koffi.mensah@recycletrack.com
 *                 role: AGENT
 *                 isActive: true
 *                 createdBy:
 *                   id: 6610ff1c8d6f3a001f2c9a11
 *                   nom: Doe
 *                   prenom: Jane
 *                   email: jane.doe@recycletrack.com
 *                   role: SUPER_ADMIN
 *                 deletedBy: null
 *                 deletedAt: null
 *                 createdAt: 2026-04-06T09:30:00.000Z
 *                 updatedAt: 2026-04-06T09:30:00.000Z
 *       '400':
 *         description: Payload invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidEmail:
 *                 value:
 *                   message: Format d'email invalide
 *               weakPassword:
 *                 value:
 *                   message: Le mot de passe doit contenir au moins 6 caracteres
 *               invalidField:
 *                 value:
 *                   message: Une ou plusieurs donnees ne sont pas autorisees
 *       '401':
 *         description: JWT absent, invalide ou utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Role insuffisant ou attribution de role interdite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               forbidden:
 *                 value:
 *                   message: Vous n'avez pas l'autorisation pour cette action
 *               roleDenied:
 *                 value:
 *                   message: Vous ne pouvez pas attribuer ce role
 *       '409':
 *         description: Email deja utilise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Un utilisateur avec cet email existe deja
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Recuperer mon profil
 *     description: Route protegee par JWT Bearer. Accessible a tout compte actif connecte.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Profil courant retourne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSingleResponse'
 *             example:
 *               message: Profil utilisateur
 *               data:
 *                 id: 6610ff1c8d6f3a001f2c9a55
 *                 nom: Dupont
 *                 prenom: Alice
 *                 email: alice.dupont@recycletrack.com
 *                 role: AGENT
 *                 isActive: true
 *                 createdBy: null
 *                 deletedBy: null
 *                 deletedAt: null
 *                 createdAt: 2026-04-06T09:30:00.000Z
 *                 updatedAt: 2026-04-06T10:00:00.000Z
 *       '401':
 *         description: JWT absent, invalide ou utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Compte desactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags: [Users]
 *     summary: Mettre a jour mon profil
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Tous les champs du payload sont facultatifs.
 *       Un utilisateur AGENT ne peut pas modifier isActive.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *           example:
 *             prenom: Alice
 *             email: alice.dupont@recycletrack.com
 *     responses:
 *       '200':
 *         description: Profil mis a jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSingleResponse'
 *             example:
 *               message: Profil mis a jour avec succes
 *               data:
 *                 id: 6610ff1c8d6f3a001f2c9a55
 *                 nom: Dupont
 *                 prenom: Alice
 *                 email: alice.dupont@recycletrack.com
 *                 role: AGENT
 *                 isActive: true
 *                 createdBy: null
 *                 deletedBy: null
 *                 deletedAt: null
 *                 createdAt: 2026-04-06T09:30:00.000Z
 *                 updatedAt: 2026-04-06T10:00:00.000Z
 *       '400':
 *         description: Payload invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: JWT absent, invalide ou utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Compte desactive ou action interdite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Email deja utilise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Recuperer un utilisateur par id
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Acces:
 *       - SUPER_ADMIN: tous les utilisateurs
 *       - ADMIN: tous sauf SUPER_ADMIN
 *       - AGENT: uniquement son propre compte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB de l'utilisateur cible.
 *         example: 6610ff1c8d6f3a001f2c9a55
 *     responses:
 *       '200':
 *         description: Utilisateur retourne avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSingleResponse'
 *             example:
 *               message: Utilisateur recupere avec succes
 *               data:
 *                 id: 6610ff1c8d6f3a001f2c9a55
 *                 nom: Dupont
 *                 prenom: Alice
 *                 email: alice.dupont@recycletrack.com
 *                 role: AGENT
 *                 isActive: true
 *                 createdBy: null
 *                 deletedBy: null
 *                 deletedAt: null
 *                 createdAt: 2026-04-06T09:30:00.000Z
 *                 updatedAt: 2026-04-06T10:00:00.000Z
 *       '400':
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Identifiant utilisateur invalide
 *       '401':
 *         description: JWT absent, invalide ou utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Droit insuffisant ou compte desactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags: [Users]
 *     summary: Mettre a jour un utilisateur
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Acces:
 *       - SUPER_ADMIN: peut modifier tous les comptes
 *       - ADMIN: peut modifier tous les comptes sauf SUPER_ADMIN
 *       - AGENT: uniquement son propre compte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB de l'utilisateur cible.
 *         example: 6610ff1c8d6f3a001f2c9a55
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *           example:
 *             nom: Amavi
 *             role: ADMIN
 *             isActive: true
 *     responses:
 *       '200':
 *         description: Utilisateur mis a jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSingleResponse'
 *             example:
 *               message: Utilisateur mis a jour avec succes
 *               data:
 *                 id: 6610ff1c8d6f3a001f2c9a55
 *                 nom: Amavi
 *                 prenom: Alice
 *                 email: alice.dupont@recycletrack.com
 *                 role: ADMIN
 *                 isActive: true
 *                 createdBy: null
 *                 deletedBy: null
 *                 deletedAt: null
 *                 createdAt: 2026-04-06T09:30:00.000Z
 *                 updatedAt: 2026-04-06T10:20:00.000Z
 *       '400':
 *         description: Payload invalide ou tentative de desactiver le dernier SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidId:
 *                 value:
 *                   message: Identifiant utilisateur invalide
 *               lastSuperAdmin:
 *                 value:
 *                   message: Impossible de desactiver le dernier SUPER_ADMIN
 *       '401':
 *         description: JWT absent, invalide ou utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Droit insuffisant ou action interdite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               ownOnly:
 *                 value:
 *                   message: Vous ne pouvez modifier que votre propre compte
 *               forbidden:
 *                 value:
 *                   message: Vous n'avez pas l'autorisation de modifier cet utilisateur
 *               roleDenied:
 *                 value:
 *                   message: Vous ne pouvez pas attribuer ce role
 *               noStatusChange:
 *                 value:
 *                   message: Vous ne pouvez pas changer le statut du compte
 *       '404':
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Email deja utilise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Users]
 *     summary: Desactiver un utilisateur
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Roles autorises: ADMIN, SUPER_ADMIN.
 *       Cette operation effectue une suppression logique: le compte passe a isActive = false, mais les donnees d'activite liees a cet utilisateur restent conservees.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB de l'utilisateur a desactiver.
 *         example: 6610ff1c8d6f3a001f2c9a55
 *     responses:
 *       '200':
 *         description: Utilisateur desactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDeleteResponse'
 *       '400':
 *         description: Identifiant invalide ou dernier SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: JWT absent, invalide ou utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Role insuffisant ou refus de suppression
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
