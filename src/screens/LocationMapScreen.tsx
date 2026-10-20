import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, LocateFixed, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type LocationRow = { user_id: string; latitude: number; longitude: number; updated_at: string; expires_at?: string | null; precision_meters?: number; profile?: { display_name: string | null } | null };

const markerIcon = L.divIcon({ className: 'klas-location-marker', html: '<div style="width:28px;height:28px;border-radius:9999px;background:#06b6d4;border:3px solid white;box-shadow:0 3px 12px #0891b2aa"></div>', iconSize: [28, 28], iconAnchor: [14, 14] });

function LeafletMap({ locations }: { locations: LocationRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [39, 35], zoom: 6, zoomControl: true, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return () => { cancelAnimationFrame(frame); map.remove(); mapRef.current = null; markersRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;
    markers.clearLayers();
    const points: L.LatLngExpression[] = [];
    for (const location of locations) {
      if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) continue;
      const point: L.LatLngExpression = [location.latitude, location.longitude];
      points.push(point);
      L.marker(point, { icon: markerIcon }).bindPopup(`<strong>${(location.profile?.display_name ?? 'Kullanıcı').replace(/[<>&]/g, '')}</strong><br />Yaklaşık konum`).addTo(markers);
    }
    if (points.length === 1) map.setView(points[0], 12, { animate: false });
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 12, animate: false });
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));
  }, [locations]);

  return <div ref={containerRef} className="h-full w-full" aria-label="Takip edilen kişilerin konum haritası" />;
}

export default function LocationMapScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [shareDuration, setShareDuration] = useState('3600');
  const [precision, setPrecision] = useState<'100' | '1000'>('1000');

  async function loadLocations() {
    if (!user) return;
    const { data: own } = await supabase.from('user_locations').select('*').eq('user_id', user.id).maybeSingle();
    setSharing(Boolean(own?.share_location));
    const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    const visibleIds = [user.id, ...(following ?? []).map((row) => row.following_id)];
    const { data, error } = await supabase.from('user_locations').select('user_id, latitude, longitude, updated_at, profile:profiles!user_locations_user_id_fkey(display_name)').eq('share_location', true).or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).in('user_id', visibleIds);
    if (error) setMessage('Konumlar yüklenemedi. Lütfen tekrar dene.');
    const safeLocations = (data ?? []).filter((location) => Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))).map((location) => ({ ...location, latitude: Number(location.latitude), longitude: Number(location.longitude) }));
    setLocations(safeLocations as unknown as LocationRow[]);
  }
  useEffect(() => { void loadLocations(); }, [user]);

  async function updateLocation() {
    if (!user || !navigator.geolocation) return setMessage('Bu cihaz konum bilgisini desteklemiyor.');
    setBusy(true); setMessage('Konum izni bekleniyor...');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const latitude = Math.round(coords.latitude * 100) / 100;
      const longitude = Math.round(coords.longitude * 100) / 100;
      const expiresAt = new Date(Date.now() + Number(shareDuration) * 1000).toISOString();
      const { error } = await supabase.from('user_locations').upsert({ user_id: user.id, latitude, longitude, share_location: true, precision_meters: Number(precision), expires_at: expiresAt, updated_at: new Date().toISOString() });
      setBusy(false); setMessage(error ? 'Konum kaydedilemedi.' : 'Yaklaşık konumun takipçilerinle paylaşılıyor.');
      await loadLocations();
    }, () => { setBusy(false); setMessage('Konum izni verilmedi.'); }, { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 });
  }
  async function stopSharing() { if (!user) return; await supabase.from('user_locations').update({ share_location: false }).eq('user_id', user.id); setSharing(false); setLocations((items) => items.filter((item) => item.user_id !== user.id)); setMessage('Konum paylaşımı kapatıldı.'); }

  return <section className="min-h-screen bg-slate-50 px-4 py-4"><div className="mx-auto max-w-4xl"><div className="mb-4 flex items-center gap-3"><button onClick={onBack} className="rounded-xl bg-white p-2 shadow-sm" aria-label="Geri"><ArrowLeft className="h-5 w-5" /></button><div><h1 className="text-xl font-bold text-slate-800">Takip ettiklerin haritada</h1><p className="text-xs text-slate-500">Yalnızca konum paylaşımına izin veren kişiler görünür.</p></div></div><div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3"><label className="flex items-center gap-2 text-xs text-slate-600">Süre<select value={shareDuration} onChange={(event) => setShareDuration(event.target.value)} className="rounded-lg border px-2 py-1"><option value="900">15 dakika</option><option value="3600">1 saat</option><option value="86400">Gün sonuna kadar</option></select></label><label className="flex items-center gap-2 text-xs text-slate-600">Kesinlik<select value={precision} onChange={(event) => setPrecision(event.target.value as '100' | '1000')} className="rounded-lg border px-2 py-1"><option value="1000">Yaklaşık</option><option value="100">Daha kesin</option></select></label><button onClick={() => void updateLocation()} disabled={busy || sharing} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><LocateFixed className="h-4 w-4" />{busy ? 'Konum alınıyor...' : sharing ? 'Konumun paylaşılıyor' : 'Konumumu paylaş'}</button>{sharing && <button onClick={() => void stopSharing()} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600">Paylaşımı kapat</button>}{message && <span className="text-xs text-slate-500">{message}</span>}</div><div className="relative z-0 h-[65vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm"><LeafletMap locations={locations} /></div>{locations.length === 0 && <div className="mt-3 rounded-xl bg-white p-4 text-center text-sm text-slate-500"><MapPin className="mx-auto mb-2 h-5 w-5 text-cyan-500" />Henüz görünür konum yok.</div>}</div></section>;
}
