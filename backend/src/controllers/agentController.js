const User = require('../models/User');
const LocationPing = require('../models/LocationPing');

// GET /api/agents - liste des agents (superviseur/admin)
exports.listAgents = async (req, res, next) => {
  try {
    const agents = await User.find({ role: 'agent' })
      .populate('assignedZones', 'name color')
      .sort({ fullName: 1 });
    res.json({ agents });
  } catch (error) {
    next(error);
  }
};

// GET /api/agents/:id
exports.getAgent = async (req, res, next) => {
  try {
    const agent = await User.findById(req.params.id).populate('assignedZones');
    if (!agent) return res.status(404).json({ message: 'Agent introuvable' });
    res.json({ agent });
  } catch (error) {
    next(error);
  }
};

// PUT /api/agents/:id - mise a jour (zones assignees, profil)
exports.updateAgent = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'phone', 'assignedZones', 'isActive'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const agent = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('assignedZones');

    if (!agent) return res.status(404).json({ message: 'Agent introuvable' });
    res.json({ agent });
  } catch (error) {
    next(error);
  }
};

// GET /api/agents/:id/track?date=YYYY-MM-DD
// Historique des positions d'un agent pour une journee
exports.getTrack = async (req, res, next) => {
  try {
    const { date } = req.query;
    const startOfDay = date ? new Date(date) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const pings = await LocationPing.find({
      agent: req.params.id,
      timestamp: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ timestamp: 1 });

    res.json({ pings });
  } catch (error) {
    next(error);
  }
};

// GET /api/agents/live - dernieres positions connues de tous les agents actifs
exports.getLivePositions = async (req, res, next) => {
  try {
    const agents = await User.find({
      role: 'agent',
      isActive: true,
      lastKnownLocation: { $exists: true },
    }).select('fullName lastKnownLocation');

    res.json({ agents });
  } catch (error) {
    next(error);
  }
};
