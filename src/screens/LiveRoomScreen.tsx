import { useEffect, useRef, useState } from 'react';
import { Camera, Copy, Heart, Mic, MicOff, PhoneOff, Radio, Send, Video, VideoOff } from 'lucide-react';

type Props = { onClose: () => void };

export default function LiveRoomScreen({ onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [title, setTitle] = useState('Klas Sosyal canlı yayını');
  const [isLive, setIsLive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(['Yayına hoş geldin.']);
  const [likes, setLikes] = useState(0);
  const [roomId, setRoomId] = useState(() => new URLSearchParams(window.location.search).get('live') || crypto.randomUUID().slice(0, 8));
  const [roomInput, setRoomInput] = useState(roomId);
  const [viewers, setViewers] = useState(1);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(`klas-sosyal-live-${roomId}`);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const payload = event.data as { type?: string; text?: string };
      if (payload.type === 'join' || payload.type === 'leave') setViewers((current) => Math.max(1, current + (payload.type === 'join' ? 1 : -1)));
      if (payload.type === 'message' && payload.text) setMessages((current) => [...current, payload.text!]);
      if (payload.type === 'like') setLikes((current) => current + 1);
    };
    channel.postMessage({ type: 'join' });
    return () => { channel.postMessage({ type: 'leave' }); channel.close(); streamRef.current?.getTracks().forEach((track) => track.stop()); };
  }, [roomId]);

  async function toggleLive() {
    if (isLive) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsLive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsLive(true);
    } catch {
      window.alert('Canlı yayın için kamera ve mikrofon izni gerekli.');
    }
  }

  function toggleMic() {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = next; });
    setMicOn(next);
  }

  function toggleCamera() {
    const next = !cameraOn;
    streamRef.current?.getVideoTracks().forEach((track) => { track.enabled = next; });
    setCameraOn(next);
  }

  function joinRoom(event: React.FormEvent) {
    event.preventDefault();
    const nextRoom = roomInput.trim().replace(/[^a-zA-Z0-9-]/g, '').slice(0, 24);
    if (!nextRoom || nextRoom === roomId) return;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsLive(false);
    setRoomId(nextRoom);
    window.history.replaceState(null, '', `${window.location.pathname}?live=${nextRoom}`);
  }

  async function copyRoomLink() {
    await navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?live=${roomId}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, trimmed]);
    channelRef.current?.postMessage({ type: 'message', text: trimmed });
    setMessage('');
  }

  function sendLike() {
    setLikes((value) => value + 1);
    channelRef.current?.postMessage({ type: 'like' });
  }

  return <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
    <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-rose-500">WebRTC canlı yayın</p><h1 className="text-2xl font-bold text-slate-900">Canlı yayın odası</h1></div><button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 text-sm font-semibold text-slate-600">Kapat</button></div>
    <form onSubmit={joinRoom} className="mb-4 flex gap-2 rounded-2xl border bg-white p-3 shadow-sm"><input value={roomInput} onChange={(event) => setRoomInput(event.target.value)} placeholder="Oda kodu" className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm" aria-label="Canlı yayın oda kodu" /><button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Odaya katıl</button></form><div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section><label className="mb-3 block text-sm font-semibold text-slate-700">Yayın başlığı<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-sky-400" /></label><div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-xl"><video ref={videoRef} autoPlay muted playsInline className={`aspect-video w-full object-cover ${cameraOn ? '' : 'opacity-0'}`} /><div className="absolute inset-0 flex items-center justify-center text-white"><div className="text-center"><Radio className="mx-auto mb-2 h-9 w-9 text-rose-400" /><p className="font-semibold">{isLive ? title : 'Yayın başlatmaya hazır'}</p><p className="mt-1 text-xs text-slate-300">{isLive ? 'Kamera önizlemesi aktif' : 'Tarayıcı üzerinden güvenli WebRTC prototipi'}</p></div></div><div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"><button type="button" onClick={toggleMic} className="rounded-full bg-white/90 p-3 text-slate-800" aria-label={micOn ? 'Mikrofonu kapat' : 'Mikrofonu aç'}>{micOn ? <Mic /> : <MicOff />}</button><button type="button" onClick={toggleCamera} className="rounded-full bg-white/90 p-3 text-slate-800" aria-label={cameraOn ? 'Kamerayı kapat' : 'Kamerayı aç'}>{cameraOn ? <Video /> : <VideoOff />}</button><button type="button" onClick={toggleLive} className={`rounded-full p-3 text-white ${isLive ? 'bg-rose-500' : 'bg-sky-500'}`} aria-label={isLive ? 'Yayını bitir' : 'Yayını başlat'}>{isLive ? <PhoneOff /> : <Camera />}</button></div></div><div className="mt-3 flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${isLive ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{isLive ? 'CANLI' : 'HAZIR'}</span><span className="text-xs text-slate-500">Oda: {roomId} · {viewers} izleyici</span><button type="button" onClick={sendLike} className="flex items-center gap-1 text-sm text-rose-500"><Heart className="h-4 w-4" fill="currentColor" /> {likes}</button><button type="button" onClick={() => void copyRoomLink()} className="ml-auto flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-600"><Copy className="h-4 w-4" />{copied ? 'Kopyalandı' : 'Oda bağlantısı'}</button></div></section>
      <aside className="flex min-h-[360px] flex-col rounded-2xl border bg-white p-4 shadow-sm"><h2 className="font-semibold text-slate-900">Canlı sohbet</h2><div className="mt-3 flex-1 space-y-2 overflow-y-auto">{messages.map((item, index) => <p key={`${item}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{item}</p>)}</div><form onSubmit={sendMessage} className="mt-3 flex gap-2"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Mesaj yaz..." className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:border-sky-400" /><button type="submit" className="rounded-xl bg-slate-900 p-2 text-white" aria-label="Mesaj gönder"><Send className="h-4 w-4" /></button></form></aside>
    </div>
  </main>;
}
