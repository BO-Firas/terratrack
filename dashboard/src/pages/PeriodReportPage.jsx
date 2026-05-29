import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { ArrowLeft, Printer, MapPin, Clock, Navigation, Target, AlertTriangle, Calendar } from 'lucide-react';

const typeLabels = {
  pharmacy: 'Pharmacie', hospital: 'Hopital', doctor: 'Medecin',
  store: 'Point de vente', other: 'Autre',
};
const statusLabels = {
  in_progress: 'En cours', completed: 'Terminee',
  too_short: 'Trop courte', too_long: 'Trop longue', cancelled: 'Annulee',
};

function todayStr() { return new Date().toISOString().split('T')[0]; }

function presets() {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];

  const weekStart = new Date(today);
  const dow = (weekStart.getDay() + 6) % 7; // monday = 0
  weekStart.setDate(weekStart.getDate() - dow);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const last30 = new Date(today); last30.setDate(last30.getDate() - 29);

  return {
    week: { label: 'Cette semaine', start: fmt(weekStart), end: fmt(today) },
    month: { label: 'Ce mois-ci', start: fmt(monthStart), end: fmt(today) },
    last30: { label: '30 derniers jours', start: fmt(last30), end: fmt(today) },
  };
}

export default function PeriodReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = presets();
  const [preset, setPreset] = useState('week');
  const [start, setStart] = useState(p.week.start);
  const [end, setEnd] = useState(p.week.end);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  function applyPreset(key) {
    setPreset(key);
    if (key === 'custom') return;
    const pr = presets()[key];
    setStart(pr.start); setEnd(pr.end);
  }

  useEffect(() => {
    setLoading(true);
    reportsAPI.period(id, start, end)
      .then((res) => setReport(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id, start, end]);

  if (loading) return <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">Chargement...</div>;
  if (!report) return <div className="h-full flex items-center justify-center text-[var(--color-danger)]">Rapport indisponible</div>;

  const { agent, summary, byDay, byType, byStatus } = report;
  const periodLabel = `${new Date(start).toLocaleDateString('fr-FR')} - ${new Date(end).toLocaleDateString('fr-FR')}`;

  return (
    <div className="h-full overflow-y-auto" id="report-root">
      <div className="px-7 py-4 flex items-center gap-4 no-print"
        style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)] flex-1">Rapport de periode</h1>
        <button onClick={() => window.print()} className="tt-button-primary flex items-center gap-2">
          <Printer size={16} /> Exporter PDF
        </button>
      </div>

      {/* Period selector */}
      <div className="px-7 py-3 no-print flex items-center gap-2 flex-wrap"
        style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
        {['week', 'month', 'last30', 'custom'].map((k) => (
          <button key={k} onClick={() => applyPreset(k)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              backgroundColor: preset === k ? 'var(--accent-primary-bg)' : 'var(--bg-base)',
              color: preset === k ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: `1px solid ${preset === k ? 'var(--accent-primary-border)' : 'var(--border-subtle)'}`,
            }}>
            {k === 'week' ? 'Cette semaine' : k === 'month' ? 'Ce mois-ci' : k === 'last30' ? '30 jours' : 'Personnalise'}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} max={end} className="tt-input" style={{ padding: '6px 10px' }} />
            <span className="text-[var(--text-tertiary)] text-xs">au</span>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} min={start} max={todayStr()} className="tt-input" style={{ padding: '6px 10px' }} />
          </>
        )}
      </div>

      <div className="p-7 space-y-6" id="report-content">
        <div className="tt-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{agent.fullName}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{agent.email} {agent.phone ? `· ${agent.phone}` : ''}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Zones : {agent.zones.join(', ') || '—'}</p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)]">Periode</div>
              <div className="text-base font-bold text-[var(--text-primary)]">{periodLabel}</div>
              <div className="text-xs text-[var(--text-tertiary)]">{report.period.days} jours</div>
            </div>
          </div>
        </div>

        {summary.target > 0 && (
          <div className="tt-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-[var(--accent-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Objectif vs Realise sur la periode</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(summary.targetPercent, 100)}%`, backgroundColor: summary.targetReached ? '#059669' : '#d97706' }} />
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  Objectif theorique : {summary.target}/jour x {report.period.days} jours = {summary.expectedTotal}
                </div>
              </div>
              <div className="text-sm font-bold whitespace-nowrap" style={{ color: summary.targetReached ? '#059669' : '#d97706' }}>
                {summary.completedVisits} / {summary.expectedTotal} ({summary.targetPercent}%)
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={MapPin} color="#059669" value={summary.completedVisits} label="Visites terminees" />
          <Stat icon={Calendar} color="#2563eb" value={summary.workingDays} label="Jours travailles" />
          <Stat icon={Clock} color="#d97706" value={`${summary.avgDurationMinutes} min`} label="Duree moyenne" />
          <Stat icon={Navigation} color="#7c3aed" value={`${summary.totalDistanceKm} km`} label="Distance parcourue" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={Clock} color="#0891b2" value={`${summary.totalVisitTimeHours} h`} label="Temps total en visite" />
          <Stat icon={MapPin} color="#059669" value={summary.avgVisitsPerWorkingDay} label="Visites/jour travaille" />
          <Stat icon={AlertTriangle} color="#dc2626" value={summary.alertsCount} label="Alertes" />
          <Stat icon={AlertTriangle} color="#d97706" value={summary.unconfirmedCount} label="Non confirmees" />
        </div>

        <div className="tt-card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Visites par jour sur la periode</h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">Activite journaliere</p>
          <PeriodBarChart data={byDay} color="#059669" target={summary.target} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="tt-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Repartition par type de client</h3>
            {byType.length === 0 ? <Empty /> : (
              <div className="space-y-3">
                {byType.map((t) => {
                  const total = byType.reduce((s, x) => s + x.count, 0);
                  const pct = Math.round((t.count / total) * 100);
                  return (
                    <div key={t.type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)]">{typeLabels[t.type] || t.type}</span>
                        <span className="text-[var(--text-tertiary)] font-mono">{t.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#059669' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="tt-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Repartition par statut</h3>
            {Object.keys(byStatus).length === 0 ? <Empty /> : (
              <div className="space-y-3">
                {Object.entries(byStatus).map(([s, c]) => {
                  const total = Object.values(byStatus).reduce((sum, x) => sum + x, 0);
                  const pct = Math.round((c / total) * 100);
                  const colors = { completed: '#059669', in_progress: '#2563eb', too_short: '#d97706', too_long: '#dc2626', cancelled: '#6b7280' };
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)]">{statusLabels[s] || s}</span>
                        <span className="text-[var(--text-tertiary)] font-mono">{c} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[s] || '#6b7280' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest pt-2">
          TerraTrack · Rapport de periode · genere le {new Date().toLocaleString('fr-FR')}
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

function Stat({ icon: Icon, color, value, label }) {
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

function Empty() { return <p className="text-xs text-[var(--text-tertiary)] italic py-6 text-center">Aucune donnee</p>; }

function PeriodBarChart({ data, color, target }) {
  const max = Math.max(...data.map((d) => d.count), target || 1, 1);
  const W = 100, H = 60;
  const showLabels = data.length <= 14;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + (showLabels ? 12 : 4)}`} style={{ width: '100%', height: data.length > 20 ? '200px' : '160px' }} preserveAspectRatio="none">
        {/* Target line */}
        {target > 0 && (
          <line x1="0" y1={H - (target / max) * H} x2={W} y2={H - (target / max) * H}
            stroke="#d97706" strokeWidth="0.3" strokeDasharray="1,1" />
        )}
        {data.map((d, i) => {
          const barW = (W / data.length) * 0.85;
          const x = (W / data.length) * i + ((W / data.length) - barW) / 2;
          const h = (d.count / max) * H;
          return <rect key={i} x={x} y={H - h} width={barW} height={h} rx="0.5" fill={color} opacity={d.count ? 0.85 : 0.15} />;
        })}
      </svg>
      {showLabels && (
        <div className="flex justify-between mt-1">
          {data.map((d, i) => (
            <div key={i} className="text-center" style={{ width: `${100 / data.length}%` }}>
              <div className="text-[9px] text-[var(--text-tertiary)]">
                {new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      )}
      {target > 0 && (
        <div className="text-[10px] mt-1" style={{ color: '#d97706' }}>--- Objectif : {target} visites/jour</div>
      )}
    </div>
  );
}
