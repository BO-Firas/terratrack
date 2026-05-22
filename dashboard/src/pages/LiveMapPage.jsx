import { useEffect, useRef, useState } from 'react';
import { agentsAPI, clientsAPI, zonesAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { Radio, Users, Building2, Map as MapIcon } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Loader singleton
let googleMapsPromise = null;
function loadGoogleMaps() {
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Echec chargement Google Maps'));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

const clientTypeColors = {
  pharmacy: '#10b981',
  hospital: '#ef4444',
  doctor: '#f59e0b',
  store: '#8b5cf6',
  other: '#6b7280',
};

// Style dark mode Google Maps - design custom inspire des cartes pro
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f4f6f9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f4f6f9' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcfce7' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#16a34a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fef9c3' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#fde68a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#a16207' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bae6fd' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0284c7' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
];


export default function LiveMapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const agentMarkersRef = useRef({});
  const [recentEvents, setRecentEvents] = useState([]);
  const [stats, setStats] = useState({ agents: 0, clients: 0, zones: 0 });
  const [error, setError] = useState(null);

  // ============ MONTAGE ============
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapContainerRef.current) return;

        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: 33.8881, lng: 10.0982 }, // Gabes Centre
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM,
          },
          styles: darkMapStyle,
          backgroundColor: '#f4f6f9',
        });
        mapRef.current = map;

        return Promise.all([
          agentsAPI.getLive(),
          clientsAPI.list(),
          zonesAPI.list(),
        ]).then(([agentsRes, clientsRes, zonesRes]) => {
          const agents = agentsRes.data.agents;
          const clients = clientsRes.data.clients;
          const zones = zonesRes.data.zones;

          setStats({
            agents: agents.length,
            clients: clients.length,
            zones: zones.length,
          });

          const bounds = new google.maps.LatLngBounds();

          // Zones
          zones.forEach((zone) => {
            const path = zone.area.coordinates[0].map(([lng, lat]) => ({
              lat,
              lng,
            }));
            new google.maps.Polygon({
              paths: path,
              strokeColor: zone.color || '#3b82f6',
              strokeOpacity: 0.7,
              strokeWeight: 2,
              fillColor: zone.color || '#3b82f6',
              fillOpacity: 0.08,
              map,
            });
            path.forEach((p) => bounds.extend(p));
          });

          // Clients + geofences
          clients.forEach((client) => {
            if (!client.location?.coordinates) return;
            const [lng, lat] = client.location.coordinates;
            const position = { lat, lng };
            bounds.extend(position);

            new google.maps.Circle({
              center: position,
              radius: client.geofenceRadius || 50,
              strokeColor: '#ef4444',
              strokeOpacity: 0.5,
              strokeWeight: 1,
              fillColor: '#ef4444',
              fillOpacity: 0.08,
              map,
            });

            const color = clientTypeColors[client.type] || clientTypeColors.other;
            const marker = new google.maps.Marker({
              position,
              map,
              title: client.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding:6px;font-family:Manrope,sans-serif;color:#f8fafc;background:transparent;min-width:180px">
                  <div style="font-weight:600;font-size:13px;margin-bottom:4px">${client.name}</div>
                  <div style="font-size:11px;color:#94a3b8;text-transform:capitalize">${client.type}</div>
                  <div style="font-size:11px;color:#94a3b8">${client.address || ''}</div>
                  <div style="font-size:10px;color:#64748b;margin-top:4px">Geofence : ${client.geofenceRadius}m</div>
                </div>
              `,
            });
            marker.addListener('click', () => infoWindow.open(map, marker));
          });

          // Agents
          agents.forEach((agent) => {
            if (!agent.lastKnownLocation?.coordinates) return;
            const [lng, lat] = agent.lastKnownLocation.coordinates;
            bounds.extend({ lat, lng });
            agentMarkersRef.current[agent._id] = createAgentMarker(
              google,
              map,
              agent,
              { lat, lng }
            );
          });

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, 60);
          }
        });
      })
      .catch((err) => {
        console.error('[Map] Erreur:', err);
        setError(err.message);
      });

    return () => {
      cancelled = true;
      Object.values(agentMarkersRef.current).forEach((m) => m.setMap(null));
      agentMarkersRef.current = {};
    };
  }, []);

  // ============ SOCKET.IO ============
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleAgentLocation(data) {
      const { agentId, agentName, longitude, latitude } = data;
      const google = window.google;
      const map = mapRef.current;
      if (!google || !map) return;

      const position = { lat: latitude, lng: longitude };
      const existing = agentMarkersRef.current[agentId];
      if (existing) {
        existing.setPosition(position);
      } else {
        agentMarkersRef.current[agentId] = createAgentMarker(
          google,
          map,
          { _id: agentId, fullName: agentName },
          position
        );
        setStats((s) => ({ ...s, agents: s.agents + 1 }));
      }
    }

    function handleAgentVisit(data) {
      const { visit, action } = data;
      const event = {
        id: `${visit._id}-${action}-${Date.now()}`,
        agentName: 'Agent',
        clientName: visit.client?.name || '?',
        action,
        time: new Date(),
      };
      setRecentEvents((prev) => [event, ...prev].slice(0, 20));
    }

    function handleAgentAlert(data) {
      const { alert } = data;
      const event = {
        id: `alert-${alert._id}-${Date.now()}`,
        agentName: 'Alerte',
        clientName: alert.message,
        action: 'alert',
        time: new Date(),
      };
      setRecentEvents((prev) => [event, ...prev].slice(0, 20));
    }

    socket.on('agent:location', handleAgentLocation);
    socket.on('agent:visit', handleAgentVisit);
    socket.on('agent:alert', handleAgentAlert);

    return () => {
      socket.off('agent:location', handleAgentLocation);
      socket.off('agent:visit', handleAgentVisit);
      socket.off('agent:alert', handleAgentAlert);
    };
  }, []);

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      {/* Carte */}
      <div
        className="flex-1 relative"
        style={{ minWidth: 0, minHeight: 0, backgroundColor: '#f4f6f9' }}
      >
        <div
          ref={mapContainerRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="tt-card p-6 max-w-md">
              <h3 className="font-bold text-[var(--color-danger)] mb-2">
                Erreur de chargement
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            </div>
          </div>
        )}

        {/* Legende */}
        <div
          className="absolute top-4 right-4 tt-card p-4 text-xs space-y-2 z-10"
          style={{ backdropFilter: 'blur(8px)', minWidth: '180px' }}
        >
          <div className="font-semibold text-[var(--text-primary)] mb-2 text-[10px] uppercase tracking-widest">
            Legende
          </div>
          <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
            <span
              className="w-3 h-3 rounded-full pulse-dot"
              style={{
                backgroundColor: 'var(--accent-primary)',
                border: '2px solid #052e1c',
              }}
            ></span>
            Agent terrain
          </div>
          <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
            Pharmacie
          </div>
          <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
            <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></span>
            Hopital
          </div>
          <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
            <span className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white"></span>
            Medecin
          </div>
        </div>

        {/* Stats overlay sur la carte (en bas a gauche, au-dessus du zoom) */}
        <div
          className="absolute top-4 left-4 tt-card px-4 py-3 z-10"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] pulse-dot" />
            <div className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
              Live · Gabes
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {stats.agents}{' '}
            <span className="text-base font-normal text-[var(--text-secondary)]">
              agent{stats.agents > 1 ? 's' : ''} actif{stats.agents > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Panneau lateral droit */}
      <aside
        className="w-80 flex-shrink-0 flex flex-col"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        <div
          className="p-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Radio
              className="text-[var(--accent-primary)] pulse-dot"
              size={16}
            />
            <h2 className="font-semibold text-sm tracking-tight">
              Activite temps reel
            </h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <StatBlock icon={Users} value={stats.agents} label="Agents" />
            <StatBlock icon={Building2} value={stats.clients} label="Clients" />
            <StatBlock icon={MapIcon} value={stats.zones} label="Zones" />
          </div>
        </div>

        {/* Flux d'evenements */}
        <div className="flex-1 overflow-y-auto p-5">
          <h3
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Evenements recents
          </h3>
          {recentEvents.length === 0 ? (
            <div className="py-12 text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-overlay)' }}
              >
                <Radio size={16} className="text-[var(--text-tertiary)]" />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] italic">
                En attente d'evenements...
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentEvents.map((event) => (
                <li
                  key={event.id}
                  className="p-3 rounded-lg fade-in"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    border: `1px solid ${event.action === 'alert'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : event.action === 'entered'
                          ? 'rgba(16, 185, 129, 0.3)'
                          : 'var(--border-subtle)'
                      }`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          event.action === 'alert'
                            ? 'var(--color-danger)'
                            : event.action === 'entered'
                              ? 'var(--color-success)'
                              : 'var(--text-tertiary)',
                      }}
                    />
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {event.agentName}
                    </span>
                    <span className="ml-auto text-[10px] font-mono text-[var(--text-tertiary)]">
                      {event.time.toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] pl-3.5">
                    {event.action === 'entered' && '→ Entree chez '}
                    {event.action === 'exited' && '← Sortie de '}
                    {event.clientName}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

// =========== Sous-composants ===========

function StatBlock({ icon: Icon, value, label }) {
  return (
    <div
      className="p-2.5 rounded-lg"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <Icon size={13} className="text-[var(--text-tertiary)] mb-1" />
      <div className="text-lg font-bold tracking-tight text-[var(--text-primary)] leading-none">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1">
        {label}
      </div>
    </div>
  );
}

function createAgentMarker(google, map, agent, position) {
  const initial = agent.fullName?.charAt(0) || '?';
  const svgIcon = {
    url:
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="#10b981" opacity="0.15"/>
        <circle cx="24" cy="24" r="16" fill="#10b981" stroke="#ffffff" stroke-width="3"/>
        <text x="24" y="30" text-anchor="middle" fill="white" font-family="Manrope,sans-serif" font-size="14" font-weight="700">${initial}</text>
      </svg>
    `),
    scaledSize: new google.maps.Size(48, 48),
    anchor: new google.maps.Point(24, 24),
  };

  const marker = new google.maps.Marker({
    position,
    map,
    title: agent.fullName,
    icon: svgIcon,
    zIndex: 1000,
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `<div style="padding:6px;font-family:Manrope,sans-serif;color:#f8fafc"><strong>${agent.fullName}</strong></div>`,
  });
  marker.addListener('click', () => infoWindow.open(map, marker));
  return marker;
}
