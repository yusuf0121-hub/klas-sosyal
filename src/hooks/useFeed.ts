import { useCallback, useEffect, useState } from 'react';
import { supabase, type Post } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function useFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('posts')
      .select('*, profile:profiles!posts_user_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (err) {
      setError('Gönderiler yüklenemedi.');
      setPosts([]);
      setLoading(false);
      return;
    }

    const postIds = (data ?? []).map((p) => p.id);
    if (postIds.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const [{ data: likes }, { data: myLikes }, { data: comments }, { data: shares }, { data: mySaves }] = await Promise.all([
      supabase.from('likes').select('post_id').in('post_id', postIds),
      user
        ? supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id)
        : Promise.resolve({ data: [], error: null }),
      supabase.from('comments').select('post_id').in('post_id', postIds),
      supabase.from('shares').select('post_id').in('post_id', postIds),
      user
        ? supabase.from('saved_posts').select('post_id').in('post_id', postIds).eq('user_id', user.id)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const likeMap = new Map<string, number>();
    (likes ?? []).forEach((l) => likeMap.set(l.post_id, (likeMap.get(l.post_id) ?? 0) + 1));

    const myLikeSet = new Set((myLikes ?? []).map((l) => l.post_id));

    const commentMap = new Map<string, number>();
    (comments ?? []).forEach((c) => commentMap.set(c.post_id, (commentMap.get(c.post_id) ?? 0) + 1));

    const shareMap = new Map<string, number>();
    (shares ?? []).forEach((s) => shareMap.set(s.post_id, (shareMap.get(s.post_id) ?? 0) + 1));

    const mySaveSet = new Set((mySaves ?? []).map((s) => s.post_id));

    const enriched: Post[] = (data ?? []).map((p) => ({
      ...p,
      profile: p.profile as Post['profile'],
      like_count: likeMap.get(p.id) ?? 0,
      comment_count: commentMap.get(p.id) ?? 0,
      share_count: shareMap.get(p.id) ?? 0,
      liked_by_me: myLikeSet.has(p.id),
      saved_by_me: mySaveSet.has(p.id),
    }));

    setPosts(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return { posts, loading, error, reload: loadPosts };
}

export function useReels() {
  const { user } = useAuth();
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReels = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profile:profiles!posts_user_id_fkey(*)')
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    const postIds = (data ?? []).map((p) => p.id);
    if (postIds.length === 0) {
      setReels([]);
      setLoading(false);
      return;
    }

    const [{ data: likes }, { data: myLikes }, { data: comments }] = await Promise.all([
      supabase.from('likes').select('post_id').in('post_id', postIds),
      user
        ? supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id)
        : Promise.resolve({ data: [], error: null }),
      supabase.from('comments').select('post_id').in('post_id', postIds),
    ]);

    const likeMap = new Map<string, number>();
    (likes ?? []).forEach((l) => likeMap.set(l.post_id, (likeMap.get(l.post_id) ?? 0) + 1));
    const myLikeSet = new Set((myLikes ?? []).map((l) => l.post_id));
    const commentMap = new Map<string, number>();
    (comments ?? []).forEach((c) => commentMap.set(c.post_id, (commentMap.get(c.post_id) ?? 0) + 1));

    setReels((data ?? []).map((p) => ({
      ...p,
      profile: p.profile as Post['profile'],
      like_count: likeMap.get(p.id) ?? 0,
      comment_count: commentMap.get(p.id) ?? 0,
      liked_by_me: myLikeSet.has(p.id),
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  return { reels, loading, reload: loadReels };
}
