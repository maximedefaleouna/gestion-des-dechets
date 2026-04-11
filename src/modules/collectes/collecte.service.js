 const Collecte = require("./collecte.model");
const Station = require("../stations/station.model");
const Dechet = require("../dechets/dechet.model");
const { ROLES } = require("../../common/utils/autorize");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sanitizeCollecte = (collecte) => {
  if (!collecte) return null;
  
  return {
    id: collecte._id.toString(),
    station: collecte.station ? {
      id: collecte.station._id?.toString() || collecte.station.toString(),
      nom: collecte.station.nom,
      adresse: collecte.station.adresse,
      ville: collecte.station.ville,
    } : collecte.station,
    dechet: collecte.dechet ? {
      id: collecte.dechet._id?.toString() || collecte.dechet.toString(),
      nom: collecte.dechet.nom,
      categorie: collecte.dechet.categorie,
      uniteMesure: collecte.dechet.uniteMesure,
    } : collecte.dechet,
    agent: collecte.agent ? {
      id: collecte.agent._id?.toString() || collecte.agent.toString(),
      nom: collecte.agent.nom,
      prenom: collecte.agent.prenom,
      email: collecte.agent.email,
    } : collecte.agent,
    quantite: collecte.quantite,
    dateCollecte: collecte.dateCollecte ? collecte.dateCollecte.toISOString() : null,
    statut: collecte.statut,
    commentaire: collecte.commentaire,
    createdAt: collecte.createdAt ? collecte.createdAt.toISOString() : null,
  };
};

const canAccessCollecte = (currentUser, collecte) => {
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  if (currentUser.role === ROLES.ADMIN) return true;
  if (currentUser.role === ROLES.AGENT && collecte.agent.toString() === currentUser.id) return true;
  return false;
};

const canModifyCollecte = (currentUser, collecte) => {
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  if (currentUser.role === ROLES.ADMIN) return true;
  if (currentUser.role === ROLES.AGENT && 
      collecte.agent.toString() === currentUser.id &&
      collecte.statut !== "VALIDEE") return true;
  return false;
};

const getCollectes = async (query, currentUser) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  
  const allowedSortFields = ["quantite", "dateCollecte", "statut", "createdAt"];
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : "dateCollecte";
  const sortOrder = query.order === "asc" ? 1 : -1;

  const filters = {};

  // Filtre par station
  if (query.stationId) {
    filters.station = query.stationId;
  }

  // Filtre par type de déchet
  if (query.dechetId) {
    filters.dechet = query.dechetId;
  }

  // Filtre par statut
  if (query.statut) {
    filters.statut = query.statut;
  }

  // Filtre par date
  if (query.dateDebut || query.dateFin) {
    filters.dateCollecte = {};
    if (query.dateDebut) {
      filters.dateCollecte.$gte = new Date(query.dateDebut);
    }
    if (query.dateFin) {
      filters.dateCollecte.$lte = new Date(query.dateFin);
    }
  }

  // Filtre par agent (pour ADMIN et SUPER_ADMIN)
  if (query.agentId && (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.SUPER_ADMIN)) {
    filters.agent = query.agentId;
  }

  // Pour AGENT, ne voir que ses propres collectes
  if (currentUser.role === ROLES.AGENT) {
    filters.agent = currentUser.id;
  }

  const [collectes, total] = await Promise.all([
    Collecte.find(filters)
      .populate("station", "nom adresse ville capaciteMax capaciteActuelle")
      .populate("dechet", "nom categorie uniteMesure dangereux recyclable")
      .populate("agent", "nom prenom email role")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit),
    Collecte.countDocuments(filters),
  ]);

  return {
    data: collectes.map(sanitizeCollecte),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getCollecteById = async (collecteId, currentUser) => {
  const collecte = await Collecte.findById(collecteId)
    .populate("station", "nom adresse ville capaciteMax capaciteActuelle statut")
    .populate("dechet", "nom categorie uniteMesure dangereux recyclable")
    .populate("agent", "nom prenom email role");

  if (!collecte) {
    throw createError("Collecte non trouvée", 404);
  }

  if (!canAccessCollecte(currentUser, collecte)) {
    throw createError("Vous n'avez pas l'autorisation de consulter cette collecte", 403);
  }

  return sanitizeCollecte(collecte);
};

const createCollecte = async (payload, currentUser) => {
  // Vérifier que la station existe
  const station = await Station.findById(payload.station);
  if (!station) {
    throw createError("Station non trouvée", 404);
  }

  if (station.statut !== "ACTIVE") {
    throw createError("Cette station n'est pas active", 400);
  }

  // Vérifier que le type de déchet existe
  const dechet = await Dechet.findById(payload.dechet);
  if (!dechet) {
    throw createError("Type de déchet non trouvé", 404);
  }

  // Vérifier que la station accepte ce type de déchet
  if (!station.typesDechetsAcceptes || !station.typesDechetsAcceptes.includes(payload.dechet)) {
    throw createError("Cette station n'accepte pas ce type de déchet", 400);
  }

  // Vérifier la capacité disponible
  const nouvelleCapacite = (station.capaciteActuelle || 0) + payload.quantite;
  if (nouvelleCapacite > station.capaciteMax) {
    throw createError("Capacité insuffisante dans cette station", 400);
  }

  // Créer la collecte
  const collecte = await Collecte.create({
    station: payload.station,
    dechet: payload.dechet,
    agent: currentUser.id,
    quantite: payload.quantite,
    dateCollecte: payload.dateCollecte || new Date(),
    statut: payload.statut || "VALIDEE",
    commentaire: payload.commentaire,
  });

  // Mettre à jour la capacité de la station
  station.capaciteActuelle = nouvelleCapacite;
  await station.save();

  // Récupérer la collecte avec les populations
  const createdCollecte = await Collecte.findById(collecte._id)
    .populate("station", "nom adresse ville")
    .populate("dechet", "nom categorie")
    .populate("agent", "nom prenom email");

  return sanitizeCollecte(createdCollecte);
};

const updateCollecte = async (collecteId, payload, currentUser) => {
  const collecte = await Collecte.findById(collecteId)
    .populate("station", "capaciteActuelle capaciteMax");

  if (!collecte) {
    throw createError("Collecte non trouvée", 404);
  }

  if (!canModifyCollecte(currentUser, collecte)) {
    throw createError("Vous n'avez pas l'autorisation de modifier cette collecte", 403);
  }

  let quantiteAncienne = collecte.quantite;
  let quantiteNouvelle = payload.quantite !== undefined ? payload.quantite : quantiteAncienne;

  // Si la quantité change, mettre à jour la capacité de la station
  if (quantiteNouvelle !== quantiteAncienne) {
    const station = await Station.findById(collecte.station._id);
    const nouvelleCapacite = station.capaciteActuelle - quantiteAncienne + quantiteNouvelle;
    
    if (nouvelleCapacite > station.capaciteMax) {
      throw createError("Capacité insuffisante dans cette station", 400);
    }
    
    station.capaciteActuelle = nouvelleCapacite;
    await station.save();
    collecte.quantite = quantiteNouvelle;
  }

  // Mettre à jour les autres champs
  if (payload.commentaire !== undefined) collecte.commentaire = payload.commentaire;
  if (payload.statut !== undefined) collecte.statut = payload.statut;
  if (payload.dateCollecte !== undefined) collecte.dateCollecte = new Date(payload.dateCollecte);

  await collecte.save();

  const updatedCollecte = await Collecte.findById(collecte._id)
    .populate("station", "nom adresse ville")
    .populate("dechet", "nom categorie")
    .populate("agent", "nom prenom email");

  return sanitizeCollecte(updatedCollecte);
};

const deleteCollecte = async (collecteId, currentUser) => {
  const collecte = await Collecte.findById(collecteId);

  if (!collecte) {
    throw createError("Collecte non trouvée", 404);
  }

  if (!canModifyCollecte(currentUser, collecte)) {
    throw createError("Vous n'avez pas l'autorisation de supprimer cette collecte", 403);
  }

  // Restaurer la capacité de la station
  const station = await Station.findById(collecte.station);
  if (station) {
    station.capaciteActuelle = Math.max(0, (station.capaciteActuelle || 0) - collecte.quantite);
    await station.save();
  }

  await Collecte.findByIdAndDelete(collecteId);

  return { message: "Collecte supprimée avec succès" };
};

const getStatsByStation = async (stationId, currentUser, period = null) => {
  if (currentUser.role === ROLES.AGENT) {
    throw createError("Vous n'avez pas l'autorisation pour cette action", 403);
  }

  const station = await Station.findById(stationId);
  if (!station) {
    throw createError("Station non trouvée", 404);
  }

  let dateFilter = {};
  if (period && period.dateDebut && period.dateFin) {
    dateFilter = {
      dateCollecte: {
        $gte: new Date(period.dateDebut),
        $lte: new Date(period.dateFin),
      },
    };
  }

  const stats = await Collecte.aggregate([
    { $match: { station: station._id, ...dateFilter } },
    {
      $group: {
        _id: "$dechet",
        totalQuantite: { $sum: "$quantite" },
        nombreCollectes: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "dechets",
        localField: "_id",
        foreignField: "_id",
        as: "dechetInfo",
      },
    },
    { $unwind: "$dechetInfo" },
    {
      $project: {
        dechet: {
          id: "$dechetInfo._id",
          nom: "$dechetInfo.nom",
          categorie: "$dechetInfo.categorie",
        },
        totalQuantite: 1,
        nombreCollectes: 1,
      },
    },
  ]);

  const totalCollectes = await Collecte.countDocuments({ station: station._id, ...dateFilter });
  const quantiteTotale = await Collecte.aggregate([
    { $match: { station: station._id, ...dateFilter } },
    { $group: { _id: null, total: { $sum: "$quantite" } } },
  ]);

  return {
    station: {
      id: station._id.toString(),
      nom: station.nom,
      ville: station.ville,
      capaciteMax: station.capaciteMax,
      capaciteActuelle: station.capaciteActuelle || 0,
      tauxRemplissage: station.capaciteMax ? ((station.capaciteActuelle || 0) / station.capaciteMax * 100).toFixed(2) : 0,
    },
    periode: period || { dateDebut: "toutes", dateFin: "toutes" },
    resume: {
      totalCollectes,
      quantiteTotale: quantiteTotale[0]?.total || 0,
    },
    detailsParDechet: stats,
  };
};

const getGlobalStats = async (currentUser, period = null) => {
  if (currentUser.role === ROLES.AGENT) {
    throw createError("Vous n'avez pas l'autorisation pour cette action", 403);
  }

  let dateFilter = {};
  if (period && period.dateDebut && period.dateFin) {
    dateFilter = {
      dateCollecte: {
        $gte: new Date(period.dateDebut),
        $lte: new Date(period.dateFin),
      },
    };
  }

  const stats = await Collecte.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$dechet",
        totalQuantite: { $sum: "$quantite" },
        nombreCollectes: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "dechets",
        localField: "_id",
        foreignField: "_id",
        as: "dechetInfo",
      },
    },
    { $unwind: "$dechetInfo" },
    {
      $project: {
        dechet: {
          id: "$dechetInfo._id",
          nom: "$dechetInfo.nom",
          categorie: "$dechetInfo.categorie",
        },
        totalQuantite: 1,
        nombreCollectes: 1,
      },
    },
  ]);

  const totalCollectes = await Collecte.countDocuments(dateFilter);
  const quantiteTotale = await Collecte.aggregate([
    { $match: dateFilter },
    { $group: { _id: null, total: { $sum: "$quantite" } } },
  ]);

  const stationsActives = await Station.countDocuments({ statut: "ACTIVE" });

  return {
    periode: period || { dateDebut: "toutes", dateFin: "toutes" },
    resume: {
      totalCollectes,
      quantiteTotale: quantiteTotale[0]?.total || 0,
      stationsActives,
    },
    detailsParDechet: stats,
  };
};

module.exports = {
  createCollecte,
  deleteCollecte,
  getCollecteById,
  getCollectes,
  getGlobalStats,
  getStatsByStation,
  updateCollecte,
};