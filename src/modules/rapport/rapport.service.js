const Collecte = require("../collectes/collecte.model");
const Station = require("../stations/station.model");
const User = require("../users/user.model");
const { ROLES } = require("../../common/utils/autorize");

const MONTH_LABELS_FR = [
  "Jan",
  "Fev",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aout",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const DASHBOARD_COLORS = [
  "#3498db",
  "#27ae60",
  "#f5a623",
  "#7f8fa4",
  "#8bc34a",
  "#95a5a6",
];

const toDate = (value, errorMessage) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createError(errorMessage, 400);
  }

  return date;
};

const getDefaultPeriod = () => {
  const now = new Date();
  const dateDebut = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1, 0, 0, 0, 0),
  );

  return { dateDebut, dateFin: now };
};

const getDashboardDefaultPeriod = () => {
  const now = new Date();
  const dateDebut = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1, 0, 0, 0, 0),
  );

  return { dateDebut, dateFin: now };
};

const normalizePeriod = (period = null) => {
  if (!period || !period.dateDebut || !period.dateFin) {
    return getDefaultPeriod();
  }

  const dateDebut = toDate(
    period.dateDebut,
    "La date de debut du rapport est invalide",
  );
  const dateFin = toDate(
    period.dateFin,
    "La date de fin du rapport est invalide",
  );

  if (dateDebut > dateFin) {
    throw createError(
      "La date de debut du rapport doit etre anterieure a la date de fin",
      400,
    );
  }

  return { dateDebut, dateFin };
};

const normalizeDashboardPeriod = (period = null) => {
  if (!period || !period.dateDebut || !period.dateFin) {
    return getDashboardDefaultPeriod();
  }

  return normalizePeriod(period);
};

const buildDateFilter = (period) => ({
  isDeleted: { $ne: true },
  dateCollecte: {
    $gte: period.dateDebut,
    $lte: period.dateFin,
  },
});

const getMonthKey = (year, monthIndex) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

const getMonthBuckets = (period) => {
  const buckets = [];
  const cursor = new Date(
    Date.UTC(
      period.dateDebut.getUTCFullYear(),
      period.dateDebut.getUTCMonth(),
      1,
      0,
      0,
      0,
      0,
    ),
  );
  const last = new Date(
    Date.UTC(
      period.dateFin.getUTCFullYear(),
      period.dateFin.getUTCMonth(),
      1,
      0,
      0,
      0,
      0,
    ),
  );

  while (cursor <= last) {
    buckets.push({
      key: getMonthKey(cursor.getUTCFullYear(), cursor.getUTCMonth()),
      mois: MONTH_LABELS_FR[cursor.getUTCMonth()],
      annee: cursor.getUTCFullYear(),
      quantiteKg: 0,
    });

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return buckets;
};

const mapMonthlyEvolution = (rows, period) => {
  const buckets = getMonthBuckets(period);
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  rows.forEach((row) => {
    const key = getMonthKey(row._id.year, row._id.month - 1);
    const bucket = bucketByKey.get(key);

    if (bucket) {
      bucket.quantiteKg = row.quantiteKg;
    }
  });

  return buckets.map(({ key, ...bucket }) => bucket);
};

const getSummaryForPeriod = async (period) => {
  const [summary] = await Collecte.aggregate([
    { $match: buildDateFilter(period) },
    {
      $group: {
        _id: null,
        totalQuantiteKg: { $sum: "$quantite" },
        totalCollectes: { $sum: 1 },
      },
    },
  ]);

  return {
    totalQuantiteKg: summary?.totalQuantiteKg || 0,
    totalCollectes: summary?.totalCollectes || 0,
  };
};

const getPreviousEquivalentPeriod = (period) => {
  const duration = period.dateFin.getTime() - period.dateDebut.getTime();
  const dateFin = new Date(period.dateDebut.getTime() - 1000);
  const dateDebut = new Date(dateFin.getTime() - duration);

  return { dateDebut, dateFin };
};

const getMonthToDatePeriod = () => {
  const now = new Date();
  const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  return { dateDebut, dateFin: now };
};

const getWeekToDatePeriod = () => {
  const now = new Date();
  const dateDebut = new Date(now);
  const day = dateDebut.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;

  dateDebut.setDate(dateDebut.getDate() - diffToMonday);
  dateDebut.setHours(0, 0, 0, 0);

  return { dateDebut, dateFin: now };
};

const computeVariation = (currentValue, previousValue) => {
  if (!previousValue) {
    return currentValue ? 100 : 0;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
};

const sanitizeId = (value) => (value ? value.toString() : null);

const aggregateTypeTotals = async (period) =>
  Collecte.aggregate([
    { $match: buildDateFilter(period) },
    {
      $group: {
        _id: "$dechet",
        quantiteKg: { $sum: "$quantite" },
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
        _id: 0,
        dechetId: "$dechetInfo._id",
        nom: "$dechetInfo.nom",
        categorie: "$dechetInfo.categorie",
        quantiteKg: 1,
        nombreCollectes: 1,
      },
    },
    { $sort: { quantiteKg: -1, nom: 1 } },
  ]);

const aggregateMonthlyByType = async (period) =>
  Collecte.aggregate([
    { $match: buildDateFilter(period) },
    {
      $group: {
        _id: {
          year: { $year: "$dateCollecte" },
          month: { $month: "$dateCollecte" },
          dechet: "$dechet",
        },
        quantiteKg: { $sum: "$quantite" },
        nombreCollectes: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "dechets",
        localField: "_id.dechet",
        foreignField: "_id",
        as: "dechetInfo",
      },
    },
    { $unwind: "$dechetInfo" },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        dechetId: "$dechetInfo._id",
        nom: "$dechetInfo.nom",
        categorie: "$dechetInfo.categorie",
        quantiteKg: 1,
        nombreCollectes: 1,
      },
    },
    { $sort: { year: 1, month: 1, quantiteKg: -1 } },
  ]);

const aggregateRecentCollectes = async (period, limit = 5) => {
  const collectes = await Collecte.find(buildDateFilter(period))
    .populate("station", "nom ville")
    .populate("dechet", "nom categorie")
    .populate("agent", "nom prenom")
    .sort({ dateCollecte: -1 })
    .limit(limit);

  return collectes.map((collecte) => ({
    id: collecte._id.toString(),
    station: collecte.station
      ? {
          id: sanitizeId(collecte.station._id),
          nom: collecte.station.nom,
          ville: collecte.station.ville,
        }
      : null,
    agent: collecte.agent
      ? {
          id: sanitizeId(collecte.agent._id),
          nom: collecte.agent.nom,
          prenom: collecte.agent.prenom,
        }
      : null,
    dechet: collecte.dechet
      ? {
          id: sanitizeId(collecte.dechet._id),
          nom: collecte.dechet.nom,
          categorie: collecte.dechet.categorie,
        }
      : null,
    quantiteKg: collecte.quantite,
    dateCollecte: collecte.dateCollecte
      ? collecte.dateCollecte.toISOString()
      : null,
    statut: collecte.statut,
  }));
};

const aggregateCollections = async (period) => {
  const dateFilter = buildDateFilter(period);

  const [
    totals,
    monthlyEvolution,
    collecteParStation,
    repartitionParTypeDechet,
    recyclableQuantite,
    totalCollectes,
    stationsActives,
  ] = await Promise.all([
    Collecte.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalQuantite: { $sum: "$quantite" },
          totalCollectes: { $sum: 1 },
        },
      },
    ]),
    Collecte.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$dateCollecte" },
            month: { $month: "$dateCollecte" },
          },
          quantiteKg: { $sum: "$quantite" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Collecte.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$station",
          quantiteKg: { $sum: "$quantite" },
          nombreCollectes: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "stations",
          localField: "_id",
          foreignField: "_id",
          as: "stationInfo",
        },
      },
      { $unwind: "$stationInfo" },
      {
        $project: {
          _id: 0,
          stationId: "$stationInfo._id",
          nom: "$stationInfo.nom",
          ville: "$stationInfo.ville",
          quantiteKg: 1,
          nombreCollectes: 1,
        },
      },
      { $sort: { quantiteKg: -1, nom: 1 } },
    ]),
    Collecte.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$dechet",
          quantiteKg: { $sum: "$quantite" },
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
          _id: 0,
          dechetId: "$dechetInfo._id",
          nom: "$dechetInfo.nom",
          categorie: "$dechetInfo.categorie",
          quantiteKg: 1,
          nombreCollectes: 1,
        },
      },
      { $sort: { quantiteKg: -1, nom: 1 } },
    ]),
    Collecte.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "dechets",
          localField: "dechet",
          foreignField: "_id",
          as: "dechetInfo",
        },
      },
      { $unwind: "$dechetInfo" },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $eq: ["$dechetInfo.categorie", "Recyclable"] },
                "$quantite",
                0,
              ],
            },
          },
        },
      },
    ]),
    Collecte.countDocuments(dateFilter),
    Station.countDocuments({ statut: "ACTIVE" }),
  ]);

  const totalQuantite = totals[0]?.totalQuantite || 0;
  const totalCollectesCount = totalCollectes || totals[0]?.totalCollectes || 0;
  const moyenneParCollecteKg = totalCollectesCount
    ? Math.round(totalQuantite / totalCollectesCount)
    : 0;
  const recyclableTotalKg = recyclableQuantite[0]?.total || 0;
  const tauxRecyclage = totalQuantite
    ? Math.round((recyclableTotalKg / totalQuantite) * 100)
    : 0;

  return {
    periode: {
      dateDebut: period.dateDebut.toISOString(),
      dateFin: period.dateFin.toISOString(),
    },
    resume: {
      totalRecycleKg: totalQuantite,
      totalRecycleTonne: Number((totalQuantite / 1000).toFixed(1)),
      moyenneParCollecteKg,
      tauxRecyclage,
      meilleureStation: collecteParStation[0]
        ? {
            stationId: collecteParStation[0].stationId
              ? collecteParStation[0].stationId.toString()
              : null,
            nom: collecteParStation[0].nom,
            ville: collecteParStation[0].ville,
            quantiteKg: collecteParStation[0].quantiteKg,
          }
        : null,
      totalCollectes: totalCollectesCount,
      stationsActives,
    },
    evolutionMensuelle: mapMonthlyEvolution(monthlyEvolution, period),
    collecteParStation: collecteParStation.map((station) => ({
      stationId: station.stationId ? station.stationId.toString() : null,
      nom: station.nom,
      ville: station.ville,
      quantiteKg: station.quantiteKg,
      nombreCollectes: station.nombreCollectes,
    })),
    repartitionParType: repartitionParTypeDechet.map((dechet) => ({
      dechetId: dechet.dechetId ? dechet.dechetId.toString() : null,
      nom: dechet.nom,
      categorie: dechet.categorie,
      quantiteKg: dechet.quantiteKg,
      nombreCollectes: dechet.nombreCollectes,
    })),
    repartitionParTypeDechet: repartitionParTypeDechet.map((dechet) => ({
      dechetId: dechet.dechetId ? dechet.dechetId.toString() : null,
      nom: dechet.nom,
      categorie: dechet.categorie,
      quantiteKg: dechet.quantiteKg,
      nombreCollectes: dechet.nombreCollectes,
    })),
  };
};

const buildDashboardData = async (period = null) => {
  const chartPeriod = normalizeDashboardPeriod(period);
  const monthToDatePeriod = getMonthToDatePeriod();
  const weekToDatePeriod = getWeekToDatePeriod();
  const previousMonthPeriod = getPreviousEquivalentPeriod(monthToDatePeriod);
  const previousWeekPeriod = getPreviousEquivalentPeriod(weekToDatePeriod);

  const [
    chartPeriodSummary,
    totalStations,
    activeStations,
    totalAgents,
    activeAgents,
    currentMonthSummary,
    previousMonthSummary,
    currentWeekSummary,
    previousWeekSummary,
    typeTotals,
    monthlyByTypeRows,
    recentCollectes,
  ] = await Promise.all([
    getSummaryForPeriod(chartPeriod),
    Station.countDocuments({ isDeleted: { $ne: true } }),
    Station.countDocuments({ statut: "ACTIVE", isDeleted: { $ne: true } }),
    User.countDocuments({ role: "AGENT", deletedAt: null }),
    User.countDocuments({ role: "AGENT", isActive: true, deletedAt: null }),
    getSummaryForPeriod(monthToDatePeriod),
    getSummaryForPeriod(previousMonthPeriod),
    getSummaryForPeriod(weekToDatePeriod),
    getSummaryForPeriod(previousWeekPeriod),
    aggregateTypeTotals(chartPeriod),
    aggregateMonthlyByType(chartPeriod),
    aggregateRecentCollectes(chartPeriod, 5),
  ]);

  const monthBuckets = getMonthBuckets(chartPeriod);
  const monthLabels = monthBuckets.map((bucket) => `${bucket.mois}`);
  const monthIndexByKey = new Map(
    monthBuckets.map((bucket, index) => [bucket.key, index]),
  );

  const topTypes = typeTotals.slice(0, 5);
  const topTypeIds = new Map(
    topTypes.map((item, index) => [sanitizeId(item.dechetId), index]),
  );
  const hasAutres = typeTotals.length > topTypes.length;
  const series = topTypes.map((type, index) => ({
    dechetId: sanitizeId(type.dechetId),
    nom: type.nom,
    categorie: type.categorie,
    couleur: DASHBOARD_COLORS[index % DASHBOARD_COLORS.length],
    data: new Array(monthLabels.length).fill(0),
  }));

  if (hasAutres) {
    series.push({
      dechetId: "autres",
      nom: "Autres",
      categorie: null,
      couleur: DASHBOARD_COLORS[topTypes.length % DASHBOARD_COLORS.length],
      data: new Array(monthLabels.length).fill(0),
    });
  }

  monthlyByTypeRows.forEach((row) => {
    const monthKey = getMonthKey(row.year, row.month - 1);
    const monthIndex = monthIndexByKey.get(monthKey);
    if (monthIndex === undefined) {
      return;
    }

    const rowTypeId = sanitizeId(row.dechetId);
    const seriesIndex = topTypeIds.has(rowTypeId)
      ? topTypeIds.get(rowTypeId)
      : hasAutres
        ? series.length - 1
        : -1;

    if (seriesIndex >= 0) {
      series[seriesIndex].data[monthIndex] += row.quantiteKg;
    }
  });

  const repartitionParType = typeTotals.map((type, index) => {
    const pourcentage = chartPeriodSummary.totalQuantiteKg
      ? Math.round((type.quantiteKg / chartPeriodSummary.totalQuantiteKg) * 100)
      : 0;

    return {
      dechetId: sanitizeId(type.dechetId),
      nom: type.nom,
      categorie: type.categorie,
      quantiteKg: type.quantiteKg,
      nombreCollectes: type.nombreCollectes,
      pourcentage,
      couleur: DASHBOARD_COLORS[index % DASHBOARD_COLORS.length],
    };
  });

  return {
    periode: {
      dateDebut: chartPeriod.dateDebut.toISOString(),
      dateFin: chartPeriod.dateFin.toISOString(),
    },
    cartes: {
      stationsActives: {
        valeur: activeStations,
        total: totalStations,
        pourcentage: totalStations
          ? Math.round((activeStations / totalStations) * 100)
          : 0,
      },
      totalCollecte: {
        valeurKg: currentMonthSummary.totalQuantiteKg,
        valeurTonne: Number(
          (currentMonthSummary.totalQuantiteKg / 1000).toFixed(1),
        ),
        libelle: "Ce mois",
        variationPourcent: computeVariation(
          currentMonthSummary.totalQuantiteKg,
          previousMonthSummary.totalQuantiteKg,
        ),
      },
      collectes: {
        valeur: currentWeekSummary.totalCollectes,
        libelle: "Cette semaine",
        variationPourcent: computeVariation(
          currentWeekSummary.totalCollectes,
          previousWeekSummary.totalCollectes,
        ),
      },
      agentsActifs: {
        valeur: activeAgents,
        total: totalAgents,
        pourcentage: totalAgents
          ? Math.round((activeAgents / totalAgents) * 100)
          : 0,
      },
    },
    collectesMensuelles: {
      labels: monthLabels,
      series,
    },
    repartitionParType,
    collectesRecentes: recentCollectes,
  };
};

const buildRapportData = async (period = null) => {
  const normalizedPeriod = normalizePeriod(period);
  return aggregateCollections(normalizedPeriod);
};

const getRapportStatistiques = async (currentUser, period = null) => {
  // if (currentUser.role === ROLES.AGENT) {
  //   throw createError(
  //     "Vous n'avez pas l'autorisation pour consulter les rapports",
  //     403,
  //   );
  // }

  return buildRapportData(period);
};

const getRapportDashboard = async (currentUser, period = null) => {
  // if (currentUser.role === ROLES.AGENT) {
  //   throw createError(
  //     "Vous n'avez pas l'autorisation pour consulter le tableau de bord",
  //     403,
  //   );
  // }

  return buildDashboardData(period);
};

module.exports = {
  buildRapportData,
  buildDashboardData,
  getRapportDashboard,
  getRapportStatistiques,
};
