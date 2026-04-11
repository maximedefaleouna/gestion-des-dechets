/**
 * @swagger
 * components:
 *   schemas:
 *     DechetCategory:
 *       type: string
 *       enum: [Recyclable, Non recyclable]
 *       example: Recyclable
 *     DechetUnit:
 *       type: string
 *       enum: [kg, tonne, litre, unite]
 *       example: kg
 *     DechetResponse:
 *       type: object
 *       required: [_id, nom, categorie, uniteMesure, dangereux, createdAt, isDeleted]
 *       properties:
 *         _id:
 *           type: string
 *           example: 6610ff1c8d6f3a001f2c9b01
 *         nom:
 *           type: string
 *           example: Plastique PET
 *         categorie:
 *           $ref: '#/components/schemas/DechetCategory'
 *         description:
 *           type: string
 *           nullable: true
 *           example: Bouteilles et emballages PET destines au recyclage.
 *         uniteMesure:
 *           $ref: '#/components/schemas/DechetUnit'
 *         dangereux:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-08T09:30:00.000Z
 *         createdBy:
 *           type: string
 *           nullable: true
 *           description: Identifiant MongoDB de l'utilisateur createur si renseigne.
 *           example: 6610ff1c8d6f3a001f2c9a55
 *         isDeleted:
 *           type: boolean
 *           description: Indique si le dechet a ete supprime logiquement.
 *           example: false
 *     CreateDechetRequest:
 *       type: object
 *       required: [nom, categorie]
 *       properties:
 *         nom:
 *           type: string
 *           description: Nom unique du dechet.
 *           example: Plastique PET
 *         categorie:
 *           $ref: '#/components/schemas/DechetCategory'
 *         description:
 *           type: string
 *           description: Description libre du dechet.
 *           example: Bouteilles et emballages PET destines au recyclage.
 *         uniteMesure:
 *           allOf:
 *             - $ref: '#/components/schemas/DechetUnit'
 *           description: "Facultatif. Valeur par defaut appliquee par l'API si absent: kg."
 *         dangereux:
 *           type: boolean
 *           description: "Facultatif. Valeur par defaut appliquee par l'API si absent: false."
 *           example: false
 *     UpdateDechetRequest:
 *       type: object
 *       description: Tous les champs sont facultatifs mais au moins un champ doit etre fourni.
 *       properties:
 *         nom:
 *           type: string
 *           example: Plastique PET compact
 *         categorie:
 *           $ref: '#/components/schemas/DechetCategory'
 *         description:
 *           type: string
 *           example: Flux de plastique PET trie et compact.
 *         uniteMesure:
 *           $ref: '#/components/schemas/DechetUnit'
 *         dangereux:
 *           type: boolean
 *           example: false
 *     DechetSingleResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/DechetResponse'
 *     DechetListResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *           example: Liste des dechets
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DechetResponse'
 *
 * /api/v1/dechets:
 *   get:
 *     tags: [Dechets]
 *     summary: Lister les dechets
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Accessible a tout utilisateur authentifie.
 *       L'implementation actuelle retourne tous les dechets, y compris ceux deja supprimes logiquement (`isDeleted = true`).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Liste des dechets retournee avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DechetListResponse'
 *             example:
 *               message: Liste des dechets
 *               data:
 *                 - _id: 6610ff1c8d6f3a001f2c9b01
 *                   nom: Plastique PET
 *                   categorie: Recyclable
 *                   description: Bouteilles et emballages PET destines au recyclage.
 *                   uniteMesure: kg
 *                   dangereux: false
 *                   createdAt: 2026-04-08T09:30:00.000Z
 *                   createdBy: 6610ff1c8d6f3a001f2c9a55
 *                   isDeleted: false
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
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Dechets]
 *     summary: Creer un dechet
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Roles autorises: ADMIN, SUPER_ADMIN.
 *       Le nom doit rester unique.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDechetRequest'
 *           example:
 *             nom: Plastique PET
 *             categorie: Recyclable
 *             description: Bouteilles et emballages PET destines au recyclage.
 *             uniteMesure: kg
 *             dangereux: false
 *     responses:
 *       '201':
 *         description: Dechet cree avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DechetSingleResponse'
 *             example:
 *               message: Dechet cree avec succes
 *               data:
 *                 _id: 6610ff1c8d6f3a001f2c9b01
 *                 nom: Plastique PET
 *                 categorie: Recyclable
 *                 description: Bouteilles et emballages PET destines au recyclage.
 *                 uniteMesure: kg
 *                 dangereux: false
 *                 createdAt: 2026-04-08T09:30:00.000Z
 *                 createdBy: 6610ff1c8d6f3a001f2c9a55
 *                 isDeleted: false
 *       '400':
 *         description: Payload invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingName:
 *                 value:
 *                   message: Le nom du dechet est obligatoire
 *               invalidCategory:
 *                 value:
 *                   message: La categorie du dechet est invalide
 *               invalidUnit:
 *                 value:
 *                   message: L'unite de mesure du dechet est invalide
 *       '401':
 *         description: JWT absent, invalide ou utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Role insuffisant ou compte desactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Nom de dechet deja utilise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Un dechet avec ce nom existe deja
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/dechets/{id}:
 *   get:
 *     tags: [Dechets]
 *     summary: Recuperer un dechet par id
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Accessible a tout utilisateur authentifie.
 *       Un dechet supprime logiquement retourne une erreur 404.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB du dechet.
 *         example: 6610ff1c8d6f3a001f2c9b01
 *     responses:
 *       '200':
 *         description: Dechet retourne avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DechetSingleResponse'
 *             example:
 *               message: Dechet recupere avec succes
 *               data:
 *                 _id: 6610ff1c8d6f3a001f2c9b01
 *                 nom: Plastique PET
 *                 categorie: Recyclable
 *                 description: Bouteilles et emballages PET destines au recyclage.
 *                 uniteMesure: kg
 *                 dangereux: false
 *                 createdAt: 2026-04-08T09:30:00.000Z
 *                 createdBy: 6610ff1c8d6f3a001f2c9a55
 *                 isDeleted: false
 *       '400':
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Identifiant dechet invalide
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
 *         description: Dechet introuvable ou deja supprime logiquement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Dechet non trouve
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [Dechets]
 *     summary: Mettre a jour un dechet
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Roles autorises: ADMIN, SUPER_ADMIN.
 *       Tous les champs sont facultatifs mais au moins un champ doit etre fourni.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB du dechet a modifier.
 *         example: 6610ff1c8d6f3a001f2c9b01
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDechetRequest'
 *           example:
 *             description: Flux de plastique PET trie et compact.
 *             uniteMesure: tonne
 *     responses:
 *       '200':
 *         description: Dechet mis a jour avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DechetSingleResponse'
 *             example:
 *               message: Dechet mis a jour avec succes
 *               data:
 *                 _id: 6610ff1c8d6f3a001f2c9b01
 *                 nom: Plastique PET compact
 *                 categorie: Recyclable
 *                 description: Flux de plastique PET trie et compact.
 *                 uniteMesure: tonne
 *                 dangereux: false
 *                 createdAt: 2026-04-08T09:30:00.000Z
 *                 createdBy: 6610ff1c8d6f3a001f2c9a55
 *                 isDeleted: false
 *       '400':
 *         description: Identifiant ou payload invalide
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
 *         description: Role insuffisant ou compte desactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Dechet introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Dechet non trouve
 *       '409':
 *         description: Nom de dechet deja utilise
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
 *     tags: [Dechets]
 *     summary: Supprimer logiquement un dechet
 *     description: |
 *       Route protegee par JWT Bearer.
 *       Roles autorises: ADMIN, SUPER_ADMIN.
 *       L'operation positionne `isDeleted` a `true`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB du dechet a supprimer logiquement.
 *         example: 6610ff1c8d6f3a001f2c9b01
 *     responses:
 *       '200':
 *         description: Dechet supprime logiquement avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DechetSingleResponse'
 *             example:
 *               message: Dechet supprime avec succes
 *               data:
 *                 _id: 6610ff1c8d6f3a001f2c9b01
 *                 nom: Plastique PET
 *                 categorie: Recyclable
 *                 description: Bouteilles et emballages PET destines au recyclage.
 *                 uniteMesure: kg
 *                 dangereux: false
 *                 createdAt: 2026-04-08T09:30:00.000Z
 *                 createdBy: 6610ff1c8d6f3a001f2c9a55
 *                 isDeleted: true
 *       '400':
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Identifiant dechet invalide
 *       '401':
 *         description: JWT absent, invalide ou utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Role insuffisant ou compte desactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Dechet introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Dechet non trouve
 *       '500':
 *         description: Erreur interne
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
