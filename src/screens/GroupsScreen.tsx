import { useEffect, useState } from 'react'
import { Plus, Users, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

type Group = { id: string; name: string; description: string; privacy: string; tags: string[]; owner_id: string; created_at: string }
type Props = { onClose: () => void }

export default function GroupsScreen({ onClose }: Props) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [selected, setSelected] = useState<Group | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadGroups() {
    setLoading(true)
    setError('')
    let result = await supabase.schema('public').from('groups').select('*').order('created_at', { ascending: false })
    if (result.error?.message.includes('schema cache')) {
      await new Promise((resolve) => setTimeout(resolve, 900))
      result = await supabase.schema('public').from('groups').select('*').order('created_at', { ascending: false })
    }
    if (result.error) {
      console.error('[v0] Groups load failed:', result.error)
      setError(`Gruplar yüklenemedi: ${result.error.message}`)
    }
    setGroups((result.data ?? []) as Group[])
    setLoading(false)
  }

  useEffect(() => { void loadGroups() }, [])

  async function createGroup() {
    const trimmedName = name.trim()
    if (!user) { setError('Grup oluşturmak için giriş yapmalısın.'); return }
    if (trimmedName.length < 2) { setError('Grup adı en az 2 karakter olmalı.'); return }
    setError('')
    const { data, error: createError } = await supabase.from('groups').insert({ owner_id: user.id, name: trimmedName, description: description.trim(), privacy: 'open', tags: [] }).select('*').single()
    if (createError || !data) {
      console.error('[v0] Group creation failed:', createError)
      setError(createError?.message ? `Grup oluşturulamadı: ${createError.message}` : 'Grup oluşturulamadı.')
      return
    }
    const { error: membershipError } = await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, role: 'owner' })
    if (membershipError) {
      console.error('[v0] Group membership creation failed:', membershipError)
      setError('Grup oluşturuldu ancak üyelik kaydedilemedi. Lütfen grupları yenileyip tekrar dene.')
      return
    }
    setName(''); setDescription(''); setShowCreate(false); setSelected(data as Group); await loadGroups()
  }

  async function joinGroup(group: Group) {
    if (!user) return
    const { error: joinError } = await supabase.from('group_members').upsert({ group_id: group.id, user_id: user.id, role: 'member' })
    if (joinError) setError('Gruba katılınamadı.')
    else setSelected(group)
  }

  return <main className="mx-auto min-h-full max-w-3xl p-4" aria-label="Gruplar">
    <header className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">Topluluklar</p><h1 className="text-2xl font-bold text-slate-900">Gruplar</h1><p className="text-sm text-slate-500">İlgi alanlarına göre insanlarla buluş.</p></div><div className="flex gap-2"><button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Grup oluştur</button><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2" aria-label="Kapat"><X className="h-5 w-5" /></button></div></header>
    {error && <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => void loadGroups()} className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-rose-700">Tekrar dene</button></div>}
    {showCreate && <section className="mb-4 rounded-2xl border border-violet-100 bg-violet-50 p-4"><h2 className="font-semibold text-slate-900">Yeni grup</h2><div className="mt-3 grid gap-2"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Grup adı" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" maxLength={80} /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Grup ne hakkında?" className="min-h-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" maxLength={300} /><button type="button" onClick={createGroup} disabled={name.trim().length < 2} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Oluştur</button></div></section>}
    {loading ? <p className="py-10 text-center text-sm text-slate-500">Gruplar yükleniyor...</p> : <div className="grid gap-3 sm:grid-cols-2">{groups.map((group) => <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><Users className="h-5 w-5" /></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Açık grup</span></div><h2 className="font-bold text-slate-900">{group.name}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-500">{group.description || 'Bu grubun henüz bir açıklaması yok.'}</p><button type="button" onClick={() => void joinGroup(group)} className="mt-4 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700">Gruba katıl</button></article>)}</div>}
    {!loading && groups.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Henüz grup yok. İlk grubu sen oluştur.</div>}
    {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center"><section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{selected.name}</h2><button type="button" onClick={() => setSelected(null)} aria-label="Kapat"><X className="h-5 w-5" /></button></div><p className="mt-2 text-sm text-slate-500">Gruba katıldın. Grup akışı ve paylaşımlar burada görünecek.</p></section></div>}
  </main>
}
