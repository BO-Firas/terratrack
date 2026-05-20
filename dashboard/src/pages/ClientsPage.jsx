import { useEffect, useState } from 'react';
import { clientsAPI } from '../services/api';
import PageHeader from '../components/PageHeader';

const typeLabels = {
  pharmacy: { label: 'Pharmacie', color: '#10b981' },
  hospital: { label: 'Hopital', color: '#ef4444' },
  doctor: { label: 'Medecin', color: '#f59e0b' },
  store: { label: 'Point de vente', color: '#8b5cf6' },
  other: { label: 'Autre', color: '#6b7280' },
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    clientsAPI
      .list()
      .then((res) => setClients(res.data.clients))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === 'all' ? clients : clients.filter((c) => c.type === filter);

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients • Gabes`}
      />

      <div className="p-7">
        {/* Filtres */}
        <div className="mb-5 flex flex-wrap gap-2">
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label={`Tous (${clients.length})`}
          />
          {Object.entries(typeLabels).map(([key, { label, color }]) => {
            const count = clients.filter((c) => c.type === key).length;
            if (count === 0) return null;
            return (
              <FilterChip
                key={key}
                active={filter === key}
                onClick={() => setFilter(key)}
                label={`${label} (${count})`}
                color={color}
              />
            );
          })}
        </div>

        {loading ? (
          <div className="text-center text-[var(--text-tertiary)] py-12">
            Chargement...
          </div>
        ) : (
          <div className="tt-card overflow-hidden">
            <table className="w-full">
              <thead
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Adresse</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Geofence</th>
                  <th className="px-4 py-3 font-semibold">Zone</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => {
                  const typeInfo = typeLabels[client.type] || typeLabels.other;
                  return (
                    <tr
                      key={client._id}
                      className="text-sm hover:bg-[var(--bg-overlay)] transition"
                      style={{
                        borderBottom:
                          i < filtered.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {client.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider"
                          style={{
                            backgroundColor: `${typeInfo.color}22`,
                            color: typeInfo.color,
                            border: `1px solid ${typeInfo.color}44`,
                          }}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                        {client.address || '-'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                        {client.contactPerson || client.phone || '-'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs">
                        {client.geofenceRadius}m
                      </td>
                      <td className="px-4 py-3">
                        {client.zone && (
                          <span
                            className="text-[10px] px-2 py-1 rounded-md font-medium"
                            style={{
                              backgroundColor: `${client.zone.color}22`,
                              color: client.zone.color,
                              border: `1px solid ${client.zone.color}44`,
                            }}
                          >
                            {client.zone.name}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center text-[var(--text-tertiary)] py-12">
                Aucun client trouve
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        backgroundColor: active
          ? color
            ? `${color}33`
            : 'var(--accent-primary-bg)'
          : 'var(--bg-elevated)',
        color: active
          ? color || 'var(--accent-primary)'
          : 'var(--text-secondary)',
        border: `1px solid ${
          active
            ? color
              ? `${color}66`
              : 'var(--accent-primary-border)'
            : 'var(--border-subtle)'
        }`,
      }}
    >
      {label}
    </button>
  );
}
