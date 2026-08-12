import { useState } from 'react';
import { Image as ImageIcon, Video as VideoIcon, X, Send, Film, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import MediaEditor from '@/components/MediaEditor';

type Props = {
  onPosted: () => void;
};

type MediaType = 'photo' | 'video' | 'none';

export default function CreatePostScreen({ onPosted }: Props) {
  const { profile, user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('none');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isReel, setIsReel] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function uploadFile(file: File) {
    if (!user) return;
    setUploading(true);
    setError(null);

    const isVideo = file.type.startsWith('video/');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file);

    if (uploadError) {
      setError('Dosya yüklenemedi. ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    if (isVideo) {
      setVideoUrl(publicUrl);
      setMediaType('video');
      setIsReel(true);
    } else {
      setImageUrl(publicUrl);
      setMediaType('photo');
      setIsReel(false);
    }
    setUploading(false);
  }

  async function handleEditedPhoto(blob: Blob, fileName: string) {
    if (!user) return;
    setPendingFile(null);
    setUploading(true);

    const path = `${user.id}/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabase.storage.from('media').upload(path, blob);

    if (uploadError) {
      setError('Dosya yüklenemedi. ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setMediaType('photo');
    setIsReel(false);
    setUploading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, isVideo: boolean) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isVideo && !file.type.startsWith('video/')) {
      setError('Lütfen bir video dosyası seçin.');
      return;
    }
    if (!isVideo && !file.type.startsWith('image/')) {
      setError('Lütfen bir görsel dosyası seçin.');
      return;
    }
    if (isVideo) {
      uploadFile(file);
    } else {
      setPendingFile(file);
    }
  }

  function clearMedia() {
    setImageUrl('');
    setVideoUrl('');
    setMediaType('none');
    setShowUrlInput(false);
    setIsReel(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setBusy(true);
    setError(null);

    const { error: err } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl.trim() || null,
      video_url: videoUrl.trim() || null,
      is_reel: isReel,
    });

    if (err) {
      setError('Gönderi paylaşılamadı.');
    } else {
      setContent('');
      clearMedia();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onPosted();
    }
    setBusy(false);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Gönderi Paylaş</h1>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex gap-3 mb-4">
          <Avatar name={profile?.display_name ?? '?'} id={user?.id ?? ''} url={profile?.avatar_url} size="md" />
          <div>
            <p className="font-semibold text-slate-900 text-sm">{profile?.display_name}</p>
            <p className="text-xs text-slate-400">Ne düşünüyorsun?</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bir şeyler yaz..."
            rows={5}
            maxLength={500}
            autoFocus
            className="w-full px-0 py-2 text-slate-700 text-sm focus:outline-none resize-none placeholder-slate-400"
          />

          <p className="text-right text-xs text-slate-400 mb-3">{content.length}/500</p>

          {/* Media preview */}
          {mediaType === 'photo' && imageUrl && (
            <div className="mb-3 relative rounded-xl overflow-hidden">
              <img src={imageUrl} alt="" className="w-full max-h-64 object-cover" />
              <button type="button" onClick={clearMedia} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {mediaType === 'video' && videoUrl && (
            <div className="mb-3 relative rounded-xl overflow-hidden">
              <video src={videoUrl} controls playsInline className="w-full max-h-64 object-cover bg-slate-900" />
              <button type="button" onClick={clearMedia} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70">
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-lg flex items-center gap-1">
                <Film className="w-3 h-3" /> Reels
              </div>
            </div>
          )}

          {uploading && (
            <div className="mb-3 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 text-sm text-sky-600 flex items-center gap-2">
              <Upload className="w-4 h-4 animate-pulse" />
              Yükleniyor...
            </div>
          )}

          {showUrlInput && mediaType === 'none' && (
            <div className="mb-3">
              <input
                type="url"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.match(/\.(mp4|webm|mov)$/i)) {
                    setVideoUrl(val);
                    setMediaType('video');
                  } else {
                    setImageUrl(val);
                    setMediaType('photo');
                  }
                }}
                placeholder="Görsel veya video URL'si yapıştır"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
              />
            </div>
          )}

          {error && (
            <div className="mb-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}

          {/* Media buttons */}
          {mediaType === 'none' && !uploading && (
            <div className="flex items-center gap-2 mb-3">
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-all cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                Fotoğraf
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, false)} />
              </label>
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer">
                <VideoIcon className="w-5 h-5" />
                Video
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e, true)} />
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
              >
                <Upload className="w-5 h-5" />
                URL
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            {mediaType === 'video' && (
              <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReel}
                  onChange={(e) => setIsReel(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
                />
                Reels olarak paylaş
              </label>
            )}
            <button
              type="submit"
              disabled={!content.trim() || busy || uploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-medium text-sm rounded-xl shadow-sm hover:shadow-md disabled:opacity-40 transition-all ml-auto"
            >
              <Send className="w-4 h-4" />
              {busy ? 'Paylaşılıyor...' : success ? 'Paylaşıldı!' : 'Paylaş'}
            </button>
          </div>
        </form>
      </div>

      {pendingFile && (
        <MediaEditor
          file={pendingFile}
          onSave={handleEditedPhoto}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  );
}
