import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { ArrowLeft, Printer, MapPin, Clock, Navigation, AlertTriangle, Target } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let gmPromise = null;
function loadGoogleMaps() {
  if (gmPromise) return gmPromise;
  gmPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly`;
    s.async = true; s.defer = true;
    s.onload = () => resolve(window.google);
    s.onerror = () => reject(new Error('Maps error'));
    document.head.appendChild(s);
  });
  return gmPromise;
}

function fmtDur(sec) {
  if (!sec) return '-';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function fmtTime(d) { return d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'; }

export default function DailyReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    reportsAPI.daily(id, date)
      .then((res) => setReport(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id, date]);

  // Dessiner le parcours sur la carte
  useEffect(() => {
    if (!report?.routePoints?.length) return;
    loadGoogleMaps().then((google) => {
      if (!mapRef.current) return;
      const path = report.routePoints.map((p) => ({ lat: p.lat, lng: p.lng }));
      const map = new google.maps.Map(mapRef.current, {
        center: path[Math.floor(path.length / 2)] || { lat: 33.8881, lng: 10.0982 },
        zoom: 14, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      });
      new google.maps.Polyline({
        path, map, strokeColor: '#059669', strokeOpacity: 0.85, strokeWeight: 3,
      });
      // Marqueurs depart / arrivee
      if (path.length) {
        new google.maps.Marker({ position: path[0], map, label: { text: 'D', color: '#fff' },
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 } });
        new google.maps.Marker({ position: path[path.length - 1], map, label: { text: 'A', color: '#fff' },
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#dc2626', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 } });
      }
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      if (!bounds.isEmpty()) map.fitBounds(bounds, 40);
    });
  }, [report]);

  if (loading) return <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">Chargement...</div>;
  if (!report) return <div className="h-full flex items-center justify-center text-[var(--color-danger)]">Rapport indisponible</div>;

  const { agent, summary, visits, alerts } = report;

  return (
    <div className="h-full overflow-y-auto" id="report-root">
      {/* Barre d'actions (cachee a l'impression) */}
      <div className="px-7 py-4 flex items-center gap-4 no-print"
        style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)] flex-1">Rapport journalier</h1>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="tt-input" style={{ padding: '8px 12px' }} />
        <button onClick={() => window.print()} className="tt-button-primary flex items-center gap-2">
          <Printer size={16} /> Exporter PDF
        </button>
      </div>

      <div className="p-7 space-y-6" id="report-content">
        {/* En-tete du rapport */}
        <div className="tt-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{agent.fullName}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{agent.email} {agent.phone ? `· ${agent.phone}` : ''}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Zones : {agent.zones.join(', ') || '—'}</p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)]">Date du rapport</div>
              <div className="text-lg font-bold text-[var(--text-primary)]">{new Date(report.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Objectif vs realise */}
        {summary.target > 0 && (
          <div className="tt-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-[var(--accent-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Objectif vs Realise</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(summary.targetPercent, 100)}%`, backgroundColor: summary.targetReached ? '#059669' : '#d97706' }} />
                </div>
              </div>
              <div className="text-sm font-bold" style={{ color: summary.targetReached ? '#059669' : '#d97706' }}>
                {summary.completedVisits} / {summary.target} ({summary.targetPercent}%)
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportStat icon={MapPin} color="#059669" value={summary.completedVisits} label="Visites" />
          <ReportStat icon={Clock} color="#2563eb" value={`${summary.totalVisitTimeMinutes} min`} label="Temps en visite" />
          <ReportStat icon={Navigation} color="#d97706" value={`${summary.totalTravelTimeMinutes} min`} label="Temps de trajet" />
          <ReportStat icon={Navigation} color="#7c3aed" value={`${summary.totalDistanceKm} km`} label="Distance parcourue" />
        </div>

        {/* Carte du parcours */}
        <div className="tt-card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Carte du parcours journalier</h3>
          {report.routePoints?.length ? (
            <div ref={mapRef} style={{ width: '100%', height: '320px', borderRadius: '10px' }} />
          ) : (
            <p className="text-xs text-[var(--text-tertiary)] italic py-8 text-center">Aucun deplacement enregistre ce jour</p>
          )}
        </div>

        {/* Liste des visites avec temps de trajet */}
        <div className="tt-card overflow-hidden">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Detail des visites</h3>
          </div>
          {visits.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] italic py-8 text-center">Aucune visite</p>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-base)' }}>
                <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  <th className="px-4 py-2 font-semibold">Client</th>
                  <th className="px-4 py-2 font-semibold">Entree</th>
                  <th className="px-4 py-2 font-semibold">Sortie</th>
                  <th className="px-4 py-2 font-semibold">Duree</th>
                  <th className="px-4 py-2 font-semibold">Trajet depuis precedent</th>
                  <th className="px-4 py-2 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v, i) => (
                  <tr key={v._id} className="text-sm" style={{ borderBottom: i < visits.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                      {v.clientName}{!v.isConfirmed && <span className="ml-1 text-[10px] text-[var(--color-warning)]">(non confirmee)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-xs">{fmtTime(v.enteredAt)}</td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-xs">{fmtTime(v.leftAt)}</td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-xs">{fmtDur(v.durationSeconds)}</td>
                    <td className="px-4 py-2.5 text-[var(--text-tertiary)] text-xs">
                      {v.travelFromPrevSeconds != null ? `${fmtDur(v.travelFromPrevSeconds)}${v.travelFromPrevMeters != null ? ` · ${v.travelFromPrevMeters}m` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Alertes du jour */}
        <div className="tt-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-[var(--color-warning)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Alertes de la journee ({alerts.length})</h3>
          </div>
          {alerts.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] italic">Aucune alerte</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li key={i} className="text-xs flex items-center gap-2 text-[var(--text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.severity === 'critical' ? '#dc2626' : a.severity === 'warning' ? '#d97706' : '#2563eb' }} />
                  <span className="font-mono text-[var(--text-tertiary)]">{fmtTime(a.createdAt)}</span>
                  {a.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-center text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest pt-2">
          TerraTrack · Rapport genere le {new Date().toLocaleString('fr-FR')}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          #report-root { overflow: visible !important; height: auto !important; }
          body, #root { background: white !important; }
        }
      `}</style>
    </div>
  );
}

function ReportStat({ icon: Icon, color, value, label }) {
  return (
    <div className="tt-card p-4">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${color}1a` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="text-xl font-bold text-[var(--text-primary)] leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1.5">{label}</div>
    </div>
  );
}
