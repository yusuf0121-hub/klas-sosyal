import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Check, Type, Crop, Sliders, RotateCw, FlipHorizontal } from 'lucide-react';

type Props = {
  file: File;
  onSave: (editedBlob: Blob, fileName: string) => void;
  onCancel: () => void;
};

type FilterName = 'none' | 'warm' | 'cool' | 'vivid' | 'mono' | 'sepia' | 'fade' | 'noir';

const FILTERS: { name: FilterName; label: string; css: string }[] = [
  { name: 'none', label: 'Orijinal', css: 'none' },
  { name: 'warm', label: 'Sıcak', css: 'saturate(1.3) contrast(1.1) sepia(0.2) brightness(1.05)' },
  { name: 'cool', label: 'Soğuk', css: 'saturate(1.2) contrast(1.1) hue-rotate(-10deg) brightness(1.05)' },
  { name: 'vivid', label: 'Canlı', css: 'saturate(1.6) contrast(1.15) brightness(1.05)' },
  { name: 'mono', label: 'Siyah-Beyaz', css: 'grayscale(1) contrast(1.1)' },
  { name: 'sepia', label: 'Sepya', css: 'sepia(0.8) contrast(1.1) brightness(1.05)' },
  { name: 'fade', label: 'Soluk', css: 'saturate(0.6) contrast(0.85) brightness(1.1)' },
  { name: 'noir', label: 'Noir', css: 'grayscale(1) contrast(1.4) brightness(0.9)' },
];

type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
};

export default function MediaEditor({ file, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterName>('none');
  const [tool, setTool] = useState<'filter' | 'crop' | 'text'>('filter');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [cropAspect, setCropAspect] = useState<number | null>(null);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.src = URL.createObjectURL(file);
  }, [file]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = img.naturalWidth;
    let h = img.naturalHeight;

    if (cropAspect) {
      const currentAspect = w / h;
      if (currentAspect > cropAspect) {
        w = h * cropAspect;
      } else {
        h = w / cropAspect;
      }
    }

    const maxDim = 1080;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    canvas.width = w;
    canvas.height = h;

    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    if (rotation === 90 || rotation === 270) {
      canvas.width = h;
      canvas.height = w;
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flipH) ctx.scale(-1, 1);

    const filterCss = FILTERS.find((f) => f.name === activeFilter)?.css ?? 'none';
    ctx.filter = `${filterCss} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    // Draw text overlays
    overlays.forEach((ov) => {
      ctx.save();
      ctx.font = `bold ${ov.size}px sans-serif`;
      ctx.fillStyle = ov.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const px = (ov.x / 100) * canvas.width;
      const py = (ov.y / 100) * canvas.height;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(ov.text, px, py);
      ctx.restore();
    });
  }, [activeFilter, brightness, contrast, saturation, rotation, flipH, cropAspect, overlays]);

  useEffect(() => {
    if (loaded) drawCanvas();
  }, [loaded, drawCanvas]);

  function addText() {
    if (!pendingText.trim()) return;
    const id = `txt-${Date.now()}`;
    setOverlays((prev) => [...prev, { id, text: pendingText.trim(), x: 50, y: 50, color: textColor, size: 48 }]);
    setPendingText('');
    setEditingTextId(null);
  }

  function updateOverlayPos(id: string, x: number, y: number) {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)));
  }

  function removeOverlay(id: string) {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const fileName = `edited-${Date.now()}.${ext}`;
        onSave(blob, fileName);
      }
    }, 'image/jpeg', 0.92);
  }

  function resetAll() {
    setActiveFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setFlipH(false);
    setCropAspect(null);
    setOverlays([]);
  }

  const aspects = [
    { label: 'Serbest', value: null as number | null },
    { label: '1:1', value: 1 },
    { label: '4:5', value: 4 / 5 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
  ];

  const colors = ['#ffffff', '#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

  if (!loaded) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-900 flex items-center justify-center">
        <div className="text-white text-sm animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={onCancel} className="p-2 text-white/80 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-white font-semibold text-sm">Düzenle</h2>
        <button onClick={handleSave} className="p-2 text-emerald-400 hover:text-emerald-300">
          <Check className="w-6 h-6" />
        </button>
      </div>

      {/* Canvas preview */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4 relative">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain rounded-lg"
          style={{ touchAction: 'none' }}
        />
        {overlays.map((ov) => (
          <div
            key={ov.id}
            className="absolute cursor-move select-none"
            style={{
              left: `${ov.x}%`,
              top: `${ov.y}%`,
              transform: 'translate(-50%, -50%)',
              color: ov.color,
              fontSize: `${ov.size * 0.3}px`,
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              touchAction: 'none',
            }}
            draggable
            onDragEnd={(e) => {
              const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              updateOverlayPos(ov.id, Math.max(5, Math.min(95, x)), Math.max(5, Math.min(95, y)));
            }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0];
              const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
              const x = ((touch.clientX - rect.left) / rect.width) * 100;
              const y = ((touch.clientY - rect.top) / rect.height) * 100;
              updateOverlayPos(ov.id, Math.max(5, Math.min(95, x)), Math.max(5, Math.min(95, y)));
            }}
          >
            {ov.text}
            <button
              onClick={() => removeOverlay(ov.id)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Text input */}
      {editingTextId === 'new' && (
        <div className="px-4 py-3 bg-slate-800 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={pendingText}
            onChange={(e) => setPendingText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addText()}
            placeholder="Metin yaz..."
            autoFocus
            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg text-sm focus:outline-none"
          />
          <button onClick={addText} className="p-2 bg-emerald-500 text-white rounded-lg">
            <Check className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tools bar */}
      <div className="flex items-center justify-around px-4 py-2 border-t border-white/10 shrink-0">
        <button
          onClick={() => setTool('filter')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${tool === 'filter' ? 'text-emerald-400' : 'text-white/60'}`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px]">Filtre</span>
        </button>
        <button
          onClick={() => setTool('crop')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${tool === 'crop' ? 'text-emerald-400' : 'text-white/60'}`}
        >
          <Crop className="w-5 h-5" />
          <span className="text-[10px]">Kırp</span>
        </button>
        <button
          onClick={() => { setTool('text'); setEditingTextId('new'); }}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${tool === 'text' ? 'text-emerald-400' : 'text-white/60'}`}
        >
          <Type className="w-5 h-5" />
          <span className="text-[10px]">Metin</span>
        </button>
        <button
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-white/60"
        >
          <RotateCw className="w-5 h-5" />
          <span className="text-[10px]">Döndür</span>
        </button>
        <button
          onClick={() => setFlipH((f) => !f)}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${flipH ? 'text-emerald-400' : 'text-white/60'}`}
        >
          <FlipHorizontal className="w-5 h-5" />
          <span className="text-[10px]">Çevir</span>
        </button>
      </div>

      {/* Tool panels */}
      <div className="bg-slate-800 px-4 py-3 max-h-[30vh] overflow-y-auto shrink-0">
        {tool === 'filter' && (
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => {
                    setActiveFilter(f.name);
                    if (f.name !== 'none') {
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                    }
                  }}
                  className={`shrink-0 flex flex-col items-center gap-1.5 ${activeFilter === f.name ? 'opacity-100' : 'opacity-60'}`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden border-2" style={{ borderColor: activeFilter === f.name ? '#10b981' : 'transparent' }}>
                    <img
                      src={imgRef.current?.src}
                      alt={f.label}
                      className="w-full h-full object-cover"
                      style={{ filter: f.css }}
                    />
                  </div>
                  <span className={`text-[10px] ${activeFilter === f.name ? 'text-emerald-400' : 'text-white/60'}`}>{f.label}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2 mt-3">
              <SliderRow label="Parlaklık" value={brightness} onChange={setBrightness} min={50} max={150} />
              <SliderRow label="Kontrast" value={contrast} onChange={setContrast} min={50} max={150} />
              <SliderRow label="Doygunluk" value={saturation} onChange={setSaturation} min={0} max={200} />
            </div>
          </div>
        )}

        {tool === 'crop' && (
          <div className="flex gap-2 flex-wrap">
            {aspects.map((a) => (
              <button
                key={a.label}
                onClick={() => setCropAspect(a.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  cropAspect === a.value ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white/70'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {tool === 'text' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setTextColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${textColor === c ? 'border-emerald-400' : 'border-white/20'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {overlays.length > 0 && (
              <p className="text-xs text-white/50">Metni sürükleyerek taşı. Silmek için x'a bas.</p>
            )}
          </div>
        )}

        <button
          onClick={resetAll}
          className="w-full mt-3 py-2 text-sm text-white/50 hover:text-white/80 border border-white/10 rounded-lg"
        >
          Sıfırla
        </button>
      </div>
    </div>
  );
}

function SliderRow({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60 w-20 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 accent-emerald-500"
      />
      <span className="text-xs text-white/40 w-8 text-right">{value}</span>
    </div>
  );
}
