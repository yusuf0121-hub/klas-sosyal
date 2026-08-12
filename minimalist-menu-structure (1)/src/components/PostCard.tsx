import { useState, useRef } from 'react';
import {
  Heart, MessageCircle, Trash2, Send, Bookmark, Share2, BadgeCheck,
  ThumbsUp, Laugh, Smile, Frown, Flag, Reply, CornerDownRight, X,
} from 'lucide-react';
import { supabase, type Post, type Comment } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/ThemeProvider';
import { timeAgo } from '@/lib/utils';
import Avatar from './Avatar';

type ReactionType = 'like' | 'love' | 'wow' | 'funny' | 'sad';

const REACTIONS: { type: ReactionType; label: string; icon: typeof ThumbsUp; color: string; emoji: string }[] = [
  { type: 'like', label: 'Sevdim', icon: ThumbsUp, color: '#3b82f6', emoji: '👍' },
  { type: 'love', label: 'Harika', icon: Heart, color: '#ef4444', emoji: '❤️' },
  { type: 'wow', label: 'Vay be', icon: Smile, color: '#f59e0b', emoji: '😮' },
  { type: 'funny', label: 'Komik', icon: Laugh, color: '#8b5cf6', emoji: '😂' },
  { type: 'sad', label: 'Üzgün', icon: Frown, color: '#64748b', emoji: '😢' },
];

type Props = {
  post: Post;
  onProfileClick?: (userId: string) => void;
  onPostDeleted?: () => void;
};

export default function PostCard({ post, onProfileClick, onPostDeleted }: Props) {
  const { user } = useAuth();
  const { isDark, textColor, subtextColor, cardBg, cardBorder } = useTheme();
  const [liked, setLiked] = useState(post.liked_by_me ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [saved, setSaved] = useState(post.saved_by_me ?? false);
  const [shareCount, setShareCount] = useState(post.share_count ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0);
  const [postingComment, setPostingComment] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null);
  const [heartBurst, setHeartBurst] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function toggleLike() {
    if (!user) return;
    if (liked || currentReaction) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      setCurrentReaction(null);
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 400);
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
    }
  }

  async function handleReaction(type: ReactionType) {
    if (!user) return;
    const wasReacting = liked || currentReaction !== null;

    if (currentReaction === type) {
      // Same reaction: remove
      setCurrentReaction(null);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase.from('reactions').delete().eq('post_id', post.id).eq('user_id', user.id);
      // Also remove from likes table for compatibility
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      setCurrentReaction(type);
      if (!wasReacting) {
        setLikeCount((c) => c + 1);
        if (type === 'like') {
          setLiked(true);
          setHeartBurst(true);
          setTimeout(() => setHeartBurst(false), 400);
        }
      }
      // Insert into reactions table
      await supabase.from('reactions')
        .upsert({ post_id: post.id, user_id: user.id, type }, { onConflict: 'post_id,user_id' });
      // Also sync likes table for backward compatibility
      if (type === 'like') {
        await supabase.from('likes').upsert({ post_id: post.id, user_id: user.id }, { onConflict: 'post_id,user_id' });
      } else {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      }
    }
    setShowReactions(false);
  }

  function showReactionPicker() {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setShowReactions(true);
  }

  function hideReactionPicker() {
    reactionTimer.current = setTimeout(() => setShowReactions(false), 300);
  }

  async function toggleSave() {
    if (!user) return;
    if (saved) {
      setSaved(false);
      await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      setSaved(true);
      await supabase.from('saved_posts').insert({ post_id: post.id, user_id: user.id });
    }
  }

  async function sharePost() {
    if (!user) return;
    setShareCount((c) => c + 1);
    await supabase.from('shares').insert({ post_id: post.id, user_id: user.id });
  }

  async function loadComments() {
    setCommentsLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles!comments_user_id_fkey(*)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    const allComments = (data ?? []) as unknown as Comment[];
    // Build nested structure
    const topLevel = allComments.filter((c) => !c.parent_comment_id);
    const replies = allComments.filter((c) => c.parent_comment_id);
    const nested = topLevel.map((c) => ({
      ...c,
      replies: replies.filter((r) => r.parent_comment_id === c.id),
    }));
    setComments(nested);
    setCommentsLoading(false);
  }

  function toggleComments() {
    if (!showComments) loadComments();
    setShowComments(!showComments);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setPostingComment(true);
    const insertData: Record<string, string> = {
      post_id: post.id,
      user_id: user.id,
      content: commentText.trim(),
    };
    if (replyTo) insertData.parent_comment_id = replyTo.id;

    const { data } = await supabase
      .from('comments')
      .insert(insertData)
      .select('*, profile:profiles!comments_user_id_fkey(*)')
      .single();
    if (data) {
      const newComment = data as unknown as Comment;
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies ?? []), newComment] }
              : c
          )
        );
      } else {
        setComments((prev) => [...prev, { ...newComment, replies: [] }]);
      }
      setCommentCount((c) => c + 1);
      setCommentText('');
      setReplyTo(null);
    }
    setPostingComment(false);
  }

  async function deletePost() {
    if (!user || post.user_id !== user.id) return;
    await supabase.from('posts').delete().eq('id', post.id);
    onPostDeleted?.();
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !reportReason.trim()) return;
    await supabase.from('reports').insert({
      reporter_id: user.id,
      post_id: post.id,
      reported_user_id: post.user_id,
      reason: reportReason.trim(),
    });
    setShowReportModal(false);
    setReportReason('');
  }

  const hasMedia = post.image_url || post.video_url;
  const activeReaction = REACTIONS.find((r) => r.type === currentReaction);
  const neonClass = hasMedia && isDark ? 'neon-pulse-glow' : '';

  return (
    <article
      className={`rounded-2xl overflow-hidden transition-shadow ${neonClass}`}
      style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => onProfileClick?.(post.user_id)} className="shrink-0">
          <div className={isDark ? 'neon-profile-ring rounded-full' : ''}>
            <Avatar name={post.profile?.display_name ?? '?'} id={post.user_id} url={post.profile?.avatar_url} size="md" />
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onProfileClick?.(post.user_id)}
              className="font-semibold text-sm hover:underline truncate"
              style={{ color: textColor }}
            >
              {post.profile?.display_name}
            </button>
            {post.profile?.verified && <BadgeCheck className="w-4 h-4 text-sky-500 shrink-0" />}
          </div>
          <p className="text-xs" style={{ color: subtextColor }}>{timeAgo(post.created_at)}</p>
        </div>
        {user?.id === post.user_id ? (
          <button
            onClick={deletePost}
            className="p-2 rounded-lg transition-colors hover:bg-rose-500/10"
            style={{ color: subtextColor }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 rounded-lg transition-colors hover:bg-amber-500/10"
            style={{ color: subtextColor }}
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: textColor }}>{post.content}</p>
      </div>

      {/* Media with neon effects */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <div className={`rounded-xl overflow-hidden ${isDark ? 'neon-corner-lasers' : ''}`}>
            <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />
          </div>
        </div>
      )}

      {post.video_url && (
        <div className="px-4 pb-3">
          <div className={`rounded-xl overflow-hidden ${isDark ? 'neon-border-running' : ''}`}>
            <video src={post.video_url} controls playsInline className="w-full object-cover max-h-96 bg-black" />
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 px-2 py-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
        {/* Like with reaction picker */}
        <div
          className="relative"
          onMouseEnter={showReactionPicker}
          onMouseLeave={hideReactionPicker}
        >
          {showReactions && (
            <div
              className="absolute bottom-12 left-0 flex gap-1 p-2 rounded-2xl shadow-xl z-20"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              onMouseEnter={showReactionPicker}
              onMouseLeave={hideReactionPicker}
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:scale-125 transition-transform"
                  title={r.label}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="text-[8px] font-medium" style={{ color: subtextColor }}>{r.label}</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${heartBurst ? 'neon-heart-burst' : ''}`}
            style={{
              color: activeReaction ? activeReaction.color : (liked ? '#ef4444' : subtextColor),
              background: activeReaction ? `${activeReaction.color}15` : (liked ? '#ef444410' : 'transparent'),
            }}
          >
            {activeReaction ? (
              <activeReaction.icon className={`w-4 h-4 ${activeReaction.type === 'love' ? 'fill-current' : ''}`} />
            ) : (
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            )}
            {likeCount}
          </button>
        </div>

        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ color: subtextColor }}
        >
          <MessageCircle className="w-4 h-4" />
          {commentCount}
        </button>
        <button
          onClick={sharePost}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ color: subtextColor }}
        >
          <Share2 className="w-4 h-4" />
          {shareCount}
        </button>
        <button
          onClick={toggleSave}
          className="ml-auto flex items-center p-2 rounded-lg transition-all"
          style={{ color: saved ? '#f59e0b' : subtextColor }}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="p-3 space-y-3" style={{ borderTop: `1px solid ${cardBorder}`, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
          {commentsLoading ? (
            <p className="text-xs text-center py-2" style={{ color: subtextColor }}>Yükleniyor...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: subtextColor }}>Henüz yorum yok.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="space-y-2">
                <CommentItem
                  comment={c}
                  onProfileClick={onProfileClick}
                  onReply={() => setReplyTo(c)}
                  isDark={isDark}
                  textColor={textColor}
                  subtextColor={subtextColor}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                />
                {c.replies && c.replies.length > 0 && (
                  <div className="pl-6 space-y-2">
                    {c.replies.map((r) => (
                      <CommentItem
                        key={r.id}
                        comment={r}
                        onProfileClick={onProfileClick}
                        isReply
                        isDark={isDark}
                        textColor={textColor}
                        subtextColor={subtextColor}
                        cardBg={cardBg}
                        cardBorder={cardBorder}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Comment input */}
          <form onSubmit={submitComment} className="flex gap-2 pt-1">
            {replyTo && (
              <div className="flex items-center gap-1 text-xs mb-1" style={{ color: subtextColor }}>
                <CornerDownRight className="w-3 h-3" />
                <span>{replyTo.profile?.display_name} yanıtlanıyor</span>
                <button type="button" onClick={() => setReplyTo(null)} className="p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyTo ? 'Yanıt yaz...' : 'Yorum yaz...'}
              className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all"
              style={{
                background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                border: `1px solid ${cardBorder}`,
                color: textColor,
              }}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || postingComment}
              className="p-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowReportModal(false)}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6" style={{ background: cardBg }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: textColor }}>Gönderiyi Şikayet Et</h2>
              <button onClick={() => setShowReportModal(false)} className="p-1.5 rounded-lg">
                <X className="w-5 h-5" style={{ color: subtextColor }} />
              </button>
            </div>
            <form onSubmit={submitReport} className="space-y-3">
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Şikayet nedeninizi yazın..."
                rows={3}
                required
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none"
                style={{ background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', border: `1px solid ${cardBorder}`, color: textColor }}
              />
              <button
                type="submit"
                className="w-full py-3 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition-colors"
              >
                Şikayet Et
              </button>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}

function CommentItem({
  comment,
  onProfileClick,
  onReply,
  isReply,
  isDark,
  textColor,
  subtextColor,
  cardBg,
  cardBorder,
}: {
  comment: Comment;
  onProfileClick?: (id: string) => void;
  onReply?: () => void;
  isReply?: boolean;
  isDark: boolean;
  textColor: string;
  subtextColor: string;
  cardBg: string;
  cardBorder: string;
}) {
  return (
    <div className={`flex gap-2.5 ${isReply ? '' : ''}`}>
      <Avatar name={comment.profile?.display_name ?? '?'} id={comment.user_id} url={comment.profile?.avatar_url} size="sm" />
      <div className="flex-1 rounded-xl px-3 py-2" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}` }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onProfileClick?.(comment.user_id)}
            className="font-semibold text-xs hover:underline"
            style={{ color: textColor }}
          >
            {comment.profile?.display_name}
          </button>
          <span className="text-xs" style={{ color: subtextColor }}>{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm mt-0.5 whitespace-pre-wrap break-words" style={{ color: textColor }}>{comment.content}</p>
        {onReply && !isReply && (
          <button
            onClick={onReply}
            className="flex items-center gap-1 mt-1 text-xs hover:underline"
            style={{ color: subtextColor }}
          >
            <Reply className="w-3 h-3" /> Yanıtla
          </button>
        )}
      </div>
    </div>
  );
}
