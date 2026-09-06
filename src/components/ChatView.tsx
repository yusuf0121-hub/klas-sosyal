import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Phone, Video, Users, Image as ImageIcon, Film } from 'lucide-react';
import { supabase, type Conversation, type Message, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import VideoCall from '@/components/VideoCall';
import MediaEditor from '@/components/MediaEditor';

type Props = {
  conversation: Conversation;
  onBack: () => void;
};

export default function ChatView({ conversation, onBack }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [otherMembers, setOtherMembers] = useState<Profile[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isGroup = conversation.type === 'group';
  const displayName = isGroup
    ? conversation.name ?? 'Grup'
    : otherMembers[0]?.display_name ?? 'Sohbet';

  useEffect(() => {
    async function loadMembers() {
      const { data } = await supabase
        .from('conversation_members')
        .select('user_id, profile:profiles!conversation_members_user_id_fkey(*)')
        .eq('conversation_id', conversation.id);
      const members = (data ?? [])
        .filter((m) => m.user_id !== user?.id)
        .map((m) => m.profile as unknown as Profile);
      setOtherMembers(members);
    }
    loadMembers();
  }, [conversation.id, user?.id]);

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*, profile:profiles!messages_sender_id_fkey(*)')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      setMessages((data ?? []).map((m) => ({ ...m, profile: m.profile as unknown as Profile })));
    }
    loadMessages();

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const incoming = payload.new as Message;
          // Fetch profile for the incoming message
          supabase
            .from('profiles')
            .select('*')
            .eq('id', incoming.sender_id)
            .single()
            .then(({ data: prof }) => {
              const msgWithProfile: Message = { ...incoming, profile: prof as unknown as Profile };
              setMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id)) return prev;
                return [...prev, msgWithProfile];
              });
            });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    const content = text.trim();
    setText('');
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: conversation.id, sender_id: user.id, content })
      .select('*, profile:profiles!messages_sender_id_fkey(*)')
      .single();
    if (data) {
      const newMsg = { ...data, profile: data.profile as unknown as Profile };
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    }
    setSending(false);
  }

  async function uploadAndSendMedia(blob: Blob, fileName: string) {
    if (!user) return;
    setUploading(true);
    setPendingFile(null);

    const isVideo = blob.type.startsWith('video/') || fileName.match(/\.(mp4|webm|mov)$/i);
    const path = `${user.id}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabase.storage.from('media').upload(path, blob);
    if (uploadError) {
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const insertData: Record<string, string | null> = {
      conversation_id: conversation.id,
      sender_id: user.id,
      content: null,
      image_url: isVideo ? null : publicUrl,
      video_url: isVideo ? publicUrl : null,
    };

    const { data } = await supabase
      .from('messages')
      .insert(insertData)
      .select('*, profile:profiles!messages_sender_id_fkey(*)')
      .single();

    if (data) {
      const newMsg = { ...data, profile: data.profile as unknown as Profile };
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    }
    setUploading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.type.startsWith('image/')) {
      setPendingFile(file);
    } else if (file.type.startsWith('video/')) {
      uploadAndSendMedia(file, file.name);
    }
  }

  if (callActive) {
    return (
      <VideoCall
        conversationId={conversation.id}
        conversationName={displayName}
        participants={otherMembers}
        onEnd={() => setCallActive(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 fixed inset-0 z-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        {isGroup ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        ) : (
          <Avatar name={displayName} id={otherMembers[0]?.id ?? ''} url={otherMembers[0]?.avatar_url} size="md" />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 text-sm truncate">{displayName}</h2>
          <p className="text-xs text-slate-400">
            {isGroup ? `${otherMembers.length + 1} üye` : 'Özel sohbet'}
          </p>
        </div>
        <button
          onClick={() => setCallActive(true)}
          className="p-2 text-slate-500 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
        >
          <Video className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCallActive(true)}
          className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 overscroll-contain">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-slate-400">Henüz mesaj yok. İlk mesajı sen gönder!</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                {!mine && <Avatar name={m.profile?.display_name ?? '?'} id={m.sender_id} url={m.profile?.avatar_url} size="sm" />}
                <div className={`max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!mine && isGroup && (
                    <span className="text-xs text-slate-500 mb-0.5 px-1">{m.profile?.display_name}</span>
                  )}
                  <div
                    className={`rounded-2xl text-sm overflow-hidden ${
                      mine
                        ? 'bg-gradient-to-br from-sky-500 to-emerald-500 text-white rounded-br-md'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md shadow-sm'
                    } ${m.content ? 'px-4 py-2.5' : 'p-1'}`}
                  >
                    {m.image_url && (
                      <img src={m.image_url} alt="" className="w-full max-w-[240px] rounded-xl" />
                    )}
                    {m.video_url && (
                      <video src={m.video_url} controls playsInline className="w-full max-w-[240px] rounded-xl" />
                    )}
                    {m.content && <p>{m.content}</p>}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1">{timeAgo(m.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-100 px-3 py-3 flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <label className="p-2.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-full transition-all cursor-pointer shrink-0">
          <ImageIcon className="w-5 h-5" />
          <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </label>
        <label className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all cursor-pointer shrink-0">
          <Film className="w-5 h-5" />
          <input type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
        </label>
        <form onSubmit={send} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mesaj yaz..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="p-3 bg-gradient-to-br from-sky-500 to-emerald-500 text-white rounded-full hover:shadow-lg disabled:opacity-40 transition-all shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {uploading && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-xs px-4 py-2 rounded-full animate-pulse">
          Yükleniyor...
        </div>
      )}

      {pendingFile && (
        <MediaEditor
          file={pendingFile}
          onSave={uploadAndSendMedia}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  );
}
