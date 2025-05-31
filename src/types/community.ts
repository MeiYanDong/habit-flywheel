import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SharedHabit = Database["public"]["Tables"]["shared_habits"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type HabitProgress = Database["public"]["Tables"]["habit_progress"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];

// 扩展类型，包含作者信息
export type PostWithAuthor = Post & {
  author: Profile;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
};

export type CommentWithAuthor = Comment & {
  author: Profile;
  likes_count: number;
  user_has_liked: boolean;
};

export type SharedHabitWithAuthor = SharedHabit & {
  author: Profile;
};

// 社区用户类型，包含关注信息
export type CommunityUser = Profile & {
  followers_count: number;
  following_count: number;
  is_following: boolean;
};

// 分页结果类型
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
} 