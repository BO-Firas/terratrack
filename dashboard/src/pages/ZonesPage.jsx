import { useEffect, useState } from 'react';
import { zonesAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import { Map } from 'lucide-react';

export default function ZonesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    zonesAPI
      .list()
      .then((res) => setZones(res.data.zones))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Zones geographiques"
        subtitle={`${zones.length} zone${zones.length > 1 ? 's' : ''} definie${zones.length > 1 ? 's' : ''}`}
      />

      <div className="p-7">
        {loading ? (
          <div className="text-center text-[var(--text-tertiary)] py-12">
            Chargement...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone._id} className="tt-card tt-card-hover p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${zone.color}22`,
                      border: `1px solid ${zone.color}44`,
                    }}
                  >
                    <Map style={{ color: zone.color }} size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {zone.name}
                    </h3>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                      {zone.type}
                    </span>
                  </div>
                </div>
                {zone.description && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {zone.description}
                  </p>
                )}
                <div
                  className="mt-4 pt-4 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-mono"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >
                  {zone.area.coordinates[0].length} points
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
