/**
 * @swagger
 * components:
 *   schemas:
 *     CollecteResponse:
 *       type: object
 *       required: [id, station, dechet, agent, quantite, dateCollecte, statut, createdAt]
 *       properties:
 *         id:
 *           type: string
 *           example: 6610ff1c8d6f3a001f2c9a77
 *         station:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nom:
 *               type: string
 *             adresse:
 *               type: string
 *             ville:
 *               type: string
 *         dechet:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nom:
 *               type: string
 *             categorie:
 *               type: string
 *             uniteMesure:
 *               type: string
 *         agent:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nom:
 *               type: string
 *             prenom:
 *               type: string
 *             email:
 *               type: string
 *         quantite:
 *           type: number
 *           example: 150.5
 *         dateCollecte:
 *           type: string
 *           format: date-time
 *           example: 2026-04-06T10:00:00.000Z
 *         statut:
 *           type: string
 *           enum: [EN_ATTENTE, VALIDEE, ANNULEE]
 *           example: VALIDEE
 *         commentaire:
 *           type: string
 *           nullable: true
 *           example: Collecte régulière du lundi
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateCollecteRequest:
 *       type: object
 *       required: [station, dechet, quantite]
 *       properties:
 *         station:
 *           type: string
 *           description: ID de la station
 *           example: 6610ff1c8d6f3a001f2c9a11
 *         dechet:
 *           type: string
 *           description: ID du type de déchet
 *           example: 6610ff1c8d6f3a001f2c9a22
 *         quantite:
 *           type: number
 *           description: Quantité collectée
 *           example: 150.5
 *         dateCollecte:
 *           type: string
 *           format: date-time
 *           description: Date de collecte (par défaut maintenant)
 *         statut:
 *           type: string
 *           enum: [EN_ATTENTE, VALIDEE, ANNULEE]
 *           default: VALIDEE
 *         commentaire:
 *           type: string
 *           description: Commentaire optionnel
 *     UpdateCollecteRequest:
 *       type: object
 *       description: Tous les champs sont facultatifs
 *       properties:
 *         quantite:
 *           type: number
 *         dateCollecte:
 *           type: string
 *           format: date-time
 *         statut:
 *           type: string
 *           enum: [EN_ATTENTE, VALIDEE, ANNULEE]
 *         commentaire:
 *           type: string
 *     CollecteListResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CollecteResponse'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 *     CollecteStatsResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             station:
 *               type: object
 *             periode:
 *               type: object
 *             resume:
 *               type: object
 *             detailsParDechet:
 *               type: array
 *
 * /api/v1/collectes:
 *   get:
 *     tags: [Collectes]
 *     summary: Lister les collectes
 *     description: |
 *       Route protégée par JWT Bearer.
 *       - AGENT: voit uniquement ses propres collectes
 *       - ADMIN/SUPER_ADMIN: voit toutes les collectes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: stationId
 *         schema:
 *           type: string
 *         description: Filtrer par station
 *       - in: query
 *         name: dechetId
 *         schema:
 *           type: string
 *         description: Filtrer par type de déchet
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [EN_ATTENTE, VALIDEE, ANNULEE]
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       '200':
 *         description: Liste des collectes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollecteListResponse'
 *       '401':
 *         description: Non authentifié
 *       '403':
 *         description: Accès refusé
 *
 *   post:
 *     tags: [Collectes]
 *     summary: Créer une nouvelle collecte
 *     description: Route protégée - accessible à tous les utilisateurs connectés
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCollecteRequest'
 *           example:
 *             station: 6610ff1c8d6f3a001f2c9a11
 *             dechet: 6610ff1c8d6f3a001f2c9a22
 *             quantite: 150.5
 *             commentaire: Collecte régulière
 *     responses:
 *       '201':
 *         description: Collecte créée avec succès
 *       '400':
 *         description: Données invalides ou capacité insuffisante
 *       '401':
 *         description: Non authentifié
 *       '404':
 *         description: Station ou déchet non trouvé
 *
 * /api/v1/collectes/{id}:
 *   get:
 *     tags: [Collectes]
 *     summary: Récupérer une collecte par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Collecte trouvée
 *       '404':
 *         description: Collecte non trouvée
 *
 *   patch:
 *     tags: [Collectes]
 *     summary: Mettre à jour une collecte
 *     description: |
 *       Route protégée.
 *       - AGENT: peut modifier ses propres collectes non validées
 *       - ADMIN/SUPER_ADMIN: peut modifier toutes les collectes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCollecteRequest'
 *     responses:
 *       '200':
 *         description: Collecte mise à jour
 *       '403':
 *         description: Non autorisé
 *       '404':
 *         description: Collecte non trouvée
 *
 *   delete:
 *     tags: [Collectes]
 *     summary: Supprimer une collecte
 *     description: |
 *       Route protégée.
 *       Supprime la collecte et restaure la capacité de la station.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Collecte supprimée
 *       '403':
 *         description: Non autorisé
 *       '404':
 *         description: Collecte non trouvée
 *
 * /api/v1/collectes/stats/global:
 *   get:
 *     tags: [Collectes]
 *     summary: Statistiques globales
 *     description: Route réservée aux ADMIN et SUPER_ADMIN
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       '200':
 *         description: Statistiques globales
 *       '403':
 *         description: Accès refusé (réservé aux administrateurs)
 *
 * /api/v1/collectes/stats/station/{stationId}:
 *   get:
 *     tags: [Collectes]
 *     summary: Statistiques par station
 *     description: Route réservée aux ADMIN et SUPER_ADMIN
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       '200':
 *         description: Statistiques de la station
 *       '403':
 *         description: Accès refusé
 *       '404':
 *         description: Station non trouvée
 */

module.exports = {};