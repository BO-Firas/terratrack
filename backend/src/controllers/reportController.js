const Visit = require('../models/Visit');
const User = require('../models/User');
const Alert = require('../models/Alert');
const LocationPing = require('../models/LocationPing');

function haversine(c1, c2) {
  const [lng1, lat1] = c1, [lng2, lat2] = c2;
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// GET /api/reports/daily?agent=ID&date=YYYY-MM-DD
// Daily report (existing behaviour)
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
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    const visits = await Visit.find({
      agent: agentId,
      enteredAt: { $gte: startOfDay, $lt: endOfDay },
    })
      .populate('client', 'name type address location')
      .sort({ enteredAt: 1 });

    const visitDetails = visits.map((v, i) => {
      let travelFromPrevSeconds = null, travelFromPrevMeters = null;
      if (i > 0) {
        const prev = visits[i - 1];
        if (prev.leftAt && v.enteredAt) travelFromPrevSeconds = Math.round((v.enteredAt - prev.leftAt) / 1000);
        const prevCoord = prev.exitLocation?.coordinates || prev.entryLocation?.coordinates;
        const curCoord = v.entryLocation?.coordinates;
        if (prevCoord && curCoord) travelFromPrevMeters = Math.round(haversine(prevCoord, curCoord));
      }
      return {
        _id: v._id,
        clientName: v.client?.name || 'Client',
        clientType: v.client?.type,
        address: v.client?.address,
        enteredAt: v.enteredAt, leftAt: v.leftAt,
        durationSeconds: v.durationSeconds || 0,
        status: v.status, isConfirmed: v.isConfirmed,
        travelFromPrevSeconds, travelFromPrevMeters,
      };
    });

    const alerts = await Alert.find({ agent: agentId, createdAt: { $gte: startOfDay, $lt: endOfDay } }).sort({ createdAt: 1 });

    const pings = await LocationPing.find({
      agent: agentId, timestamp: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ timestamp: 1 }).select('location timestamp');

    let totalDistanceMeters = 0;
    for (let i = 1; i < pings.length; i++) {
      const a = pings[i - 1].location?.coordinates, b = pings[i].location?.coordinates;
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
        totalVisits: visits.length, completedVisits: completed.length,
        target, targetReached: target > 0 ? completed.length >= target : null,
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
      routePoints: pings.map((p) => ({ lng: p.location.coordinates[0], lat: p.location.coordinates[1], t: p.timestamp })),
    });
  } catch (error) { next(error); }
};

// GET /api/reports/period?agent=ID&start=YYYY-MM-DD&end=YYYY-MM-DD
// Aggregated report over a period (week, month, custom)
exports.periodReport = async (req, res, next) => {
  try {
    const agentId = req.query.agent || req.user._id;
    const startStr = req.query.start;
    const endStr = req.query.end;
    if (!startStr || !endStr) return res.status(400).json({ message: 'start and end dates are required (YYYY-MM-DD)' });

    const start = new Date(startStr); start.setHours(0, 0, 0, 0);
    const end = new Date(endStr); end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1); // include end day

    const agent = await User.findById(agentId).select('fullName email phone dailyTarget').populate('assignedZones', 'name');
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    // All visits over the period
    const visits = await Visit.find({
      agent: agentId,
      enteredAt: { $gte: start, $lt: end },
    }).populate('client', 'name type').sort({ enteredAt: 1 });

    const completed = visits.filter((v) => v.status !== 'in_progress');

    // Group visits by day
    const dayMap = {}; // dateStr -> { count, durationSec }
    const cursor = new Date(start);
    while (cursor < end) {
      const k = cursor.toISOString().split('T')[0];
      dayMap[k] = { count: 0, durationSec: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }
    completed.forEach((v) => {
      const k = v.enteredAt.toISOString().split('T')[0];
      if (dayMap[k]) {
        dayMap[k].count += 1;
        dayMap[k].durationSec += v.durationSeconds || 0;
      }
    });

    const byDay = Object.entries(dayMap).map(([date, d]) => ({
      date,
      count: d.count,
      avgMinutes: d.count ? Math.round(d.durationSec / d.count / 60) : 0,
    }));

    // Visits by type
    const byType = {};
    completed.forEach((v) => {
      const t = v.client?.type || 'other';
      byType[t] = (byType[t] || 0) + 1;
    });

    // Status breakdown
    const byStatus = {};
    visits.forEach((v) => { byStatus[v.status] = (byStatus[v.status] || 0) + 1; });

    // Alerts of the period
    const alerts = await Alert.find({ agent: agentId, createdAt: { $gte: start, $lt: end } });

    // Total distance over the period
    const pings = await LocationPing.find({
      agent: agentId, timestamp: { $gte: start, $lt: end },
    }).sort({ timestamp: 1 }).select('location timestamp');

    let totalDistanceMeters = 0;
    for (let i = 1; i < pings.length; i++) {
      const a = pings[i - 1].location?.coordinates, b = pings[i].location?.coordinates;
      if (a && b) totalDistanceMeters += haversine(a, b);
    }

    const totalVisitTimeSec = completed.reduce((s, v) => s + (v.durationSeconds || 0), 0);
    const workingDays = byDay.filter((d) => d.count > 0).length;
    const target = agent.dailyTarget || 0;
    const expectedTotal = target * byDay.length;

    res.json({
      agent: {
        fullName: agent.fullName, email: agent.email, phone: agent.phone,
        zones: agent.assignedZones?.map((z) => z.name) || [],
        dailyTarget: target,
      },
      period: { start: startStr, end: endStr, days: byDay.length },
      summary: {
        totalVisits: visits.length,
        completedVisits: completed.length,
        avgVisitsPerWorkingDay: workingDays ? Math.round((completed.length / workingDays) * 10) / 10 : 0,
        workingDays,
        totalVisitTimeHours: Math.round((totalVisitTimeSec / 3600) * 10) / 10,
        avgDurationMinutes: completed.length ? Math.round(totalVisitTimeSec / completed.length / 60) : 0,
        totalDistanceKm: Math.round(totalDistanceMeters / 100) / 10,
        target, expectedTotal,
        targetReached: target > 0 ? completed.length >= expectedTotal : null,
        targetPercent: target > 0 && expectedTotal > 0 ? Math.round((completed.length / expectedTotal) * 100) : null,
        alertsCount: alerts.length,
        unconfirmedCount: visits.filter((v) => !v.isConfirmed).length,
      },
      byDay,
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      byStatus,
    });
  } catch (error) { next(error); }
};
