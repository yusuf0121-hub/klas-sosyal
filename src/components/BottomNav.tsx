import { Home, Search, User } from 'lucide-react';

/**
 * Ana navigasyon sadece 3 sekmeden oluşur (Ultra Minimalist Model).
 * - Paylaş (+)  -> sağ altta yüzen FAB (CreateFab)
 * - Mesaj/Bildirim -> üst sağ header (AppHeader)
 * - Oyun/Tema  -> Profil sekmesi içindeki sekmeler
 */
export type Tab = 'home' | 'search' | 'profile';

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

const ITEMS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Akış', icon: Home },
  { id: 'search', label: 'Keşfet', icon: Search },
  { id: 'profile', label: 'Profil', icon: User },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg border-t"
      style={{
        paddingBottom: 'var(--safe-area-bottom)',
        background: 'var(--nav-bg, rgba(255,255,255,0.9))',
        borderColor: 'var(--nav-border, #f1f5f9)',
      }}
      aria-label="Ana navigasyon"
    >
      <div className="max-w-xl mx-auto flex items-stretch px-2 py-1.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex-1 flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all group"
            >
              <div className={`relative ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'} transition-transform`}>
                <Icon
                  className={`w-[24px] h-[24px] ${isActive ? 'text-amber-500' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={!isActive ? { color: 'var(--nav-inactive, #94a3b8)' } : undefined}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${isActive ? 'text-amber-500' : ''}`}
                style={!isActive ? { color: 'var(--nav-inactive, #94a3b8)' } : undefined}
              >
                {item.label}
              </span>
              {isActive && <span className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-amber-500" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
