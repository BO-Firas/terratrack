import { useEffect, useRef, useState } from 'react';
import { zonesAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import { Plus, Pencil, Trash2, X, Map as MapIcon, Undo2, Eraser } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let googleMapsPromise = null;
function loadGoogleMaps() {
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&v=weekly`;
    script.async = true; script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Echec chargement Google Maps'));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

const zoneTypes = {
  governorate: 'Gouvernorat', city: 'Ville', sector: 'Secteur',
  medical_region: 'Region medicale', custom: 'Personnalisee',
};
const colorChoices = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const emptyForm = { name: '', description: '', type: 'sector', color: '#2563eb', coordinates: [] };

export default function ZonesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    zonesAPI.list()
      .then((res) => setZones(res.data.zones))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null); setForm(emptyForm); setError(''); setModalOpen(true);
  }
  function openEdit(zone) {
    setEditingId(zone._id);
    // coordinates[0] = anneau exterieur, retirer le dernier point (= 1er, fermeture)
    const ring = zone.area.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }));
    setForm({
      name: zone.name, description: zone.description || '',
      type: zone.type || 'sector', color: zone.color || '#2563eb', coordinates: ring,
    });
    setError(''); setModalOpen(true);
  }

  async function handleSubmit() {
    setError('');
    if (!form.name) { setError('Le nom est obligatoire.'); return; }
    if (form.coordinates.length < 3) { setError('Dessinez au moins 3 points sur la carte pour former la zone.'); return; }
    setSaving(true);

    // Fermer le polygone : repeter le 1er point a la fin (exigence GeoJSON)
    const ring = form.coordinates.map((p) => [p.lng, p.lat]);
    ring.push(ring[0]);

    const payload = {
      name: form.name, description: form.description, type: form.type, color: form.color,
      area: { type: 'Polygon', coordinates: [ring] },
    };
    try {
      if (editingId) await zonesAPI.update(editingId, payload);
      else await zonesAPI.create(payload);
      setModalOpen(false); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally { setSaving(false); }
  }

  async function handleDelete(zone) {
    if (!window.confirm(`Supprimer la zone "${zone.name}" ?`)) return;
    try { await zonesAPI.remove(zone._id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  }

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Zones geographiques" subtitle={`${zones.length} zone(s) • Administration`}>
        <button onClick={openCreate} className="tt-button-primary flex items-center gap-2">
          <Plus size={16} /> Ajouter une zone
        </button>
      </PageHeader>

      <div className="p-7">
        {loading ? (
          <div className="text-center text-[var(--text-tertiary)] py-12">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone._id} className="tt-card tt-card-hover p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${zone.color}1a`, border: `1px solid ${zone.color}40` }}>
                    <MapIcon style={{ color: zone.color }} size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)]">{zone.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">{zoneTypes[zone.type] || zone.type}</span>
                  </div>
                  <div className="flex gap-1">
                    <IconBtn title="Modifier" onClick={() => openEdit(zone)}><Pencil size={14} /></IconBtn>
                    <IconBtn title="Supprimer" danger onClick={() => handleDelete(zone)}><Trash2 size={14} /></IconBtn>
                  </div>
                </div>
                {zone.description && <p className="text-xs text-[var(--text-secondary)]">{zone.description}</p>}
                <div className="mt-4 pt-4 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-mono"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {zone.area.coordinates[0].length - 1} points
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <ZoneModal form={form} setForm={setForm} error={error} saving={saving}
          editingId={editingId} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} />
      )}
    </div>
  );
}

function ZoneModal({ form, setForm, error, saving, editingId, onClose, onSubmit }) {
  const mapRef = useRef(null);
  const polyRef = useRef(null);
  const markersRef = useRef([]);

  function redraw(google, map, coords) {
    // nettoyer
    if (polyRef.current) polyRef.current.setMap(null);
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    polyRef.current = new google.maps.Polygon({
      paths: coords, map,
      strokeColor: form.color, strokeOpacity: 0.8, strokeWeight: 2,
      fillColor: form.color, fillOpacity: 0.12,
    });
    coords.forEach((c, idx) => {
      const m = new google.maps.Marker({
        position: c, map,
        label: { text: String(idx + 1), color: '#fff', fontSize: '10px' },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: form.color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      });
      markersRef.current.push(m);
    });
  }

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((google) => {
      if (cancelled || !mapRef.current) return;
      const center = form.coordinates[0] || { lat: 33.8881, lng: 10.0982 };
      const map = new google.maps.Map(mapRef.current, {
        center, zoom: 13, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      });
      if (form.coordinates.length) redraw(google, map, form.coordinates);

      map.addListener('click', (e) => {
        setForm((f) => {
          const next = [...f.coordinates, { lat: e.latLng.lat(), lng: e.latLng.lng() }];
          redraw(google, map, next);
          return { ...f, coordinates: next };
        });
      });
      mapRef.current._map = map; mapRef.current._google = google;
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-dessiner si la couleur change
  useEffect(() => {
    const map = mapRef.current?._map, google = mapRef.current?._google;
    if (map && google && form.coordinates.length) redraw(google, map, form.coordinates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.color]);

  function undo() {
    const map = mapRef.current?._map, google = mapRef.current?._google;
    setForm((f) => {
      const next = f.coordinates.slice(0, -1);
      if (map && google) redraw(google, map, next);
      return { ...f, coordinates: next };
    });
  }
  function clearAll() {
    const map = mapRef.current?._map, google = mapRef.current?._google;
    setForm((f) => ({ ...f, coordinates: [] }));
    if (polyRef.current) polyRef.current.setMap(null);
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="w-full max-w-3xl fade-in" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapIcon size={18} className="text-[var(--accent-primary)]" />
            <h2 className="font-semibold text-[var(--text-primary)]">{editingId ? 'Modifier la zone' : 'Nouvelle zone'}</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}>{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Field label="Nom *">
              <input className="tt-input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Gabes Centre" />
            </Field>
            <Field label="Description">
              <input className="tt-input w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Centre-ville..." />
            </Field>
            <Field label="Type">
              <select className="tt-input w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(zoneTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Couleur">
              <div className="flex gap-2">
                {colorChoices.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className="w-7 h-7 rounded-full transition"
                    style={{ backgroundColor: c, border: form.color === c ? '3px solid var(--text-primary)' : '2px solid var(--border-default)' }} />
                ))}
              </div>
            </Field>
          </div>

          <div className="space-y-2">
            <Field label="Tracez la zone (cliquez pour ajouter des points)">
              <div ref={mapRef} style={{ width: '100%', height: '260px', borderRadius: '10px', border: '1px solid var(--border-default)' }} />
            </Field>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">{form.coordinates.length} point(s) — min. 3</span>
              <div className="flex gap-2">
                <button onClick={undo} type="button" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                  style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <Undo2 size={13} /> Annuler point
                </button>
                <button onClick={clearAll} type="button" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                  style={{ backgroundColor: 'var(--bg-base)', color: 'var(--color-danger)', border: '1px solid var(--border-subtle)' }}>
                  <Eraser size={13} /> Effacer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>Annuler</button>
          <button onClick={onSubmit} disabled={saving} className="tt-button-primary flex-1">{saving ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Creer la zone')}</button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title} className="p-2 rounded-lg transition"
      style={{ color: danger ? 'var(--color-danger)' : 'var(--text-secondary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
      {children}
    </div>
  );
}
