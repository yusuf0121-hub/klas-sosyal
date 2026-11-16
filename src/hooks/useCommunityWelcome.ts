import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

type WelcomeData = {
  dismissed: boolean;
  postCount: number;
  followingCount: number;
  acceptedInviteCount: number;
  inviteCode: string | null;
};

export function useCommunityWelcome(userId: string | undefined) {
  const key = userId ? `community-welcome:${userId}` : null;
  const { data, error, isLoading, mutate } = useSWR<WelcomeData>(key, async () => {
    if (!userId) throw new Error('Oturum gerekli.');

    const [onboarding, posts, follows, inviteStats, inviteCode] = await Promise.all([
      supabase.from('user_onboarding').select('dismissed').eq('user_id', userId).maybeSingle(),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('referral_invites').select('id', { count: 'exact', head: true }).eq('inviter_id', userId).not('invited_user_id', 'is', null),
      supabase.from('referral_invites').select('invite_code').eq('inviter_id', userId).maybeSingle(),
    ]);

    const queryError = onboarding.error ?? posts.error ?? follows.error ?? inviteStats.error ?? inviteCode.error;
    if (queryError) throw queryError;

    return {
      dismissed: onboarding.data?.dismissed ?? false,
      postCount: posts.count ?? 0,
      followingCount: follows.count ?? 0,
      acceptedInviteCount: inviteStats.count ?? 0,
      inviteCode: inviteCode.data?.invite_code ?? null,
    };
  });

  return { data, error, isLoading, mutate };
}
