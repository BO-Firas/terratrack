const Client = require('../models/Client');

// GET /api/clients
exports.list = async (req, res, next) => {
  try {
    const { zone, type, active } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (type) filter.type = type;
    if (active !== undefined) filter.isActive = active === 'true';

    const clients = await Client.find(filter).populate('zone', 'name color');
    res.json({ clients });
  } catch (error) {
    next(error);
  }
};

// GET /api/clients/:id
exports.getOne = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id).populate('zone');
    if (!client) return res.status(404).json({ message: 'Client introuvable' });
    res.json({ client });
  } catch (error) {
    next(error);
  }
};

// POST /api/clients - admin / superviseur uniquement
exports.create = async (req, res, next) => {
  try {
    const { name, type, address, phone, contactPerson, longitude, latitude, geofenceRadius, zone } = req.body;

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ message: 'Longitude et latitude obligatoires' });
    }

    const client = await Client.create({
      name,
      type,
      address,
      phone,
      contactPerson,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      geofenceRadius,
      zone,
    });

    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clients/:id
exports.update = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // Si nouvelles coordonnees fournies, reconstruire le champ location
    if (updates.longitude !== undefined && updates.latitude !== undefined) {
      updates.location = {
        type: 'Point',
        coordinates: [updates.longitude, updates.latitude],
      };
      delete updates.longitude;
      delete updates.latitude;
    }

    const client = await Client.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!client) return res.status(404).json({ message: 'Client introuvable' });
    res.json({ client });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/clients/:id - soft delete par defaut
exports.remove = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!client) return res.status(404).json({ message: 'Client introuvable' });
    res.json({ message: 'Client desactive' });
  } catch (error) {
    next(error);
  }
};

// GET /api/clients/near?lng=...&lat=...&maxDistance=500
// Cherche les clients proches d'un point - utile pour le geofencing cote serveur
exports.findNearby = async (req, res, next) => {
  try {
    const { lng, lat, maxDistance = 500 } = req.query;
    if (!lng || !lat) {
      return res.status(400).json({ message: 'lng et lat requis' });
    }

    const clients = await Client.find({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(maxDistance),
        },
      },
    });

    res.json({ clients });
  } catch (error) {
    next(error);
  }
};
