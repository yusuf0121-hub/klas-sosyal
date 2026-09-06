import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  display_name: string;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  city: string | null;
  interests: string[] | null;
  social_link: string | null;
  verified: boolean;
  birth_date: string | null;
  coins: number;
  last_login_at: string | null;
  login_streak: number;
  is_admin: boolean;
  is_vip: boolean;
  theme_id: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  banned_until: string | null;
  created_at: string;
};

export type PurchasedTheme = {
  id: string;
  user_id: string;
  theme_id: string;
  purchased_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  is_reel: boolean;
  created_at: string;
  profile?: Profile;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  profile?: Profile;
  replies?: Comment[];
};

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow';
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
};

export type Reaction = {
  id: string;
  post_id: string;
  user_id: string;
  type: 'like' | 'love' | 'wow' | 'funny' | 'sad';
  created_at: string;
};

export type DailyTask = {
  id: string;
  user_id: string;
  task_type: 'post' | 'comment' | 'like' | 'follow' | 'play_game';
  target_count: number;
  progress: number;
  completed: boolean;
  reward_coins: number;
  task_date: string;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  post_id: string | null;
  reported_user_id: string | null;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: Profile;
  post?: Post;
  reported_user?: Profile;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  members?: Profile[];
  last_message?: Message;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  profile?: Profile;
};

export type Call = {
  id: string;
  conversation_id: string;
  caller_id: string;
  status: 'initiated' | 'accepted' | 'ended' | 'missed';
  started_at: string;
  ended_at: string | null;
};

export type Game = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  category: string | null;
  slug: string;
  html_content: string | null;
  created_by: string | null;
  created_at: string;
};

export type UserGame = {
  id: string;
  game_id: string;
  user_id: string;
  purchased_at: string;
};

export type CoinTransaction = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  description: string | null;
  created_at: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: number;
  awarded_at: string;
};
