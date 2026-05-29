const Alert = require('../models/Alert');

// GET /api/alerts?agent=...&unread=true
exports.list = async (req, res, next) => {
  try {
    const { agent, unread, severity, type } = req.query;
    const filter = {};

    // An agent sees only their own alerts
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
      .limit(500);

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
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ alert });
  } catch (error) {
    next(error);
  }
};

// PUT /api/alerts/:id/resolve - mark single alert as resolved
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
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ alert });
  } catch (error) {
    next(error);
  }
};

// PUT /api/alerts/resolve-all - mark every unresolved alert as resolved
// (supervisor / admin only - protected at route level)
exports.resolveAll = async (req, res, next) => {
  try {
    const result = await Alert.updateMany(
      { isResolved: false },
      {
        isResolved: true,
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
      }
    );
    res.json({
      message: 'All alerts marked as resolved',
      count: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};
