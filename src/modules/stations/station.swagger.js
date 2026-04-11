/**
 * @swagger
 * components:
 *   schemas:
 *     StationStatus:
 *       type: string
 *       enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *       example: ACTIVE
 *     StationLocalisation:
 *       type: object
 *       required: [latitude, longitude]
 *       properties:
 *         latitude:
 *           type: number
 *           format: float
 *           minimum: -90
 *           maximum: 90
 *           example: 6.1319
 *         longitude:
 *           type: number
 *           format: float
 *           minimum: -180
 *           maximum: 180
 *           example: 1.2228
 *     StationDocument:
 *       type: object
 *       required:
 *         - _id
 *         - nom
 *         - adresse
 *         - ville
 *         - capaciteMax
 *         - capaciteActuelle
 *         - typesDechetsAcceptes
 *         - localisation
 *         - statut
 *         - createdAt
 *         - updatedAt
 *         - isDeleted
 *       properties:
 *         _id:
 *           type: string
 *           example: 6610ff1c8d6f3a001f2c9c01
 *         nom:
 *           type: string
 *           example: Station Centrale RecycleTrack
 *         adresse:
 *           type: string
 *           example: Boulevard du Mono
 *         ville:
 *           type: string
 *           example: Lome
 *         capaciteMax:
 *           type: integer
 *           example: 500
 *         capaciteActuelle:
 *           type: integer
 *           example: 120
 *         typesDechetsAcceptes:
 *           type: array
 *           items:
 *             type: string
 *             example: 6610ff1c8d6f3a001f2c9d10
 *         localisation:
 *           $ref: '#/components/schemas/StationLocalisation'
 *         statut:
 *           $ref: '#/components/schemas/StationStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-11T08:30:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-11T08:30:00.000Z
 *         createdBy:
 *           type: string
 *           nullable: true
 *           example: 6610ff1c8d6f3a001f2c9a11
 *         updatedBy:
 *           type: string
 *           nullable: true
 *           example: 6610ff1c8d6f3a001f2c9a11
 *         isDeleted:
 *           type: boolean
 *           example: false
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         deletedBy:
 *           type: string
 *           nullable: true
 *           example: null
 *     CreateStationRequest:
 *       type: object
 *       required:
 *         - nom
 *         - adresse
 *         - ville
 *         - capaciteMax
 *         - typesDechetsAcceptes
 *         - localisation
 *       properties:
 *         nom:
 *           type: string
 *           example: Station Centrale RecycleTrack
 *         adresse:
 *           type: string
 *           example: Boulevard du Mono
 *         ville:
 *           type: string
 *           example: Lome
 *         capaciteMax:
 *           type: integer
 *           example: 500
 *         typesDechetsAcceptes:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             description: Identifiant MongoDB d'un dechet accepte.
 *             example: 6610ff1c8d6f3a001f2c9d10
 *         localisation:
 *           $ref: '#/components/schemas/StationLocalisation'
 *     UpdateStationRequest:
 *       type: object
 *       description: Tous les champs sont facultatifs mais au moins un champ doit etre fourni.
 *       properties:
 *         nom:
 *           type: string
 *           example: Station Centrale RecycleTrack
 *         adresse:
 *           type: string
 *           example: Boulevard du Mono
 *         ville:
 *           type: string
 *           example: Lome
 *         capaciteMax:
 *           type: integer
 *           example: 600
 *         capaciteActuelle:
 *           type: integer
 *           example: 140
 *         typesDechetsAcceptes:
 *           type: array
 *           items:
 *             type: string
 *             description: Identifiant MongoDB d'un dechet accepte.
 *         localisation:
 *           $ref: '#/components/schemas/StationLocalisation'
 *         statut:
 *           $ref: '#/components/schemas/StationStatus'
 *     StationSingleResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/StationDocument'
 *     StationListResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *           example: Liste des stations
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StationDocument'
 *     StationDeleteResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *           example: Station supprimee avec succes
 *         data:
 *           type: object
 *           properties:
 *             acknowledged:
 *               type: boolean
 *               example: true
 *             matchedCount:
 *               type: integer
 *               example: 1
 *             modifiedCount:
 *               type: integer
 *               example: 1
 *
 * /api/v1/stations:
 *   get:
 *     tags: [Stations]
 *     summary: Lister les stations
 *     description: "Route protegee par JWT Bearer. Accessible a tout utilisateur authentifie."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Liste des stations retournee avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StationListResponse'
 *       '401':
 *         description: JWT absent, invalide ou expire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Stations]
 *     summary: Creer une station
 *     description: "Route protegee par JWT Bearer. Roles autorises: ADMIN, SUPER_ADMIN."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStationRequest'
 *           example:
 *             nom: Station Centrale RecycleTrack
 *             adresse: Boulevard du Mono
 *             ville: Lome
 *             capaciteMax: 500
 *             typesDechetsAcceptes:
 *               - 6610ff1c8d6f3a001f2c9d10
 *             localisation:
 *               latitude: 6.1319
 *               longitude: 1.2228
 *     responses:
 *       '201':
 *         description: Station creee avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StationSingleResponse'
 *       '400':
 *         description: Payload invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: JWT absent, invalide ou expire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Role insuffisant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/stations/{id}:
 *   get:
 *     tags: [Stations]
 *     summary: Recuperer une station par id
 *     description: "Route protegee par JWT Bearer. Accessible a tout utilisateur authentifie."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB de la station.
 *         example: 6610ff1c8d6f3a001f2c9c01
 *     responses:
 *       '200':
 *         description: Station retournee avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StationSingleResponse'
 *       '400':
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Identifiant station invalide
 *       '401':
 *         description: JWT absent, invalide ou expire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Station introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Station non trouvee
 *       '500':
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [Stations]
 *     summary: Mettre a jour une station
 *     description: "Route protegee par JWT Bearer. Roles autorises: ADMIN, SUPER_ADMIN."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB de la station.
 *         example: 6610ff1c8d6f3a001f2c9c01
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStationRequest'
 *           example:
 *             ville: Lome
 *             capaciteMax: 600
 *             statut: MAINTENANCE
 *     responses:
 *       '200':
 *         description: Station mise a jour avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StationSingleResponse'
 *       '400':
 *         description: Payload invalide ou identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: JWT absent, invalide ou expire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Role insuffisant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Station introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Stations]
 *     summary: Supprimer logiquement une station
 *     description: "Route protegee par JWT Bearer. Roles autorises: ADMIN, SUPER_ADMIN."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB de la station.
 *         example: 6610ff1c8d6f3a001f2c9c01
 *     responses:
 *       '200':
 *         description: Station supprimee logiquement avec succes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StationDeleteResponse'
 *       '400':
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: JWT absent, invalide ou expire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Role insuffisant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Station introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
