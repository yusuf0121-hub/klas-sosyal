import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Stats = {
  likesGiven: number;
  likesReceived: number;
  commentsMade: number;
  commentsReceived: number;
  postsCreated: number;
  photosPosted: number;
  videosPosted: number;
  savesCount: number;
  sharesCount: number;
  dmSent: number;
  followers: number;
  following: number;
  groupsJoined: number;
  groupsCreated: number;
  profilesVisited: number;
  accountAgeDays: number;
  loginStreak: number;
  hasAvatar: boolean;
  hasBio: boolean;
  hasBanner: boolean;
  hasCity: boolean;
  hasInterests: boolean;
  hasSocialLink: boolean;
  isVerified: boolean;
};

async function loadStats(userId: string): Promise<Stats> {
  const [
    { count: likesGiven },
    { count: commentsMade },
    { count: postsCreated },
    { count: photosPosted },
    { count: videosPosted },
    { count: savesCount },
    { count: sharesCount },
    { count: dmSent },
    { count: followers },
    { count: following },
    { count: groupsJoined },
    { count: groupsCreated },
  ] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('image_url', 'is', null),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('video_url', 'is', null),
    supabase.from('saved_posts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('shares').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('conversation_members').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('conversation.type', 'group'),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('created_by', userId).eq('type', 'group'),
  ]);

  // Likes received: sum of likes on my posts
  const { data: myPostIds } = await supabase.from('posts').select('id').eq('user_id', userId);
  const postIdList = (myPostIds ?? []).map((p) => p.id);
  let likesReceived = 0;
  let commentsReceived = 0;
  if (postIdList.length > 0) {
    const [{ count: lr }, { count: cr }] = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).in('post_id', postIdList),
      supabase.from('comments').select('*', { count: 'exact', head: true }).in('post_id', postIdList),
    ]);
    likesReceived = lr ?? 0;
    commentsReceived = cr ?? 0;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  const accountAgeDays = profile
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    likesGiven: likesGiven ?? 0,
    likesReceived,
    commentsMade: commentsMade ?? 0,
    commentsReceived,
    postsCreated: postsCreated ?? 0,
    photosPosted: photosPosted ?? 0,
    videosPosted: videosPosted ?? 0,
    savesCount: savesCount ?? 0,
    sharesCount: sharesCount ?? 0,
    dmSent: dmSent ?? 0,
    followers: followers ?? 0,
    following: following ?? 0,
    groupsJoined: groupsJoined ?? 0,
    groupsCreated: groupsCreated ?? 0,
    profilesVisited: 0,
    accountAgeDays,
    loginStreak: profile?.login_streak ?? 0,
    hasAvatar: !!profile?.avatar_url,
    hasBio: !!profile?.bio,
    hasBanner: !!profile?.banner_url,
    hasCity: !!profile?.city,
    hasInterests: (profile?.interests?.length ?? 0) >= 3,
    hasSocialLink: !!profile?.social_link,
    isVerified: profile?.verified ?? false,
  };
}

type BadgeRule = { id: number; check: (s: Stats) => boolean };

const THRESHOLDS = {
  likesGiven: [10, 50, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000],
  likesReceived: [10, 50, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000],
  savesCount: [5, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  sharesCount: [5, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  commentsMade: [5, 25, 100, 250, 500, 1000, 2500, 5000, 10000, 25000],
  commentsReceived: [10, 50, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000],
  dmSent: [10, 50, 250, 1000, 2500, 5000, 10000, 25000, 50000, 100000],
  photosPosted: [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  videosPosted: [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  followers: [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 1000000],
  following: [10, 50, 100, 250, 500, 1000, 2500, 5000, 7500, 999999],
};

function buildRules(): BadgeRule[] {
  const rules: BadgeRule[] = [];

  (['likesGiven', 'likesReceived', 'savesCount', 'sharesCount'] as const).forEach((key, catIdx) => {
    const base = catIdx * 10 + 1;
    THRESHOLDS[key].forEach((threshold, i) => {
      rules.push({ id: base + i, check: (s) => s[key] >= threshold });
    });
  });

  // 41-50: Gezgin - we don't track profile visits yet, skip for now
  for (let i = 41; i <= 50; i++) rules.push({ id: i, check: () => false });

  (['commentsMade', 'commentsReceived'] as const).forEach((key, catIdx) => {
    const base = 51 + catIdx * 10;
    THRESHOLDS[key].forEach((threshold, i) => {
      rules.push({ id: base + i, check: (s) => s[key] >= threshold });
    });
  });

  // 71-80: Filozof (comment likes - not yet tracked)
  for (let i = 71; i <= 80; i++) rules.push({ id: i, check: () => false });

  THRESHOLDS.dmSent.forEach((threshold, i) => {
    rules.push({ id: 81 + i, check: (s) => s.dmSent >= threshold });
  });

  // 91-100: İşaretçi (mentions - not yet tracked)
  for (let i = 91; i <= 100; i++) rules.push({ id: i, check: () => false });

  THRESHOLDS.photosPosted.forEach((threshold, i) => {
    rules.push({ id: 101 + i, check: (s) => s.photosPosted >= threshold });
  });
  THRESHOLDS.videosPosted.forEach((threshold, i) => {
    rules.push({ id: 111 + i, check: (s) => s.videosPosted >= threshold });
  });

  // 121-150: Stories, live streams, polls - not yet implemented
  for (let i = 121; i <= 150; i++) rules.push({ id: i, check: () => false });

  THRESHOLDS.followers.forEach((threshold, i) => {
    rules.push({ id: 151 + i, check: (s) => s.followers >= threshold });
  });
  THRESHOLDS.following.forEach((threshold, i) => {
    rules.push({ id: 161 + i, check: (s) => i === 9 ? false : s.following >= threshold });
  });

  // 171-180: Elçi (invites - not tracked)
  for (let i = 171; i <= 180; i++) rules.push({ id: i, check: () => false });

  // 181-190: Toplulukçu
  rules.push({ id: 181, check: (s) => s.groupsJoined >= 1 });
  rules.push({ id: 182, check: (s) => s.groupsJoined >= 5 });
  rules.push({ id: 183, check: (s) => s.groupsJoined >= 10 });
  rules.push({ id: 184, check: (s) => s.groupsCreated >= 1 });
  // 185-190: group member counts - not yet tracked
  for (let i = 185; i <= 190; i++) rules.push({ id: i, check: () => false });

  // 191-200: Profile completion badges
  rules.push({ id: 191, check: () => true }); // Has display name (always true)
  rules.push({ id: 192, check: (s) => s.hasAvatar });
  rules.push({ id: 193, check: (s) => s.hasBanner });
  rules.push({ id: 194, check: (s) => s.hasBio });
  rules.push({ id: 195, check: (s) => s.hasInterests });
  rules.push({ id: 196, check: (s) => s.hasCity });
  // 197-200: phone verification, email verification, social link, verified
  for (let i = 197; i <= 198; i++) rules.push({ id: i, check: () => false });
  rules.push({ id: 199, check: (s) => s.hasSocialLink });
  rules.push({ id: 200, check: (s) => s.isVerified });

  // 201-210: İstikrar (login streak)
  [3, 7, 14, 30, 60, 90, 180, 365, 500, 1000].forEach((days, i) => {
    rules.push({ id: 201 + i, check: (s) => s.loginStreak >= days });
  });

  // 211-220: Kıdem (account age in days)
  [30, 180, 365, 730, 1095, 1460, 1825, 2555, 3650, 5475].forEach((days, i) => {
    rules.push({ id: 211 + i, check: (s) => s.accountAgeDays >= days });
  });

  // 221-250: Keşif, Bekçi, special tasks - not yet trackable
  for (let i = 221; i <= 250; i++) rules.push({ id: i, check: () => false });

  return rules;
}

const RULES = buildRules();

export function useBadgeChecker() {
  const { user } = useAuth();

  const checkAndAward = useCallback(async (): Promise<number[]> => {
    if (!user) return [];
    const stats = await loadStats(user.id);

    const { data: existing } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user.id);
    const existingSet = new Set((existing ?? []).map((b) => b.badge_id));

    const newlyEarned: number[] = [];
    for (const rule of RULES) {
      if (!existingSet.has(rule.id) && rule.check(stats)) {
        await supabase.rpc('award_badge', { p_badge_id: rule.id });
        newlyEarned.push(rule.id);
      }
    }

    return newlyEarned;
  }, [user]);

  return { checkAndAward };
}
