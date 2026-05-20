const Visit = require('../models/Visit');

// GET /api/visits?agent=...&date=...
exports.list = async (req, res, next) => {
  try {
    const { agent, client, date, status } = req.query;
    const filter = {};

    // Un agent ne peut voir que ses propres visites
    if (req.user.role === 'agent') {
      filter.agent = req.user._id;
    } else if (agent) {
      filter.agent = agent;
    }

    if (client) filter.client = client;
    if (status) filter.status = status;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      filter.enteredAt = { $gte: startOfDay, $lt: endOfDay };
    }

    const visits = await Visit.find(filter)
      .populate('client', 'name type address location')
      .populate('agent', 'fullName email')
      .sort({ enteredAt: -1 });

    res.json({ visits });
  } catch (error) {
    next(error);
  }
};

// GET /api/visits/today - visites du jour de l'agent connecte
exports.today = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const visits = await Visit.find({
      agent: req.user._id,
      enteredAt: { $gte: startOfDay },
    })
      .populate('client', 'name type address')
      .sort({ enteredAt: -1 });

    res.json({ visits });
  } catch (error) {
    next(error);
  }
};

// PUT /api/visits/:id/notes - ajout de notes par l'agent
exports.addNotes = async (req, res, next) => {
  try {
    const visit = await Visit.findOneAndUpdate(
      { _id: req.params.id, agent: req.user._id },
      { notes: req.body.notes },
      { new: true }
    );
    if (!visit) return res.status(404).json({ message: 'Visite introuvable' });
    res.json({ visit });
  } catch (error) {
    next(error);
  }
};
