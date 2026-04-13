const User = require("../../modules/users/user.model");
const Station = require("../../modules/stations/station.model");
const Dechet = require("../../modules/dechets/dechet.model");
const Collecte = require("../../modules/collectes/collecte.model");
const rapportService = require("../../modules/rapport/rapport.service");
const logger = require("../utils/logger");

const seedUsersConfig = {
  superAdmin: {
    nom: "Super",
    prenom: "Admin",
    email: "superadmin@recycletrack.local",
    password: "SuperAdmin123!",
    role: "SUPER_ADMIN",
  },
  admin: {
    nom: "Admin",
    prenom: "Equipe",
    email: "admin@recycletrack.local",
    password: "Admin123!",
    role: "ADMIN",
  },
  agent: {
    nom: "Agent",
    prenom: "Terrain",
    email: "agent@recycletrack.local",
    password: "Agent123!",
    role: "AGENT",
  },
};

const seedDechetConfig = {
  nom: "Plastique PET",
  categorie: "Recyclable",
  description: "Dechet plastique de demonstration cree automatiquement.",
  icon: "recycle",
  uniteMesure: "kg",
  dangereux: false,
};

const seedStationConfig = {
  nom: "Station Centrale RecycleTrack",
  adresse: "Boulevard du Mono",
  ville: "Lome",
  capaciteMax: 5000,
  capaciteActuelle: 250,
  localisation: {
    latitude: 6.1319,
    longitude: 1.2228,
  },
  statut: "ACTIVE",
};

const seedCollecteConfig = {
  quantite: 120,
  statut: "VALIDEE",
  commentaire: "Collecte bootstrap de demonstration",
};

const seedRapportConfig = {
  titre: "Rapport bootstrap initial",
  description: "Rapport de demonstration cree automatiquement au demarrage.",
  statut: "GENERE",
};

const upsertUser = async (payload, createdBy, updatedBy = createdBy) => {
  const user = new User({
    nom: payload.nom,
    prenom: payload.prenom,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    createdBy,
    updatedBy,
    isActive: true,
    deletedAt: null,
    deletedBy: null,
    refreshToken: null,
  });
  
  await user.save();
  return user;
};

const upsertDechet = async (superAdminId) => {
  const dechet = new Dechet({
    ...seedDechetConfig,
    createdBy: superAdminId,
    updatedBy: superAdminId,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
  });
  
  await dechet.save();
  return dechet;
};

const upsertStation = async (dechetId, superAdminId) => {
  const station = new Station({
    ...seedStationConfig,
    typesDechetsAcceptes: [dechetId],
    createdBy: superAdminId,
    updatedBy: superAdminId,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
  });
  
  await station.save();
  return station;
};

const upsertCollecte = async ({ stationId, dechetId, agentId, superAdminId }) => {
  const collecte = new Collecte({
    station: stationId,
    dechet: dechetId,
    agent: agentId,
    quantite: seedCollecteConfig.quantite,
    statut: seedCollecteConfig.statut,
    commentaire: seedCollecteConfig.commentaire,
    dateCollecte: new Date(),
    createdBy: superAdminId,
    updatedBy: superAdminId,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
  });
  
  await collecte.save();
  return collecte;
};

const buildRapport = async ({ stationId, creatorId, collecte }) => {
  const startDate = new Date(collecte.dateCollecte || new Date());
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(collecte.dateCollecte || new Date());
  endDate.setHours(23, 59, 59, 999);

  const data = await rapportService.buildRapportData({
    dateDebut: startDate,
    dateFin: endDate,
  });

  return {
    titre: seedRapportConfig.titre,
    description: seedRapportConfig.description,
    station: stationId,
    generePar: creatorId,
    ...data,
    periode: {
      dateDebut: startDate,
      dateFin: endDate,
    },
    statut: seedRapportConfig.statut,
    genereLe: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

const bootstrapInitialData = async () => {
  // Check if this is the first launch by looking for ANY user
  const existingUserCount = await User.countDocuments();
  
  if (existingUserCount > 0) {
    // Database already has data - DO NOT seed
    logger.info('Database already contains data, skipping bootstrap seed');
    return null;
  }

  // First launch - seed initial data
  logger.info('First launch detected - creating bootstrap seed data');
  
  const superAdmin = await upsertUser(seedUsersConfig.superAdmin, null);
  const admin = await upsertUser(seedUsersConfig.admin, superAdmin._id);
  const agent = await upsertUser(seedUsersConfig.agent, superAdmin._id);

  const dechet = await upsertDechet(superAdmin._id);
  const station = await upsertStation(dechet._id, superAdmin._id);
  const collecte = await upsertCollecte({
    stationId: station._id,
    dechetId: dechet._id,
    agentId: agent._id,
    superAdminId: superAdmin._id,
  });
  const rapport = await buildRapport({
    stationId: station._id,
    creatorId: superAdmin._id,
    collecte,
  });

  logger.info({
    message: "Bootstrap initial data created successfully",
    users: Object.values(seedUsersConfig).map((user) => ({
      email: user.email,
      role: user.role,
    })),
    station: seedStationConfig.nom,
    dechet: seedDechetConfig.nom,
    collecte: seedCollecteConfig.commentaire,
    rapport: seedRapportConfig.titre,
  });

  return {
    users: {
      superAdmin,
      admin,
      agent,
    },
    station,
    dechet,
    collecte,
    rapport,
  };
};

module.exports = {
  bootstrapInitialData,
};
