const Zone = require('../models/Zone');

// GET /api/zones
exports.list = async (req, res, next) => {
  try {
    const zones = await Zone.find({ isActive: true });
    res.json({ zones });
  } catch (error) {
    next(error);
  }
};

// GET /api/zones/:id
exports.getOne = async (req, res, next) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone introuvable' });
    res.json({ zone });
  } catch (error) {
    next(error);
  }
};

// POST /api/zones
exports.create = async (req, res, next) => {
  try {
    const { name, description, type, coordinates, color } = req.body;
    // coordinates attendu au format GeoJSON Polygon: [[ [lng,lat], ..., [lng,lat] ]]
    // Le 1er et le dernier point doivent etre identiques

    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ message: 'coordonnees du polygone requises' });
    }

    const zone = await Zone.create({
      name,
      description,
      type,
      color,
      area: { type: 'Polygon', coordinates },
    });
    res.status(201).json({ zone });
  } catch (error) {
    next(error);
  }
};

// PUT /api/zones/:id
exports.update = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.coordinates) {
      updates.area = { type: 'Polygon', coordinates: updates.coordinates };
      delete updates.coordinates;
    }

    const zone = await Zone.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!zone) return res.status(404).json({ message: 'Zone introuvable' });
    res.json({ zone });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/zones/:id - soft delete
exports.remove = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!zone) return res.status(404).json({ message: 'Zone introuvable' });
    res.json({ message: 'Zone desactivee' });
  } catch (error) {
    next(error);
  }
};

// GET /api/zones/contains?lng=...&lat=...
// Trouve les zones qui contiennent un point - utile pour verifier si un agent est en zone autorisee
exports.containsPoint = async (req, res, next) => {
  try {
    const { lng, lat } = req.query;
    if (!lng || !lat) {
      return res.status(400).json({ message: 'lng et lat requis' });
    }

    const zones = await Zone.find({
      isActive: true,
      area: {
        $geoIntersects: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        },
      },
    });

    res.json({ zones });
  } catch (error) {
    next(error);
  }
};
