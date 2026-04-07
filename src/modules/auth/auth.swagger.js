/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *           description: Message exact retourne par l'API.
 *           example: Identifiants invalides
 *     UserRole:
 *       type: string
 *       enum: [AGENT, ADMIN, SUPER_ADMIN]
 *       example: ADMIN
 *     UserReference:
 *       type: object
 *       nullable: true
 *       required: [id]
 *       properties:
 *         id:
 *           type: string
 *           example: 6610ff1c8d6f3a001f2c9a11
 *         nom:
 *           type: string
 *           example: Doe
 *         prenom:
 *           type: string
 *           example: Jane
 *         email:
 *           type: string
 *           format: email
 *           example: jane.doe@recycletrack.com
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *     AuthenticatedUser:
 *       type: object
 *       required: [id, nom, prenom, email, role, isActive, createdBy, createdAt, updatedAt]
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
 *           example: true
 *         createdBy:
 *           allOf:
 *             - $ref: '#/components/schemas/UserReference'
 *           description: Null pour le premier SUPER_ADMIN cree automatiquement.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-06T09:30:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-06T10:00:00.000Z
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@recycletrack.com
 *         password:
 *           type: string
 *           format: password
 *           example: Admin123!
 *     RefreshTokenRequest:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token JWT retourne par l'API.
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token
 *     AuthPayload:
 *       type: object
 *       required: [user, accessToken, refreshToken]
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/AuthenticatedUser'
 *         accessToken:
 *           type: string
 *           description: JWT a envoyer dans Authorization Bearer.
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token
 *         refreshToken:
 *           type: string
 *           description: JWT de renouvellement a stocker cote client.
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token
 *     LoginSuccessResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *           example: Connexion reussie
 *         data:
 *           $ref: '#/components/schemas/AuthPayload'
 *     RefreshTokenSuccessResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *           example: Token rafraichi
 *         data:
 *           $ref: '#/components/schemas/AuthPayload'
 *     LogoutSuccessResponse:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *           example: Deconnexion reussie
 *
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connecter un utilisateur
 *     description: |
 *       Route publique.
 *       Verifie l'email, le mot de passe et l'etat actif du compte.
 *       Retourne un access token JWT et un refresh token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: admin@recycletrack.com
 *             password: Admin123!
 *     responses:
 *       '200':
 *         description: Connexion reussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginSuccessResponse'
 *       '400':
 *         description: Email ou mot de passe absent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Email et mot de passe sont obligatoires
 *       '401':
 *         description: Email ou mot de passe invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Identifiants invalides
 *       '403':
 *         description: Compte desactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Ce compte est desactive
 *       '500':
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Renouveler les tokens JWT
 *     description: |
 *       Route publique.
 *       Le refresh token doit etre fourni dans le body JSON.
 *       Aucun access token n'est requis.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *           example:
 *             refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token
 *     responses:
 *       '200':
 *         description: Session renouvelee
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenSuccessResponse'
 *       '400':
 *         description: Refresh token absent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Le refresh token est obligatoire
 *       '401':
 *         description: Refresh token invalide, expire ou session inconnue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidRefresh:
 *                 value:
 *                   message: Refresh token invalide ou expire
 *               invalidSession:
 *                 value:
 *                   message: Session invalide
 *       '403':
 *         description: Compte desactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Ce compte est desactive
 *       '500':
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Deconnecter un utilisateur
 *     description: |
 *       Route publique actuellement.
 *       La deconnexion repose sur le refresh token envoye dans le body JSON.
 *       Aucun access token n'est requis par l'implementation actuelle.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *           example:
 *             refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token
 *     responses:
 *       '200':
 *         description: Deconnexion reussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutSuccessResponse'
 *       '400':
 *         description: Refresh token absent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Le refresh token est obligatoire
 *       '401':
 *         description: Refresh token invalide, expire ou session inconnue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidRefresh:
 *                 value:
 *                   message: Refresh token invalide ou expire
 *               invalidSession:
 *                 value:
 *                   message: Session invalide
 *       '403':
 *         description: Compte desactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Ce compte est desactive
 *       '500':
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
