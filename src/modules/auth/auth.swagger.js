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
 *     ChangePasswordRequest:
 *       type: object
 *       required: [currentPassword, newPassword, confirmNewPassword]
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           example: Ancien123!
 *         newPassword:
 *           type: string
 *           format: password
 *           example: Nouveau123!
 *         confirmNewPassword:
 *           type: string
 *           format: password
 *           example: Nouveau123!
 *     SimpleMessageResponse:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *     ForgotPasswordRequestRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: agent@recycletrack.local
 *     ForgotPasswordRequestResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *           example: Si un compte existe avec cet email, un code de verification a ete genere
 *         data:
 *           type: object
 *           required: [email, expiresAt]
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             expiresAt:
 *               type: string
 *               format: date-time
 *             verificationCode:
 *               type: string
 *               nullable: true
 *               description: Present uniquement hors production pour faciliter les tests locaux.
 *               example: 483921
 *     ForgotPasswordVerifyRequest:
 *       type: object
 *       required: [email, code]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: agent@recycletrack.local
 *         code:
 *           type: string
 *           example: "483921"
 *     ForgotPasswordVerifyResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *           example: Code de verification valide
 *         data:
 *           type: object
 *           required: [email, resetToken, expiresAt]
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             resetToken:
 *               type: string
 *               description: Jeton temporaire a transmettre a la derniere etape.
 *             expiresAt:
 *               type: string
 *               format: date-time
 *     ForgotPasswordResetRequest:
 *       type: object
 *       required: [email, resetToken, newPassword, confirmNewPassword]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: agent@recycletrack.local
 *         resetToken:
 *           type: string
 *           example: 9a2c4d...f0b1
 *         newPassword:
 *           type: string
 *           format: password
 *           example: Nouveau123!
 *         confirmNewPassword:
 *           type: string
 *           format: password
 *           example: Nouveau123!
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
 *
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Changer le mot de passe du compte connecte
 *     description: Route protegee par JWT Bearer. L'utilisateur doit fournir son ancien mot de passe, le nouveau et sa confirmation.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       '200':
 *         description: Mot de passe modifie avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleMessageResponse'
 *             example:
 *               message: Mot de passe modifie avec succes
 *       '400':
 *         description: Donnees invalides ou ancien mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Token JWT absent, invalide ou expire
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
 *
 * /api/v1/auth/forgot-password/request:
 *   post:
 *     tags: [Auth]
 *     summary: Demander un code de reinitialisation
 *     description: |
 *       Route publique.
 *       L'API genere un code de verification a 6 chiffres pour l'email fourni.
 *       En environnement de developpement, le code peut aussi etre renvoye dans la reponse pour simplifier les tests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequestRequest'
 *     responses:
 *       '200':
 *         description: Code genere
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForgotPasswordRequestResponse'
 *       '400':
 *         description: Email absent ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/auth/forgot-password/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verifier le code de reinitialisation
 *     description: Route publique. Le code doit contenir 6 chiffres.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordVerifyRequest'
 *     responses:
 *       '200':
 *         description: Code valide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForgotPasswordVerifyResponse'
 *       '400':
 *         description: Code invalide, expire ou donnees manquantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/auth/forgot-password/reset:
 *   post:
 *     tags: [Auth]
 *     summary: Reinitialiser le mot de passe
 *     description: Route publique. Utilise le resetToken retourne par l'etape de verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordResetRequest'
 *     responses:
 *       '200':
 *         description: Mot de passe reinitialise avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleMessageResponse'
 *             example:
 *               message: Mot de passe reinitialise avec succes
 *       '400':
 *         description: Donnees invalides ou session de reinitialisation expiree
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
