import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  statsAPI, agentsAPI, alertsAPI, visitsAPI, clientsAPI, zonesAPI,
} from '../services/api';
import PageHeader from '../components/PageHeader';
import {
  Users, MapPin, Building2, Map as MapIcon, Bell, AlertTriangle,
  CheckCircle, Activity, TrendingUp, ChevronRight,
} from 'lucide-react';

const severityColors = {
  critical: '#dc2626', warning: '#d97706', info: '#2563eb',
};

const alertTypeLabels = {
  out_of_zone: 'Hors zone',
  visit_too_short: 'Visite trop courte',
  visit_too_long: 'Visite trop longue',
  agent_inactive: 'Agent inactif',
  no_activity_today: 'Aucune activite',
};

export default function OverviewPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsAPI.overview(),
      agentsAPI.list(),
      alertsAPI.list(),
      visitsAPI.list({ date: new Date().toISOString().split('T')[0] }),
      clientsAPI.list(),
      zonesAPI.list(),
    ])
      .then(([sRes, aRes, alRes, vRes, cRes, zRes]) => {
        setData({
          overview: sRes.data,
          agents: aRes.data.agents || [],
          alerts: (alRes.data.alerts || []).filter((a) => !a.isResolved).slice(0, 5),
          todayVisits: vRes.data.visits || [],
          clientsCount: (cRes.data.clients || []).length,
          zonesCount: (zRes.data.zones || []).length,
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <PageHeader title="Vue d'ensemble" subtitle="Tableau de bord" />
        <div className="p-7">
          <SkeletonGrid />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState message="Impossible de charger les donnees" />
      </div>
    );
  }

  const { overview, agents, alerts, todayVisits, clientsCount, zonesCount } = data;
  const recentVisits = todayVisits.slice(0, 6);

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Vue d'ensemble" subtitle="Tableau de bord operationnel" />

      <div className="p-7 space-y-6">
        {/* KPI principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={Users} color="#059669"
            value={overview.activeAgents}
            total={overview.totalAgents}
            label="Agents actifs"
            onClick={() => navigate('/agents')}
          />
          <KpiCard
            icon={CheckCircle} color="#2563eb"
            value={overview.todayVisits}
            label="Visites aujourd'hui"
            onClick={() => navigate('/visits')}
          />
          <KpiCard
            icon={AlertTriangle} color="#dc2626"
            value={overview.activeAlerts}
            label="Alertes ouvertes"
            highlight={overview.activeAlerts > 0}
            onClick={() => navigate('/alerts')}
          />
          <KpiCard
            icon={Activity} color="#d97706"
            value={overview.unconfirmedVisits}
            label="Non confirmees"
            highlight={overview.unconfirmedVisits > 0}
            onClick={() => navigate('/visits')}
          />
        </div>

        {/* KPI secondaires */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard icon={Building2} color="#7c3aed" value={clientsCount} label="Clients" onClick={() => navigate('/clients')} />
          <KpiCard icon={MapIcon} color="#0891b2" value={zonesCount} label="Zones" onClick={() => navigate('/zones')} />
          <KpiCard icon={MapPin} color="#059669" value="Live" label="Carte temps reel" onClick={() => navigate('/map')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertes recentes */}
          <div className="tt-card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[var(--color-danger)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Alertes recentes</h3>
              </div>
              <button onClick={() => navigate('/alerts')} className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1">
                Tout voir <ChevronRight size={12} />
              </button>
            </div>
            {alerts.length === 0 ? (
              <EmptyState compact message="Aucune alerte non resolue" icon={CheckCircle} positive />
            ) : (
              <ul>
                {alerts.map((a, i) => (
                  <li key={a._id} className="px-5 py-3 flex items-center gap-3"
                    style={{ borderBottom: i < alerts.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <span className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: severityColors[a.severity] || '#6b7280' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {alertTypeLabels[a.type] || a.type}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                        {a.agent?.fullName || 'Agent'} · {new Date(a.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activite recente du jour */}
          <div className="tt-card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--accent-primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Activite recente</h3>
              </div>
              <button onClick={() => navigate('/visits')} className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1">
                Tout voir <ChevronRight size={12} />
              </button>
            </div>
            {recentVisits.length === 0 ? (
              <EmptyState compact message="Aucune visite aujourd'hui" />
            ) : (
              <ul>
                {recentVisits.map((v, i) => (
                  <li key={v._id} className="px-5 py-3 flex items-center gap-3"
                    style={{ borderBottom: i < recentVisits.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--accent-primary-bg)' }}>
                      <MapPin size={14} className="text-[var(--accent-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate">{v.client?.name || 'Client'}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                        {v.agent?.fullName || 'Agent'} · {new Date(v.enteredAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {v.durationSeconds ? ` · ${Math.round(v.durationSeconds / 60)} min` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Liste agents (vue rapide) */}
        <div className="tt-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[var(--accent-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Agents</h3>
            </div>
            <button onClick={() => navigate('/agents')} className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1">
              Tout voir <ChevronRight size={12} />
            </button>
          </div>
          {agents.length === 0 ? (
            <EmptyState compact message="Aucun agent enregistre" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {agents.slice(0, 8).map((a, i) => (
                <button key={a._id} onClick={() => navigate(`/agents/${a._id}`)}
                  className="text-left px-5 py-4 hover:bg-[var(--bg-hover)] transition flex items-center gap-3"
                  style={{ borderRight: (i + 1) % 4 !== 0 ? '1px solid var(--border-subtle)' : 'none',
                           borderBottom: i < agents.length - 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--accent-primary), #34d399)', color: '#fff' }}>
                    {a.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--text-primary)] truncate">{a.fullName}</div>
                    <div className="text-[11px] flex items-center gap-1.5 text-[var(--text-tertiary)]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.isActive ? 'var(--color-success)' : 'var(--text-tertiary)' }} />
                      {a.isActive ? 'Actif' : 'Inactif'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, color, value, total, label, highlight, onClick }) {
  return (
    <button onClick={onClick}
      className="tt-card tt-card-hover p-5 text-left transition"
      style={highlight ? { borderColor: `${color}66` } : {}}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}1a` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-none">
        {value}
        {total != null && <span className="text-sm text-[var(--text-tertiary)] font-normal"> / {total}</span>}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-2 font-semibold">{label}</div>
    </button>
  );
}

function EmptyState({ message, icon: Icon = AlertTriangle, positive, compact }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-5' : 'py-12 px-5'}`}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: positive ? 'rgba(5,150,105,0.1)' : 'var(--bg-base)' }}>
        <Icon size={18} style={{ color: positive ? '#059669' : 'var(--text-tertiary)' }} />
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">{message}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard tall /><SkeletonCard tall />
      </div>
    </div>
  );
}

function SkeletonCard({ tall }) {
  return (
    <div className="tt-card p-5" style={{ minHeight: tall ? '300px' : '120px' }}>
      <div className="w-10 h-10 rounded-lg mb-3 shimmer" />
      <div className="h-6 w-16 rounded mb-2 shimmer" />
      <div className="h-3 w-24 rounded shimmer" />
      <style>{`
        .shimmer {
          background: linear-gradient(90deg, var(--bg-base) 0%, var(--bg-hover) 50%, var(--bg-base) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}
