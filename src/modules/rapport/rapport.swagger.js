/**
 * @swagger
 * components:
 *   schemas:
 *     RapportPeriod:
 *       type: object
 *       required: [dateDebut, dateFin]
 *       properties:
 *         dateDebut:
 *           type: string
 *           format: date-time
 *           example: 2026-01-01T00:00:00.000Z
 *         dateFin:
 *           type: string
 *           format: date-time
 *           example: 2026-03-31T23:59:59.999Z
 *
 *     RapportResume:
 *       type: object
 *       properties:
 *         totalRecycleKg:
 *           type: number
 *           example: 3940
 *         totalRecycleTonne:
 *           type: number
 *           example: 3.9
 *         moyenneParCollecteKg:
 *           type: number
 *           example: 484
 *         tauxRecyclage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 78
 *         meilleureStation:
 *           type: object
 *           nullable: true
 *           properties:
 *             stationId:
 *               type: string
 *               nullable: true
 *             nom:
 *               type: string
 *             ville:
 *               type: string
 *             quantiteKg:
 *               type: number
 *         totalCollectes:
 *           type: integer
 *           example: 21
 *         stationsActives:
 *           type: integer
 *           example: 4
 *
 *     RapportEvolutionMensuelleItem:
 *       type: object
 *       required: [mois, annee, quantiteKg]
 *       properties:
 *         mois:
 *           type: string
 *           example: Mar
 *         annee:
 *           type: integer
 *           example: 2026
 *         quantiteKg:
 *           type: number
 *           example: 3600
 *
 *     RapportStationStat:
 *       type: object
 *       required: [stationId, nom, ville, quantiteKg, nombreCollectes]
 *       properties:
 *         stationId:
 *           type: string
 *           nullable: true
 *           example: 6610ff1c8d6f3a001f2c9c01
 *         nom:
 *           type: string
 *           example: Centre-Ville
 *         ville:
 *           type: string
 *           example: Lome
 *         quantiteKg:
 *           type: number
 *           example: 1500
 *         nombreCollectes:
 *           type: integer
 *           example: 7
 *
 *     RapportDechetStat:
 *       type: object
 *       required: [dechetId, nom, categorie, quantiteKg, nombreCollectes]
 *       properties:
 *         dechetId:
 *           type: string
 *           nullable: true
 *           example: 6610ff1c8d6f3a001f2c9d10
 *         nom:
 *           type: string
 *           example: Plastique PET
 *         categorie:
 *           type: string
 *           example: Recyclable
 *         quantiteKg:
 *           type: number
 *           example: 1110
 *         nombreCollectes:
 *           type: integer
 *           example: 5
 *
 *     RapportStatistiquesData:
 *       type: object
 *       required: [periode, resume, evolutionMensuelle, collecteParStation, repartitionParType]
 *       properties:
 *         periode:
 *           $ref: '#/components/schemas/RapportPeriod'
 *         resume:
 *           $ref: '#/components/schemas/RapportResume'
 *         evolutionMensuelle:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RapportEvolutionMensuelleItem'
 *         collecteParStation:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RapportStationStat'
 *         repartitionParType:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RapportDechetStat'
 *
 *     RapportStatistiquesResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *           example: Statistiques du rapport recuperees avec succes
 *         data:
 *           $ref: '#/components/schemas/RapportStatistiquesData'
 *
 *     DashboardKpiStat:
 *       type: object
 *       properties:
 *         stationsActives:
 *           type: object
 *           properties:
 *             valeur:
 *               type: integer
 *               example: 4
 *             total:
 *               type: integer
 *               example: 6
 *             pourcentage:
 *               type: integer
 *               example: 67
 *         totalCollecte:
 *           type: object
 *           properties:
 *             valeurKg:
 *               type: number
 *               example: 3900
 *             valeurTonne:
 *               type: number
 *               example: 3.9
 *             libelle:
 *               type: string
 *               example: Ce mois
 *             variationPourcent:
 *               type: integer
 *               example: 8
 *         collectes:
 *           type: object
 *           properties:
 *             valeur:
 *               type: integer
 *               example: 8
 *             libelle:
 *               type: string
 *               example: Cette semaine
 *             variationPourcent:
 *               type: integer
 *               example: 5
 *         agentsActifs:
 *           type: object
 *           properties:
 *             valeur:
 *               type: integer
 *               example: 3
 *             total:
 *               type: integer
 *               example: 4
 *             pourcentage:
 *               type: integer
 *               example: 75
 *
 *     DashboardSeriesItem:
 *       type: object
 *       required: [nom, couleur, data]
 *       properties:
 *         dechetId:
 *           type: string
 *           nullable: true
 *         nom:
 *           type: string
 *           example: Plastique
 *         categorie:
 *           type: string
 *           nullable: true
 *           example: Recyclable
 *         couleur:
 *           type: string
 *           example: '#3498db'
 *         data:
 *           type: array
 *           items:
 *             type: number
 *           example: [1200, 1350, 1100, 1400, 1500, 1600]
 *
 *     DashboardRepartitionItem:
 *       type: object
 *       required: [nom, quantiteKg, pourcentage, couleur]
 *       properties:
 *         dechetId:
 *           type: string
 *           nullable: true
 *         nom:
 *           type: string
 *           example: Verre
 *         categorie:
 *           type: string
 *           example: Recyclable
 *         quantiteKg:
 *           type: number
 *           example: 1110
 *         pourcentage:
 *           type: number
 *           example: 28
 *         couleur:
 *           type: string
 *           example: '#27ae60'
 *
 *     DashboardRecentCollecteItem:
 *       type: object
 *       required: [id, quantiteKg, dateCollecte, statut]
 *       properties:
 *         id:
 *           type: string
 *           example: 6610ff1c8d6f3a001f2c9a99
 *         station:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             nom:
 *               type: string
 *             ville:
 *               type: string
 *         agent:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             nom:
 *               type: string
 *             prenom:
 *               type: string
 *         dechet:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             nom:
 *               type: string
 *             categorie:
 *               type: string
 *         quantiteKg:
 *           type: number
 *           example: 450
 *         dateCollecte:
 *           type: string
 *           format: date-time
 *           example: 2026-03-28T10:00:00.000Z
 *         statut:
 *           type: string
 *           example: VALIDEE
 *
 *     DashboardData:
 *       type: object
 *       required:
 *         - periode
 *         - cartes
 *         - collectesMensuelles
 *         - repartitionParType
 *         - collectesRecentes
 *       properties:
 *         periode:
 *           $ref: '#/components/schemas/RapportPeriod'
 *         cartes:
 *           $ref: '#/components/schemas/DashboardKpiStat'
 *         collectesMensuelles:
 *           type: object
 *           properties:
 *             labels:
 *               type: array
 *               items:
 *                 type: string
 *               example: [Oct, Nov, Dec, Jan, Fev, Mar]
 *             series:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DashboardSeriesItem'
 *         repartitionParType:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardRepartitionItem'
 *         collectesRecentes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardRecentCollecteItem'
 *
 *     DashboardResponse:
 *       type: object
 *       required: [message, data]
 *       properties:
 *         message:
 *           type: string
 *           example: Tableau de bord recupere avec succes
 *         data:
 *           $ref: '#/components/schemas/DashboardData'
 *
 * /api/v1/rapports/statistiques:
 *   get:
 *     tags: [Rapports]
 *     summary: Recuperer les statistiques du rapport
 *     description: Renvoie les donnees consolidees pour la page de rapports et statistiques.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateDebut
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateFin
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       '200':
 *         description: Statistiques du rapport retournees avec succes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RapportStatistiquesResponse'
 *       '400':
 *         description: Parametre de date invalide ou periode incoherente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Token JWT absent, invalide ou expire.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Acces refuse.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne du serveur.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/rapports/dashboard:
 *   get:
 *     tags: [Rapports]
 *     summary: Recuperer les donnees du dashboard
 *     description: |
 *       Renvoie les cartes de synthese, la courbe mensuelle, la repartition par type et les collectes recentes.
 *       Les cartes suivent les périodes métier du tableau de bord:
 *       - stations actives: global
 *       - total collecte: mois en cours
 *       - collectes: semaine en cours
 *       - agents actifs: global
 *       Sans parametre `dateDebut/dateFin`, la courbe utilise les 6 derniers mois glissants avec le mois en cours inclus.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateDebut
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Debut de la periode utilisee pour les graphiques.
 *       - in: query
 *         name: dateFin
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fin de la periode utilisee pour les graphiques.
 *     responses:
 *       '200':
 *         description: Tableau de bord retourne avec succes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       '400':
 *         description: Parametre de date invalide ou periode incoherente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Token JWT absent, invalide ou expire.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Acces refuse.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Erreur interne du serveur.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
