import { useEffect, useState, useRef } from 'react';
import { Gamepad2, Lock, Play, ArrowLeft as ArrowLeftIcon, Plus, Trash2, X, User, Code, Maximize2 } from 'lucide-react';
import { Coin } from '@/lib/customIcons';
import { supabase, type Game, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import SnakeGame from '@/games/SnakeGame';
import TicTacToe from '@/games/TicTacToe';
import MemoryGame from '@/games/MemoryGame';
import FlappyGame from '@/games/FlappyGame';

const PLAYABLE_SLUGS = ['snake', 'tictactoe', 'memory', 'flappy'];

const GAME_GENRES = [
  { slug: 'aksiyon', label: 'Aksiyon', desc: 'Hızlı refleks, mücadele ve el-göz koordinasyonu' },
  { slug: 'rpg', label: 'Rol Yapma (RPG)', desc: 'Karakter geliştirme ve hikaye odaklı' },
  { slug: 'strateji', label: 'Strateji', desc: 'Kaynak yönetimi ve taktik zeka' },
  { slug: 'simulasyon', label: 'Simülasyon', desc: 'Gerçek hayat taklitleri' },
  { slug: 'macera', label: 'Macera', desc: 'Keşif, bulmaca ve hikaye' },
];

const HTML_EXAMPLE = `<!-- HTML, CSS ve JavaScript ile oyununu yaz -->
<style>
  #game { font-family: sans-serif; text-align: center; }
  button { font-size: 20px; padding: 12px 24px; margin: 8px; }
</style>
<div id="game">
  <h2>Sayaç Oyunu</h2>
  <p>Skor: <span id="score">0</span></p>
  <button onclick="document.getElementById('score').textContent = ++window._s">Tıkla!</button>
</div>`;

type Props = {
  onProfileClick: (userId: string) => void;
};

export default function GamesScreen({ onProfileClick }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [creators, setCreators] = useState<Record<string, Profile>>({});
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [genreFilter, setGenreFilter] = useState<string>('all');

  // Create game form
  const [gameTitle, setGameTitle] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gamePrice, setGamePrice] = useState('10');
  const [gameGenre, setGameGenre] = useState('aksiyon');
  const [gameHtml, setGameHtml] = useState(HTML_EXAMPLE);
  const [creating, setCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadGames();
  }, [user]);

  async function loadGames() {
    if (!user) return;
    setLoading(true);
    const { data: gameList } = await supabase.from('games').select('*').order('created_at', { ascending: true });
    setGames(gameList ?? []);

    const { data: owned } = await supabase.from('user_games').select('game_id').eq('user_id', user.id);
    setOwnedIds(new Set((owned ?? []).map((o) => o.game_id)));

    // Fetch creator profiles
    const creatorIds = [...new Set((gameList ?? []).map((g) => g.created_by).filter(Boolean))] as string[];
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', creatorIds);
      const map: Record<string, Profile> = {};
      (profiles ?? []).forEach((p) => { map[p.id] = p; });
      setCreators(map);
    }

    setLoading(false);
  }

  async function buyGame(game: Game) {
    if (!user) return;
    setBuying(game.id);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('buy_game', { p_game_id: game.id });
    if (rpcError) {
      setError('Satın alma başarısız.');
    } else if (data && !data.success) {
      setError(data.error || 'Satın alma başarısız.');
    } else {
      setOwnedIds((prev) => new Set([...prev, game.id]));
      await refreshProfile();
    }
    setBuying(null);
  }

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !gameTitle.trim() || !gameHtml.trim()) return;
    setCreating(true);
    setError(null);

    const genre = GAME_GENRES.find((g) => g.slug === gameGenre);
    const { data, error: insertError } = await supabase
      .from('games')
      .insert({
        title: gameTitle.trim(),
        description: gameDesc.trim() || '',
        price: Math.max(0, parseInt(gamePrice) || 0),
        slug: 'custom',
        html_content: gameHtml.trim(),
        category: genre?.label || 'Topluluk',
        created_by: user.id,
      })
      .select('*')
      .single();

    if (insertError) {
      setError('Oyun oluşturulamadı: ' + insertError.message);
    } else if (data) {
      await supabase.from('user_games').insert({ game_id: data.id, user_id: user.id });
      setOwnedIds((prev) => new Set([...prev, data.id]));
      setGames((prev) => [...prev, data as Game]);
      setCreators((prev) => ({ ...prev, [user.id]: profile! }));
      setShowCreate(false);
      setGameTitle('');
      setGameDesc('');
      setGamePrice('10');
      setGameHtml(HTML_EXAMPLE);
    }
    setCreating(false);
  }

  async function deleteGame(game: Game) {
    if (!user || game.created_by !== user.id) return;
    await supabase.from('games').delete().eq('id', game.id);
    setGames((prev) => prev.filter((g) => g.id !== game.id));
  }

  function renderPreview() {
    if (!previewRef.current) return;
    const doc = previewRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(gameHtml);
    doc.close();
  }

  if (playingGame) {
    const props = { onBack: () => setPlayingGame(null) };
    const creator = playingGame.created_by ? creators[playingGame.created_by] : null;

    return (
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        <button
          onClick={() => setPlayingGame(null)}
          className="flex items-center gap-2 mb-4 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Oyunlara dön</span>
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">{playingGame.title}</h1>
          {playingGame.category && (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
              {playingGame.category}
            </span>
          )}
        </div>
        {creator && (
          <button
            onClick={() => onProfileClick(creator.id)}
            className="flex items-center gap-2 mb-4 group"
          >
            <Avatar name={creator.display_name} id={creator.id} url={creator.avatar_url} size="sm" />
            <div className="text-left">
              <p className="text-xs text-slate-400">Oyunu yapan</p>
              <p className="text-sm font-medium text-slate-700 group-hover:text-sky-500 transition-colors">{creator.display_name}</p>
            </div>
          </button>
        )}
        {playingGame.slug === 'snake' && <SnakeGame {...props} />}
        {playingGame.slug === 'tictactoe' && <TicTacToe {...props} />}
        {playingGame.slug === 'memory' && <MemoryGame {...props} />}
        {playingGame.slug === 'flappy' && <FlappyGame {...props} />}
        {playingGame.slug === 'custom' && playingGame.html_content && (
          <iframe
            srcDoc={playingGame.html_content}
            title={playingGame.title}
            className="w-full min-h-[500px] bg-white rounded-2xl border border-slate-100 shadow-sm"
            sandbox="allow-scripts"
          />
        )}
        {!PLAYABLE_SLUGS.includes(playingGame.slug) && playingGame.slug !== 'custom' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Bu oyun yakında geliyor!</p>
          </div>
        )}
      </div>
    );
  }

  const systemGames = games.filter((g) => !g.created_by);
  const communityGames = games.filter((g) => g.created_by);
  const myGames = communityGames.filter((g) => g.created_by === user?.id);
  const otherCommunityGames = communityGames.filter((g) => g.created_by !== user?.id);

  const filteredCommunity = genreFilter === 'all' ? otherCommunityGames : otherCommunityGames.filter((g) => {
    const genre = GAME_GENRES.find((gn) => gn.slug === genreFilter);
    return g.category === genre?.label;
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Oyunlar</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Coin className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600">{profile?.coins ?? 0} coin</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="p-2.5 bg-gradient-to-br from-emerald-400 to-sky-400 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
          {profile && (
            <button onClick={() => onProfileClick(user!.id)} className="shrink-0">
              <Avatar name={profile.display_name} id={user!.id} url={profile.avatar_url} size="md" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="w-full h-32 bg-slate-100 rounded-xl mb-3" />
              <div className="w-24 h-4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* System games */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 mb-3">Klasik Oyunlar</h2>
            <div className="grid grid-cols-2 gap-4">
              {systemGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  owned={ownedIds.has(game.id)}
                  canAfford={(profile?.coins ?? 0) >= game.price}
                  buying={buying === game.id}
                  onBuy={() => buyGame(game)}
                  onPlay={() => setPlayingGame(game)}
                />
              ))}
            </div>
          </div>

          {/* My games */}
          {myGames.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 mb-3">Senin Oyunların</h2>
              <div className="grid grid-cols-2 gap-4">
                {myGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    owned={true}
                    canAfford={true}
                    buying={false}
                    onBuy={() => {}}
                    onPlay={() => setPlayingGame(game)}
                    onDelete={() => deleteGame(game)}
                    creatorName={profile?.display_name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Community games */}
          {otherCommunityGames.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-500">Topluluk Oyunları</h2>
              </div>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                <button
                  onClick={() => setGenreFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    genreFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-100'
                  }`}
                >
                  Tümü
                </button>
                {GAME_GENRES.map((g) => (
                  <button
                    key={g.slug}
                    onClick={() => setGenreFilter(g.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      genreFilter === g.slug ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-100'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              {filteredCommunity.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Bu türde topluluk oyunu yok.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredCommunity.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      owned={ownedIds.has(game.id)}
                      canAfford={(profile?.coins ?? 0) >= game.price}
                      buying={buying === game.id}
                      onBuy={() => buyGame(game)}
                      onPlay={() => setPlayingGame(game)}
                      showCreator
                      creatorName={game.created_by ? creators[game.created_by]?.display_name : undefined}
                      creatorId={game.created_by ?? undefined}
                      onCreatorClick={onProfileClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Game Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Oyun Oluştur</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">HTML, CSS ve JavaScript kodu yazarak kendi oyununu oluştur. Satıldığında gelirin %80'i sana gider!</p>

            <form onSubmit={createGame} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Oyun Adı</label>
                <input
                  type="text"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="Örn: Süper Sayaç"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Açıklama</label>
                <input
                  type="text"
                  value={gameDesc}
                  onChange={(e) => setGameDesc(e.target.value)}
                  placeholder="Kısa açıklama (isteğe bağlı)"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Oyun Türü</label>
                <div className="flex gap-2 flex-wrap">
                  {GAME_GENRES.map((g) => (
                    <button
                      key={g.slug}
                      type="button"
                      onClick={() => setGameGenre(g.slug)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        gameGenre === g.slug ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-700' : 'bg-slate-50 border-2 border-transparent text-slate-600'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-400">HTML Kodu</label>
                  <button
                    type="button"
                    onClick={() => { setShowPreview(!showPreview); if (!showPreview) setTimeout(renderPreview, 100); }}
                    className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600"
                  >
                    <Maximize2 className="w-3 h-3" />
                    {showPreview ? 'Kod düzenle' : 'Önizleme'}
                  </button>
                </div>
                {showPreview ? (
                  <iframe
                    ref={previewRef}
                    title="Önizleme"
                    className="w-full min-h-[300px] bg-white border border-slate-200 rounded-xl"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <textarea
                    value={gameHtml}
                    onChange={(e) => setGameHtml(e.target.value)}
                    rows={12}
                    spellCheck={false}
                    className="w-full px-3 py-2.5 bg-slate-900 text-emerald-300 border border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all resize-y"
                    placeholder="HTML, CSS ve JavaScript kodunu buraya yaz..."
                  />
                )}
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  HTML, CSS ve JavaScript yazabilirsin. Önizleme ile test et.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Fiyat (Coin)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={gamePrice}
                    onChange={(e) => setGamePrice(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  />
                  <Coin className="w-5 h-5 text-amber-500 shrink-0" />
                </div>
                <p className="text-xs text-slate-400 mt-1">0 = Ücretsiz. Satıldığında %80 sana gelir.</p>
              </div>

              <button
                type="submit"
                disabled={!gameTitle.trim() || !gameHtml.trim() || creating}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-medium rounded-xl disabled:opacity-40 transition-all"
              >
                {creating ? 'Oluşturuluyor...' : 'Oyunu Oluştur'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GameCard({
  game,
  owned,
  canAfford,
  buying,
  onBuy,
  onPlay,
  onDelete,
  showCreator,
  creatorName,
  creatorId,
  onCreatorClick,
}: {
  game: Game;
  owned: boolean;
  canAfford: boolean;
  buying: boolean;
  onBuy: () => void;
  onPlay: () => void;
  onDelete?: () => void;
  showCreator?: boolean;
  creatorName?: string;
  creatorId?: string;
  onCreatorClick?: (userId: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative flex items-center justify-center">
        <Gamepad2 className="w-12 h-12 text-slate-300" />
        {game.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[10px] font-medium rounded-full backdrop-blur-sm">
            {game.category}
          </span>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-rose-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-slate-900 text-sm truncate">{game.title}</h3>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 h-8">{game.description}</p>
        {showCreator && creatorName && (
          <button
            onClick={() => creatorId && onCreatorClick?.(creatorId)}
            className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1 hover:text-emerald-600 transition-colors"
          >
            <User className="w-3 h-3" /> {creatorName}
          </button>
        )}
        {owned ? (
          <button
            onClick={onPlay}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-medium rounded-xl hover:shadow-md transition-all"
          >
            <Play className="w-4 h-4" /> Oyna
          </button>
        ) : (
          <button
            onClick={onBuy}
            disabled={buying || !canAfford}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            style={{
              background: canAfford ? 'linear-gradient(to right, #f59e0b, #f97316)' : '#f1f5f9',
              color: canAfford ? '#fff' : '#94a3b8',
            }}
          >
            {canAfford ? (
              <>
                <Coin className="w-4 h-4" /> {game.price}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> {game.price}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
