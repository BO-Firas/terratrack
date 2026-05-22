const Client = require('../models/Client');
const Visit = require('../models/Visit');
const Zone = require('../models/Zone');
const Alert = require('../models/Alert');

// Distance entre deux points GPS (formule haversine, en metres)
function haversineDistance(coords1, coords2) {
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;
  const R = 6371000; // rayon de la Terre en metres
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Logique principale du geofencing automatique avec gestion du chevauchement.
 *
 * Pour une nouvelle position :
 *  - 0 client dans le rayon  -> aucune visite
 *  - 1 client dans le rayon  -> visite auto, confirmee
 *  - 2+ clients (chevauchement) -> visite auto sur le PLUS PROCHE,
 *       marquee "non confirmee", avec la liste des candidats. L'app mobile
 *       demandera a l'agent de confirmer/corriger.
 *
 * @returns { entered: [Visit], exited: [Visit], needsSelection: {visit, candidates}|null }
 */
async function processGeofencing(agentId, coordinates) {
  const result = { entered: [], exited: [], needsSelection: null };
  const [lng, lat] = coordinates;

  // 1. Trouver les clients proches (200m large pour couvrir les geofences max)
  const nearbyClients = await Client.find({
    isActive: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: 200,
      },
    },
  });

  // 2. Determiner les clients dont le geofence CONTIENT reellement le point
  const clientsInside = [];
  for (const client of nearbyClients) {
    const distance = haversineDistance(coordinates, client.location.coordinates);
    if (distance <= client.geofenceRadius) {
      clientsInside.push({ client, distance });
    }
  }
  // Trier par distance croissante (le plus proche en premier)
  clientsInside.sort((a, b) => a.distance - b.distance);

  // 3. Visites en cours pour cet agent
  const ongoingVisits = await Visit.find({ agent: agentId, status: 'in_progress' });
  const ongoingClientIds = new Set(ongoingVisits.map((v) => String(v.client)));

  // 4. ENTREE : s'il y a au moins un client dans le rayon et aucune visite
  //    deja ouverte pour le client le plus proche
  if (clientsInside.length > 0) {
    const closest = clientsInside[0];
    const closestId = String(closest.client._id);

    if (!ongoingClientIds.has(closestId)) {
      const overlap = clientsInside.length > 1;

      const visit = await Visit.create({
        agent: agentId,
        client: closest.client._id,
        enteredAt: new Date(),
        entryLocation: { type: 'Point', coordinates },
        status: 'in_progress',
        isConfirmed: !overlap, // confirme seulement s'il n'y a pas de chevauchement
        candidateClients: overlap ? clientsInside.map((c) => c.client._id) : [],
      });
      result.entered.push(visit);

      // Si chevauchement -> demander a l'agent de choisir
      if (overlap) {
        result.needsSelection = {
          visitId: visit._id,
          candidates: clientsInside.map((c) => ({
            _id: c.client._id,
            name: c.client.name,
            type: c.client.type,
            address: c.client.address,
            distance: Math.round(c.distance),
          })),
        };
      }
    }
  }

  // 5. SORTIE : fermer les visites dont l'agent n'est plus dans le rayon
  const insideIds = new Set(clientsInside.map((c) => String(c.client._id)));
  for (const visit of ongoingVisits) {
    if (!insideIds.has(String(visit.client))) {
      await visit.endVisit(coordinates);

      const fullClient = await Client.findById(visit.client);
      if (fullClient) {
        const minSec = (fullClient.expectedVisitDuration?.min || 5) * 60;
        const maxSec = (fullClient.expectedVisitDuration?.max || 60) * 60;

        if (visit.durationSeconds < minSec) {
          visit.status = 'too_short';
          await visit.save();
          await Alert.create({
            agent: agentId,
            type: 'visit_too_short',
            severity: 'warning',
            message: `Visite trop courte chez ${fullClient.name} (${visit.durationSeconds}s)`,
            metadata: { visitId: visit._id, clientId: fullClient._id },
            location: { type: 'Point', coordinates },
          });
        } else if (visit.durationSeconds > maxSec) {
          visit.status = 'too_long';
          await visit.save();
          await Alert.create({
            agent: agentId,
            type: 'visit_too_long',
            severity: 'info',
            message: `Visite anormalement longue chez ${fullClient.name}`,
            metadata: { visitId: visit._id, clientId: fullClient._id },
            location: { type: 'Point', coordinates },
          });
        }
      }
      result.exited.push(visit);
    }
  }

  return result;
}

/**
 * Verifie si l'agent est dans une de ses zones autorisees.
 * Genere une alerte de sortie de zone si necessaire.
 */
async function checkAuthorizedZone(agent, coordinates) {
  if (!agent.assignedZones || agent.assignedZones.length === 0) {
    return { inAuthorizedZone: true, alert: null };
  }

  const [lng, lat] = coordinates;
  const matchingZone = await Zone.findOne({
    _id: { $in: agent.assignedZones },
    isActive: true,
    area: {
      $geoIntersects: { $geometry: { type: 'Point', coordinates: [lng, lat] } },
    },
  });

  if (matchingZone) return { inAuthorizedZone: true, alert: null };

  const recentAlert = await Alert.findOne({
    agent: agent._id,
    type: 'out_of_zone',
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  });
  if (recentAlert) return { inAuthorizedZone: false, alert: null };

  const alert = await Alert.create({
    agent: agent._id,
    type: 'out_of_zone',
    severity: 'warning',
    message: `${agent.fullName} est sorti de sa zone autorisee`,
    location: { type: 'Point', coordinates },
  });

  return { inAuthorizedZone: false, alert };
}

module.exports = { haversineDistance, processGeofencing, checkAuthorizedZone };
