import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, LocateFixed, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type LocationRow = { user_id: string; latitude: number; longitude: number; updated_at: string; profile?: { display_name: string | null } | null };

const markerIcon = L.divIcon({ className: 'klas-location-marker', html: '<div style="width:28px;height:28px;border-radius:9999px;background:#06b6d4;border:3px solid white;box-shadow:0 3px 12px #0891b2aa"></div>', iconSize: [28, 28], iconAnchor: [14, 14] });

function MapReady({ locations }: { locations: LocationRow[] }) {
  const map = useMap();
  useEffect(() => {
    const refresh = () => {
      map.invalidateSize({ pan: false });
      if (locations.length) map.fitBounds(locations.map((location) => [location.latitude, location.longitude] as [number, number]), { padding: [32, 32], maxZoom: 12 });
    };
    const frame = requestAnimationFrame(refresh);
    const timer = window.setTimeout(refresh, 250);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [locations, map]);
  return null;
}

export default function LocationMapScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function loadLocations() {
    if (!user) return;
    const { data: own } = await supabase.from('user_locations').select('*').eq('user_id', user.id).maybeSingle();
    setSharing(Boolean(own?.share_location));
    const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    const visibleIds = [user.id, ...(following ?? []).map((row) => row.following_id)];
    const { data, error } = await supabase.from('user_locations').select('user_id, latitude, longitude, updated_at, profile:profiles!user_locations_user_id_fkey(display_name)').eq('share_location', true).in('user_id', visibleIds);
    if (error) setMessage('Konumlar yüklenemedi. Lütfen tekrar dene.');
    setLocations((data ?? []) as unknown as LocationRow[]);
  }
  useEffect(() => { void loadLocations(); }, [user]);

  async function updateLocation() {
    if (!user || !navigator.geolocation) return setMessage('Bu cihaz konum bilgisini desteklemiyor.');
    setBusy(true); setMessage('Konum izni bekleniyor...');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const latitude = Math.round(coords.latitude * 100) / 100;
      const longitude = Math.round(coords.longitude * 100) / 100;
      const { error } = await supabase.from('user_locations').upsert({ user_id: user.id, latitude, longitude, share_location: true, updated_at: new Date().toISOString() });
      setBusy(false); setMessage(error ? 'Konum kaydedilemedi.' : 'Yaklaşık konumun takipçilerinle paylaşılıyor.');
      await loadLocations();
    }, () => { setBusy(false); setMessage('Konum izni verilmedi.'); }, { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 });
  }
  async function stopSharing() { if (!user) return; await supabase.from('user_locations').update({ share_location: false }).eq('user_id', user.id); setSharing(false); setLocations((items) => items.filter((item) => item.user_id !== user.id)); setMessage('Konum paylaşımı kapatıldı.'); }

  const center: [number, number] = locations[0] ? [locations[0].latitude, locations[0].longitude] : [39.0, 35.0];
  return <section className="min-h-screen bg-slate-50 px-4 py-4"><div className="mx-auto max-w-4xl"><div className="mb-4 flex items-center gap-3"><button onClick={onBack} className="rounded-xl bg-white p-2 shadow-sm" aria-label="Geri"><ArrowLeft className="h-5 w-5" /></button><div><h1 className="text-xl font-bold text-slate-800">Takip ettiklerin haritada</h1><p className="text-xs text-slate-500">Yalnızca konum paylaşımına izin veren kişiler görünür.</p></div></div><div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3"><button onClick={() => void updateLocation()} disabled={busy || sharing} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><LocateFixed className="h-4 w-4" />{busy ? 'Konum alınıyor...' : sharing ? 'Konumun paylaşılıyor' : 'Konumumu paylaş'}</button>{sharing && <button onClick={() => void stopSharing()} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600">Paylaşımı kapat</button>}{message && <span className="text-xs text-slate-500">{message}</span>}</div><div className="relative z-0 h-[65vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm"><MapContainer center={center} zoom={6} scrollWheelZoom className="!h-full !min-h-[420px] !w-full"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapReady locations={locations} />{locations.map((location) => <Marker key={location.user_id} position={[location.latitude, location.longitude]} icon={markerIcon}><Popup><strong>{location.profile?.display_name ?? 'Kullanıcı'}</strong><br />Yaklaşık konum</Popup></Marker>)}</MapContainer></div>{locations.length === 0 && <div className="mt-3 rounded-xl bg-white p-4 text-center text-sm text-slate-500"><MapPin className="mx-auto mb-2 h-5 w-5 text-cyan-500" />Henüz görünür konum yok.</div>}</div></section>;
}
