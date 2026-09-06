import { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Avatar from './Avatar';

type Props = {
  conversationId: string;
  conversationName: string;
  participants: Profile[];
  onEnd: () => void;
};

export default function VideoCall({ conversationId, conversationName, participants, onEnd }: Props) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let active = true;

    async function startCall() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCallStatus('active');

        // Record call in database
        if (user) {
          await supabase.from('calls').insert({
            conversation_id: conversationId,
            caller_id: user.id,
            status: 'accepted',
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kamera erişimi reddedildi.';
        if (active) setError(message);
      }
    }
    startCall();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [conversationId, user]);

  useEffect(() => {
    if (callStatus !== 'active') return;
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  function toggleCam() {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setCamOn(track.enabled);
      }
    }
  }

  function toggleMic() {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setMicOn(track.enabled);
      }
    }
  }

  function endCall() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setCallStatus('ended');
    onEnd();
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex flex-col h-[100dvh] bg-slate-900 items-center justify-center p-6 fixed inset-0 z-50">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4 mx-auto">
            <PhoneOff className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Arama başlatılamadı</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <p className="text-slate-500 text-xs mb-6">
            Tarayıcı ayarlarından kamera ve mikrofon erişimine izin verdiğinizden emin olun.
          </p>
          <button
            onClick={onEnd}
            className="px-6 py-3 bg-white text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-900 fixed inset-0 z-50">
      {/* Remote area (placeholder - shows participant info) */}
      <div className="flex-1 relative flex items-center justify-center">
        {participants.length > 0 ? (
          <div className="flex flex-col items-center gap-4">
            <Avatar name={participants[0].display_name} id={participants[0].id} url={participants[0].avatar_url} size="xl" />
            <div className="text-center">
              <h2 className="text-white font-semibold text-xl">{conversationName}</h2>
              <p className="text-slate-400 text-sm mt-1">
                {callStatus === 'connecting' ? 'Bağlanıyor...' : formatTime(callDuration)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-white font-semibold text-xl">{conversationName}</h2>
            <p className="text-slate-400 text-sm mt-1">
              {callStatus === 'connecting' ? 'Bağlanıyor...' : formatTime(callDuration)}
            </p>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-32 h-44 sm:w-40 sm:h-52 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
          {camOn ? (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-slate-500" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800/80 backdrop-blur-lg px-6 py-6 flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-slate-900'
          }`}
        >
          {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        <button
          onClick={toggleCam}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-slate-900'
          }`}
        >
          {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>
        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/30"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
