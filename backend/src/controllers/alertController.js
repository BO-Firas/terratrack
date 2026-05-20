const Alert = require('../models/Alert');

// GET /api/alerts?agent=...&unread=true
exports.list = async (req, res, next) => {
  try {
    const { agent, unread, severity, type } = req.query;
    const filter = {};

    // Un agent ne voit que ses propres alertes
    if (req.user.role === 'agent') {
      filter.agent = req.user._id;
    } else if (agent) {
      filter.agent = agent;
    }

    if (unread === 'true') filter.isRead = false;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const alerts = await Alert.find(filter)
      .populate('agent', 'fullName')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ alerts });
  } catch (error) {
    next(error);
  }
};

// PUT /api/alerts/:id/read
exports.markRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alerte introuvable' });
    res.json({ alert });
  } catch (error) {
    next(error);
  }
};

// PUT /api/alerts/:id/resolve
exports.resolve = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        isResolved: true,
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
      },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alerte introuvable' });
    res.json({ alert });
  } catch (error) {
    next(error);
  }
};
