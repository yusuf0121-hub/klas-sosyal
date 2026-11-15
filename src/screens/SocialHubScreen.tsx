import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CalendarDays, ListMusic, PartyPopper, Users, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import GroupsScreen from '@/screens/GroupsScreen';

type HubTab = 'communities' | 'events' | 'playlists' | 'watch';
type EventRow = { id: string; host_id: string; title: string; description: string; starts_at: string; location: string | null };
type PlaylistRow = { id: string; owner_id: string; title: string; description: string; is_collaborative: boolean };
type PartyRow = { id: string; host_id: string; title: string; media_url: string; is_live: boolean; playback_seconds: number };
type PlaylistItem = { id: string; playlist_id: string; title: string; media_url: string; position: number };

function playbackUrl(rawUrl: string, seconds: number) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    url.searchParams.set('start', String(Math.max(0, Math.floor(seconds))));
    return url.toString();
  } catch {
    return '';
  }
}

const tabs: { id: HubTab; label: string; icon: typeof Users }[] = [
  { id: 'communities', label: 'Topluluklar', icon: Users },
  { id: 'events', label: 'Etkinlikler', icon: CalendarDays },
  { id: 'playlists', label: 'Çalma listeleri', icon: ListMusic },
  { id: 'watch', label: 'İzleme partileri', icon: PartyPopper },
];

export default function SocialHubScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<HubTab>('communities');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [parties, setParties] = useState<PartyRow[]>([]);
  const [items, setItems] = useState<Record<string, PlaylistItem[]>>({});
  const [activeParty, setActiveParty] = useState<PartyRow | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const [eventResult, playlistResult, partyResult] = await Promise.all([
      supabase.from('social_events').select('*').order('starts_at', { ascending: true }).limit(50),
      supabase.from('social_playlists').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('social_watch_parties').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    const firstError = eventResult.error || playlistResult.error || partyResult.error;
    if (firstError) setError(firstError.message);
    setEvents((eventResult.data ?? []) as EventRow[]);
    setPlaylists((playlistResult.data ?? []) as PlaylistRow[]);
    setParties((partyResult.data ?? []) as PartyRow[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activePartyId = activeParty?.id;
  useEffect(() => {
    if (!activePartyId) return;
    const channel = supabase.channel(`watch-party-${activePartyId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'social_watch_parties', filter: `id=eq.${activePartyId}` }, (payload) => setActiveParty(payload.new as PartyRow))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [activePartyId]);

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return; setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.from('social_events').insert({ host_id: user.id, title: String(form.get('title') ?? '').trim(), description: String(form.get('description') ?? '').trim(), starts_at: new Date(String(form.get('starts_at'))).toISOString(), location: String(form.get('location') ?? '').trim() || null });
    if (insertError) setError(insertError.message); else { event.currentTarget.reset(); await load(); }
    setBusy(false);
  }

  async function rsvp(eventId: string) {
    if (!user) return; setBusy(true);
    const { error: rsvpError } = await supabase.from('social_event_attendees').upsert({ event_id: eventId, user_id: user.id, status: 'going' });
    if (rsvpError) setError(rsvpError.message); else await load(); setBusy(false);
  }

  async function createPlaylist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return; setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.from('social_playlists').insert({ owner_id: user.id, title: String(form.get('title') ?? '').trim(), description: String(form.get('description') ?? '').trim(), is_collaborative: form.get('collaborative') === 'on' });
    if (insertError) setError(insertError.message); else { event.currentTarget.reset(); await load(); }
    setBusy(false);
  }

  async function loadPlaylistItems(playlistId: string) {
    const { data, error: itemError } = await supabase.from('social_playlist_items').select('*').eq('playlist_id', playlistId).order('position');
    if (itemError) setError(itemError.message); else setItems((current) => ({ ...current, [playlistId]: (data ?? []) as PlaylistItem[] }));
  }

  async function addPlaylistItem(event: FormEvent<HTMLFormElement>, playlist: PlaylistRow) {
    event.preventDefault(); if (!user) return; setBusy(true);
    const form = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.from('social_playlist_items').insert({ playlist_id: playlist.id, added_by: user.id, title: String(form.get('title') ?? '').trim(), media_url: String(form.get('url') ?? '').trim(), position: items[playlist.id]?.length ?? 0 });
    if (insertError) setError(insertError.message); else { event.currentTarget.reset(); await loadPlaylistItems(playlist.id); }
    setBusy(false);
  }

  async function createParty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return; setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const { data, error: createError } = await supabase.from('social_watch_parties').insert({ host_id: user.id, title: String(form.get('title') ?? '').trim(), media_url: String(form.get('url') ?? '').trim(), is_live: true }).select('*').single();
    if (createError) setError(createError.message);
    else if (data) {
      await supabase.from('social_watch_party_members').upsert({ party_id: data.id, user_id: user.id });
      setActiveParty(data as PartyRow); event.currentTarget.reset(); await load();
    }
    setBusy(false);
  }

  async function joinParty(party: PartyRow) {
    if (!user) return;
    const { error: joinError } = await supabase.from('social_watch_party_members').upsert({ party_id: party.id, user_id: user.id });
    if (joinError) setError(joinError.message); else setActiveParty(party);
  }

  async function syncPlayback(seconds: number) {
    if (!activeParty || activeParty.host_id !== user?.id) return;
    const { error: updateError } = await supabase.from('social_watch_parties').update({ playback_seconds: Math.max(0, Math.floor(seconds)) }).eq('id', activeParty.id);
    if (updateError) setError(updateError.message);
  }

  return <main className="mx-auto min-h-full max-w-3xl px-4 pb-24 pt-4" aria-label="Topluluklar ve etkinlikler">
    <header className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Birlikte keşfet</p><h1 className="text-2xl font-bold text-slate-900">Sosyal alanın</h1><p className="mt-1 text-sm text-slate-500">Toplulukları keşfet, buluşma düzenle, listeler ve izleme odaları kur.</p></header>
    <nav className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-white p-2 sm:grid-cols-4" aria-label="Sosyal özellikler">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} aria-pressed={tab === id} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${tab === id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
    {error && <div role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    {tab === 'communities' && <GroupsScreen onClose={() => {}} />}
    {tab === 'events' && <section className="space-y-4"><form onSubmit={createEvent} className="grid gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2"><h2 className="font-semibold sm:col-span-2">Etkinlik oluştur</h2><input name="title" required minLength={2} maxLength={120} placeholder="Etkinlik adı" className="rounded-xl border px-3 py-2 text-sm" /><input name="starts_at" required type="datetime-local" className="rounded-xl border px-3 py-2 text-sm" /><input name="location" maxLength={160} placeholder="Konum (isteğe bağlı)" className="rounded-xl border px-3 py-2 text-sm" /><input name="description" maxLength={500} placeholder="Açıklama" className="rounded-xl border px-3 py-2 text-sm" /><button disabled={busy} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">Etkinlik yayınla</button></form><div className="grid gap-3">{events.map((item) => <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{new Date(item.starts_at).toLocaleString('tr-TR')} {item.location ? `· ${item.location}` : ''}</p><p className="mt-2 text-sm text-slate-600">{item.description}</p></div><button disabled={busy} onClick={() => void rsvp(item.id)} className="shrink-0 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">Katılacağım</button></div></article>)}</div>{events.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">Yaklaşan etkinlik yok. İlkini sen oluştur.</p>}</section>}
    {tab === 'playlists' && <section className="space-y-4"><form onSubmit={createPlaylist} className="grid gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2"><h2 className="font-semibold sm:col-span-2">Çalma listesi oluştur</h2><input name="title" required minLength={2} maxLength={100} placeholder="Liste adı" className="rounded-xl border px-3 py-2 text-sm" /><input name="description" maxLength={300} placeholder="Açıklama" className="rounded-xl border px-3 py-2 text-sm" /><label className="flex items-center gap-2 text-sm text-slate-600"><input name="collaborative" type="checkbox" /> Ortak katkıya açık</label><button disabled={busy} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Liste oluştur</button></form>{playlists.map((list) => <article key={list.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{list.title}</h3><p className="text-sm text-slate-500">{list.description || (list.is_collaborative ? 'Ortak liste' : 'Kişisel liste')}</p></div><button type="button" onClick={() => void loadPlaylistItems(list.id)} className="rounded-lg border px-3 py-2 text-xs font-semibold">Parçaları gör</button></div>{items[list.id] && <div className="mt-3 space-y-2">{items[list.id].map((item) => <a key={item.id} href={item.media_url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-sky-700">{item.title}<ExternalLink className="h-4 w-4" /></a>)}<form onSubmit={(event) => void addPlaylistItem(event, list)} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input name="title" required placeholder="Parça / video adı" className="rounded-lg border px-3 py-2 text-sm" /><input name="url" required type="url" placeholder="https://..." className="rounded-lg border px-3 py-2 text-sm" /><button disabled={busy} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Ekle</button></form></div>}</article>)}{playlists.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">Henüz çalma listesi yok.</p>}</section>}
    {tab === 'watch' && <section className="space-y-4">{activeParty ? <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">{activeParty.title}</h2><p className="text-xs text-slate-500">{activeParty.host_id === user?.id ? 'Sunucu sensin · oynatmayı senkronla' : 'İzleme odasına katıldın'}</p></div><button type="button" onClick={() => setActiveParty(null)} className="rounded-lg border px-3 py-2 text-xs font-semibold">Odadan çık</button></div><iframe key={`${activeParty.id}-${activeParty.playback_seconds}`} src={playbackUrl(activeParty.media_url, activeParty.playback_seconds)} title={activeParty.title} className="aspect-video w-full rounded-xl bg-slate-950" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /><form onSubmit={(event) => { event.preventDefault(); const value = Number(new FormData(event.currentTarget).get('seconds')); void syncPlayback(value); }} className="mt-3 flex gap-2"><label className="sr-only" htmlFor="watch-position">Video saniyesi</label><input id="watch-position" name="seconds" type="number" min="0" defaultValue={activeParty.playback_seconds} className="w-32 rounded-lg border px-3 py-2 text-sm" /><button disabled={activeParty.host_id !== user?.id} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Konumu eşitle</button></form></article> : <form onSubmit={createParty} className="grid gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><h2 className="font-semibold">İzleme partisi başlat</h2><input name="title" required minLength={2} maxLength={120} placeholder="Oda adı" className="rounded-xl border px-3 py-2 text-sm" /><input name="url" required type="url" placeholder="Paylaşılabilir video veya embed URL’si" className="rounded-xl border px-3 py-2 text-sm" /><button disabled={busy} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Oda oluştur</button></form>}{parties.map((party) => <article key={party.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div><h3 className="font-bold text-slate-900">{party.title}</h3><p className="text-xs text-slate-500">{party.is_live ? 'Şimdi izleniyor' : 'İzleme odası'}</p></div><button type="button" onClick={() => void joinParty(party)} className="rounded-xl border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700">Katıl</button></article>)}</section>}
  </main>;
}
