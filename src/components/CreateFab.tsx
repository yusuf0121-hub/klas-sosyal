import { Plus } from 'lucide-react';

type Props = {
  onClick: () => void;
};

/**
 * Paylaş (+) aksiyonu: alt barın hemen üstünde, sağ altta yüzen buton.
 */
export default function CreateFab({ onClick }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="max-w-xl mx-auto relative px-4">
        <button
          onClick={onClick}
          aria-label="Yeni gönderi paylaş"
          className="pointer-events-auto absolute right-4 bottom-[4.75rem] w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-xl shadow-sky-500/25 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
