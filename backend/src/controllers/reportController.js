const Visit = require('../models/Visit');
const User = require('../models/User');
const Alert = require('../models/Alert');
const LocationPing = require('../models/LocationPing');

// Distance haversine en metres
function haversine(c1, c2) {
  const [lng1, lat1] = c1, [lng2, lat2] = c2;
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// GET /api/reports/daily?agent=ID&date=YYYY-MM-DD
// Rapport journalier complet d'un agent
exports.dailyReport = async (req, res, next) => {
  try {
    const agentId = req.query.agent || req.user._id;
    const dateStr = req.query.date;
    const startOfDay = dateStr ? new Date(dateStr) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const agent = await User.findById(agentId)
      .select('fullName email phone role dailyTarget')
      .populate('assignedZones', 'name');
    if (!agent) return res.status(404).json({ message: 'Agent introuvable' });

    // Visites du jour, triees par heure d'entree
    const visits = await Visit.find({
      agent: agentId,
      enteredAt: { $gte: startOfDay, $lt: endOfDay },
    })
      .populate('client', 'name type address location')
      .sort({ enteredAt: 1 });

    // Temps de trajet entre visites consecutives (estimation a vol d'oiseau
    // basee sur les positions de sortie/entree)
    const visitDetails = visits.map((v, i) => {
      let travelFromPrevSeconds = null;
      let travelFromPrevMeters = null;
      if (i > 0) {
        const prev = visits[i - 1];
        if (prev.leftAt && v.enteredAt) {
          travelFromPrevSeconds = Math.round((v.enteredAt - prev.leftAt) / 1000);
        }
        const prevCoord = prev.exitLocation?.coordinates || prev.entryLocation?.coordinates;
        const curCoord = v.entryLocation?.coordinates;
        if (prevCoord && curCoord) {
          travelFromPrevMeters = Math.round(haversine(prevCoord, curCoord));
        }
      }
      return {
        _id: v._id,
        clientName: v.client?.name || 'Client',
        clientType: v.client?.type,
        address: v.client?.address,
        enteredAt: v.enteredAt,
        leftAt: v.leftAt,
        durationSeconds: v.durationSeconds || 0,
        status: v.status,
        isConfirmed: v.isConfirmed,
        travelFromPrevSeconds,
        travelFromPrevMeters,
      };
    });

    // Alertes du jour
    const alerts = await Alert.find({
      agent: agentId,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ createdAt: 1 });

    // Distance totale parcourue (somme des pings consecutifs)
    const pings = await LocationPing.find({
      agent: agentId,
      timestamp: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ timestamp: 1 }).select('location timestamp');

    let totalDistanceMeters = 0;
    for (let i = 1; i < pings.length; i++) {
      const a = pings[i - 1].location?.coordinates;
      const b = pings[i].location?.coordinates;
      if (a && b) totalDistanceMeters += haversine(a, b);
    }

    const completed = visitDetails.filter((v) => v.status !== 'in_progress');
    const totalVisitTime = completed.reduce((s, v) => s + v.durationSeconds, 0);
    const totalTravelTime = visitDetails.reduce((s, v) => s + (v.travelFromPrevSeconds || 0), 0);
    const target = agent.dailyTarget || 0;

    res.json({
      agent: {
        fullName: agent.fullName, email: agent.email, phone: agent.phone,
        zones: agent.assignedZones?.map((z) => z.name) || [],
        dailyTarget: target,
      },
      date: startOfDay.toISOString().split('T')[0],
      summary: {
        totalVisits: visits.length,
        completedVisits: completed.length,
        target,
        targetReached: target > 0 ? completed.length >= target : null,
        targetPercent: target > 0 ? Math.round((completed.length / target) * 100) : null,
        totalVisitTimeMinutes: Math.round(totalVisitTime / 60),
        totalTravelTimeMinutes: Math.round(totalTravelTime / 60),
        totalDistanceKm: Math.round(totalDistanceMeters / 100) / 10,
        alertsCount: alerts.length,
      },
      visits: visitDetails,
      alerts: alerts.map((a) => ({
        type: a.type, severity: a.severity, message: a.message, createdAt: a.createdAt,
      })),
      routePoints: pings.map((p) => ({
        lng: p.location.coordinates[0],
        lat: p.location.coordinates[1],
        t: p.timestamp,
      })),
    });
  } catch (error) {
    next(error);
  }
};
