const Visit = require('../models/Visit');
const User = require('../models/User');
const Alert = require('../models/Alert');

// Construit les statistiques de performance d'un agent donne.
// Reutilise par l'agent (ses propres stats) et le superviseur (stats d'un agent).
async function buildAgentStats(agentId) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Debut de semaine (lundi)
  const startOfWeek = new Date(startOfToday);
  const day = (startOfWeek.getDay() + 6) % 7; // 0 = lundi
  startOfWeek.setDate(startOfWeek.getDate() - day);

  // 7 derniers jours pour le graphique
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const allVisits = await Visit.find({ agent: agentId }).populate('client', 'name type');

  const completed = allVisits.filter((v) => v.status !== 'in_progress');
  const totalDuration = completed.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
  const avgDuration = completed.length ? Math.round(totalDuration / completed.length) : 0;

  const todayVisits = allVisits.filter((v) => v.enteredAt >= startOfToday);
  const weekVisits = allVisits.filter((v) => v.enteredAt >= startOfWeek);

  // Visites par jour (7 derniers jours)
  const visitsByDay = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(sevenDaysAgo);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = allVisits.filter(
      (v) => v.enteredAt >= dayStart && v.enteredAt < dayEnd
    ).length;

    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const dayIndex = (dayStart.getDay() + 6) % 7;

    visitsByDay.push({
      date: dayStart.toISOString().split('T')[0],
      label: labels[dayIndex],
      count,
    });
  }

  // Repartition par type de client
  const byType = {};
  completed.forEach((v) => {
    const t = v.client?.type || 'autre';
    byType[t] = (byType[t] || 0) + 1;
  });
  const visitsByType = Object.entries(byType).map(([type, count]) => ({ type, count }));

  // Repartition par statut
  const byStatus = {};
  allVisits.forEach((v) => {
    byStatus[v.status] = (byStatus[v.status] || 0) + 1;
  });

  // Alertes de l'agent
  const alertCount = await Alert.countDocuments({ agent: agentId, isResolved: false });

  // Duree moyenne par jour (pour graphique secondaire)
  const avgDurationByDay = visitsByDay.map((d) => {
    const dayVisits = completed.filter(
      (v) => v.enteredAt.toISOString().split('T')[0] === d.date
    );
    const total = dayVisits.reduce((s, v) => s + (v.durationSeconds || 0), 0);
    return {
      label: d.label,
      avgMinutes: dayVisits.length ? Math.round(total / dayVisits.length / 60) : 0,
    };
  });

  return {
    summary: {
      totalVisits: allVisits.length,
      completedVisits: completed.length,
      todayVisits: todayVisits.length,
      weekVisits: weekVisits.length,
      totalDurationMinutes: Math.round(totalDuration / 60),
      avgDurationMinutes: Math.round(avgDuration / 60),
      avgDurationSeconds: avgDuration,
      unconfirmedVisits: allVisits.filter((v) => !v.isConfirmed).length,
      activeAlerts: alertCount,
    },
    visitsByDay,
    avgDurationByDay,
    visitsByType,
    byStatus,
  };
}

// GET /api/stats/me - statistiques de l'agent connecte
exports.myStats = async (req, res, next) => {
  try {
    const stats = await buildAgentStats(req.user._id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/agent/:id - statistiques d'un agent (superviseur/admin)
exports.agentStats = async (req, res, next) => {
  try {
    const agent = await User.findById(req.params.id)
      .select('fullName email phone role isActive lastKnownLocation')
      .populate('assignedZones', 'name color');
    if (!agent) return res.status(404).json({ message: 'Agent introuvable' });

    const stats = await buildAgentStats(req.params.id);
    res.json({ agent, ...stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/overview - vue d'ensemble pour le superviseur (tous les agents)
exports.overview = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const agents = await User.find({ role: 'agent' }).select('fullName isActive');
    const totalAgents = agents.length;
    const activeAgents = agents.filter((a) => a.isActive).length;

    const todayVisits = await Visit.countDocuments({ enteredAt: { $gte: startOfToday } });
    const activeAlerts = await Alert.countDocuments({ isResolved: false });
    const unconfirmed = await Visit.countDocuments({ isConfirmed: false });

    res.json({
      totalAgents,
      activeAgents,
      todayVisits,
      activeAlerts,
      unconfirmedVisits: unconfirmed,
    });
  } catch (error) {
    next(error);
  }
};
