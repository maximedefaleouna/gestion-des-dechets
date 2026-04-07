const User = require("../../modules/users/user.model");
const Station = require("../../modules/stations/station.model");
const Dechet = require("../../modules/dechets/dechet.model");
const Collecte = require("../../modules/collectes/collecte.model");
const Rapport = require("../../modules/rapport/rapport.model");
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
  categorie: "PLASTIQUE",
  description: "Dechet plastique de demonstration cree automatiquement.",
  uniteMesure: "kg",
  dangereux: false,
  recyclable: true,
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

const upsertUser = async (payload, createdBy) => {
  let user = await User.findOne({ email: payload.email }).select(
    "+password +refreshToken",
  );

  if (!user) {
    user = new User({
      nom: payload.nom,
      prenom: payload.prenom,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      createdBy,
      isActive: true,
      deletedAt: null,
      deletedBy: null,
      refreshToken: null,
    });
  } else {
    user.nom = payload.nom;
    user.prenom = payload.prenom;
    user.password = payload.password;
    user.role = payload.role;
    user.createdBy = createdBy;
    user.isActive = true;
    user.deletedAt = null;
    user.deletedBy = null;
    user.refreshToken = null;
  }

  await user.save();
  return user;
};

const upsertDechet = async () => {
  const dechet = await Dechet.findOneAndUpdate(
    { nom: seedDechetConfig.nom },
    { $set: seedDechetConfig },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  return dechet;
};

const upsertStation = async (dechetId) => {
  const station = await Station.findOneAndUpdate(
    {
      nom: seedStationConfig.nom,
      ville: seedStationConfig.ville,
    },
    {
      $set: {
        ...seedStationConfig,
        typesDechetsAcceptes: [dechetId],
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  return station;
};

const upsertCollecte = async ({ stationId, dechetId, agentId }) => {
  const collecte = await Collecte.findOneAndUpdate(
    { commentaire: seedCollecteConfig.commentaire },
    {
      $set: {
        station: stationId,
        dechet: dechetId,
        agent: agentId,
        quantite: seedCollecteConfig.quantite,
        statut: seedCollecteConfig.statut,
      },
      $setOnInsert: {
        commentaire: seedCollecteConfig.commentaire,
        dateCollecte: new Date(),
        createdAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  return collecte;
};

const upsertRapport = async ({ stationId, adminId, collecte }) => {
  const startDate = new Date(collecte.dateCollecte || new Date());
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(collecte.dateCollecte || new Date());
  endDate.setHours(23, 59, 59, 999);

  const rapport = await Rapport.findOneAndUpdate(
    { titre: seedRapportConfig.titre },
    {
      $set: {
        description: seedRapportConfig.description,
        station: stationId,
        generePar: adminId,
        periode: {
          dateDebut: startDate,
          dateFin: endDate,
        },
        totalCollectes: 1,
        quantiteTotale: collecte.quantite,
        statut: seedRapportConfig.statut,
      },
      $setOnInsert: {
        titre: seedRapportConfig.titre,
        createdAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  return rapport;
};

const bootstrapInitialData = async () => {
  const superAdmin = await upsertUser(seedUsersConfig.superAdmin, null);
  const admin = await upsertUser(seedUsersConfig.admin, superAdmin._id);
  const agent = await upsertUser(seedUsersConfig.agent, admin._id);

  const dechet = await upsertDechet();
  const station = await upsertStation(dechet._id);
  const collecte = await upsertCollecte({
    stationId: station._id,
    dechetId: dechet._id,
    agentId: agent._id,
  });
  const rapport = await upsertRapport({
    stationId: station._id,
    adminId: admin._id,
    collecte,
  });

  logger.info({
    message: "Bootstrap initial data synchronized",
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
