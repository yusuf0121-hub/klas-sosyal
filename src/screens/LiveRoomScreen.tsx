import { useEffect, useRef, useState } from 'react';
import { Camera, Copy, Mic, MicOff, PhoneOff, Radio, Video, VideoOff } from 'lucide-react';

type Props = { onClose: () => void };

export default function LiveRoomScreen({ onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [title, setTitle] = useState('Klas Sosyal canlı yayını');
  const [isLive, setIsLive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

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

  async function copyRoomLink() {
    await navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <main className="mx-auto min-h-screen max-w-3xl px-4 py-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-rose-500">WebRTC canlı yayın</p><h1 className="text-2xl font-bold text-slate-900">Canlı yayın odası</h1></div><button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 text-sm font-semibold text-slate-600">Kapat</button></div><label className="mb-3 block text-sm font-semibold text-slate-700">Yayın başlığı<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-sky-400" /></label><div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-xl"><video ref={videoRef} autoPlay muted playsInline className={`aspect-video w-full object-cover ${cameraOn ? '' : 'opacity-0'}`} /><div className="absolute inset-0 flex items-center justify-center text-white"><div className="text-center"><Radio className="mx-auto mb-2 h-9 w-9 text-rose-400" /><p className="font-semibold">{isLive ? title : 'Yayın başlatmaya hazır'}</p><p className="mt-1 text-xs text-slate-300">{isLive ? 'Kamera önizlemesi aktif' : 'Tarayıcı üzerinden güvenli WebRTC prototipi'}</p></div></div><div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"><button type="button" onClick={toggleMic} className="rounded-full bg-white/90 p-3 text-slate-800" aria-label={micOn ? 'Mikrofonu kapat' : 'Mikrofonu aç'}>{micOn ? <Mic /> : <MicOff />}</button><button type="button" onClick={toggleCamera} className="rounded-full bg-white/90 p-3 text-slate-800" aria-label={cameraOn ? 'Kamerayı kapat' : 'Kamerayı aç'}>{cameraOn ? <Video /> : <VideoOff />}</button><button type="button" onClick={toggleLive} className={`rounded-full p-3 text-white ${isLive ? 'bg-rose-500' : 'bg-sky-500'}`} aria-label={isLive ? 'Yayını bitir' : 'Yayını başlat'}>{isLive ? <PhoneOff /> : <Camera />}</button></div></div><div className="mt-4 flex items-center justify-between rounded-2xl border bg-white p-4"><div><p className="font-semibold text-slate-900">Yayın odasını paylaş</p><p className="text-xs text-slate-500">Arkadaşlarını davet etmek için bağlantıyı kopyala.</p></div><button type="button" onClick={() => void copyRoomLink()} className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"><Copy className="h-4 w-4" />{copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}</button></div></main>;
}
