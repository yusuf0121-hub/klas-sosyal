import { useEffect, useState } from 'react';
import { MessageCircle, Users, ArrowLeft, Plus, Search, X, Edit3 } from 'lucide-react';
import { supabase, type Conversation, type Message, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import ChatView from '@/components/ChatView';

type Props = {
  onChatOpenChange?: (open: boolean) => void;
};

export default function MessagesScreen({ onChatOpenChange }: Props) {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  async function loadConversations() {
    if (!user) return;
    setLoading(true);

    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    const convIds = (memberships ?? []).map((m) => m.conversation_id);
    if (convIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('created_at', { ascending: false });

    const enriched: Conversation[] = [];
    for (const c of convs ?? []) {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id, profile:profiles!conversation_members_user_id_fkey(*)')
        .eq('conversation_id', c.id);
      const memberProfiles = (members ?? []).map((m) => m.profile as unknown as Profile);

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      enriched.push({
        ...c,
        members: memberProfiles,
        last_message: lastMsg as Message | undefined,
      });
    }

    enriched.sort((a, b) => {
      const aTime = a.last_message?.created_at ?? a.created_at;
      const bTime = b.last_message?.created_at ?? b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(enriched);
    setLoading(false);
  }

  async function loadFollowing() {
    if (!user) return;
    const { data } = await supabase
      .from('follows')
      .select('following_id, profile:profiles!follows_following_id_fkey(*)')
      .eq('follower_id', user.id);
    setFollowing((data ?? []).map((f) => f.profile as unknown as Profile));
  }

  function getDMName(conv: Conversation): string {
    const other = conv.members?.find((m) => m.id !== user?.id);
    return other?.display_name ?? 'Sohbet';
  }

  function getDMMember(conv: Conversation): Profile | undefined {
    return conv.members?.find((m) => m.id !== user?.id);
  }

  function openChat(c: Conversation) {
    setActiveChat(c);
    onChatOpenChange?.(true);
  }

  async function openDMWith(otherUser: Profile) {
    if (!user) return;
    // Auto-create DM if it doesn't exist, then find and open it
    const { data: convId } = await supabase.rpc('ensure_dm', { p_other_user_id: otherUser.id });
    if (convId) {
      const { data: conv } = await supabase.from('conversations').select('*').eq('id', convId).single();
      if (conv) {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id, profile:profiles!conversation_members_user_id_fkey(*)')
          .eq('conversation_id', convId);
        const newConv: Conversation = {
          ...conv,
          members: (members ?? []).map((m) => m.profile as unknown as Profile),
        };
        const exists = conversations.some((c) => c.id === convId);
        if (!exists) setConversations((prev) => [newConv, ...prev]);
        openChat(newConv);
      }
    }
    setShowContactPicker(false);
  }

  async function createGroup() {
    if (!user || !groupName.trim() || selectedMembers.length === 0) return;

    const { data: convId, error } = await supabase.rpc('create_group', {
      p_name: groupName.trim(),
      p_member_ids: selectedMembers,
    });

    if (error || !convId) return;

    const { data: conv } = await supabase.from('conversations').select('*').eq('id', convId).single();
    if (!conv) return;

    const { data: members } = await supabase
      .from('conversation_members')
      .select('user_id, profile:profiles!conversation_members_user_id_fkey(*)')
      .eq('conversation_id', convId);

    const newConv: Conversation = {
      ...conv,
      members: (members ?? []).map((m) => m.profile as unknown as Profile),
    };
    setConversations((prev) => [newConv, ...prev]);
    openChat(newConv);
    setShowNewGroup(false);
    setGroupName('');
    setSelectedMembers([]);
  }

  function toggleMember(id: string) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  if (activeChat) {
    return <ChatView conversation={activeChat} onBack={() => { setActiveChat(null); onChatOpenChange?.(false); loadConversations(); }} />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mesajlar</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowContactPicker(true); loadFollowing(); }}
            className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-600 hover:text-sky-500 hover:border-sky-200 transition-all"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setShowNewGroup(true); loadFollowing(); }}
            className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-600 hover:text-emerald-500 hover:border-emerald-200 transition-all"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-slate-100 rounded" />
                <div className="w-48 h-3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
            <MessageCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700">Henüz sohbet yok</h3>
          <p className="text-sm text-slate-400 mt-1">Birini takip ettiğinde sohbet otomatik açılır.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const isGroup = c.type === 'group';
            const name = isGroup ? c.name ?? 'Grup' : getDMName(c);
            const member = isGroup ? undefined : getDMMember(c);
            return (
              <button
                key={c.id}
                onClick={() => openChat(c)}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-sky-200 transition-all text-left"
              >
                {isGroup ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <Avatar name={name} id={member?.id ?? ''} url={member?.avatar_url} size="lg" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 text-sm truncate">{name}</p>
                    {c.last_message && (
                      <span className="text-xs text-slate-400 shrink-0 ml-2">{timeAgo(c.last_message.created_at)}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {c.last_message?.content ?? 'Henüz mesaj yok'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Contact picker modal */}
      {showContactPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowContactPicker(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Yeni Mesaj</h2>
              <button onClick={() => setShowContactPicker(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            {following.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">Henüz kimseyi takip etmiyorsun.</p>
                <p className="text-xs text-slate-400 mt-1">Keşfet'ten kullanıcıları takip edebilirsin.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {following.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => openDMWith(f)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <Avatar name={f.display_name} id={f.id} url={f.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{f.display_name}</p>
                      {f.bio && <p className="text-xs text-slate-400 truncate">{f.bio}</p>}
                    </div>
                    <MessageCircle className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Group modal */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowNewGroup(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Yeni Grup</h2>
              <button onClick={() => setShowNewGroup(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Grup adı"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 mb-4"
            />
            <p className="text-sm text-slate-400 mb-3">Üye seç ({selectedMembers.length} seçildi)</p>
            {following.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">Gruba eklemek için önce kullanıcıları takip et.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {following.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleMember(f.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                      selectedMembers.includes(f.id) ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <Avatar name={f.display_name} id={f.id} url={f.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{f.display_name}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMembers.includes(f.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                    }`}>
                      {selectedMembers.includes(f.id) && <Plus className="w-3 h-3 text-white rotate-45" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={createGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-medium rounded-xl disabled:opacity-40 transition-all"
            >
              Grubu Oluştur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
