-- 创建社区用户资料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 创建触发器，在创建新用户时自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'user_name', 'user_' || substr(new.id::text, 1, 8)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 创建社区习惯分享表
CREATE TABLE IF NOT EXISTS public.shared_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency JSONB NOT NULL,
  energy_value INTEGER NOT NULL,
  public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 创建社区帖子表
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shared_habit_id UUID REFERENCES public.shared_habits(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 创建帖子评论表
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 创建用户关注表
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) NOT NULL,
  following_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- 创建习惯进度分享表
CREATE TABLE IF NOT EXISTS public.habit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  habit_id TEXT NOT NULL, -- 本地习惯ID
  name TEXT NOT NULL,
  streak_days INTEGER NOT NULL,
  completed_count INTEGER NOT NULL,
  energy_earned INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 创建点赞表
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  post_id UUID REFERENCES public.posts(id),
  comment_id UUID REFERENCES public.comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  -- 确保一个用户只能给一个内容点一次赞
  CONSTRAINT one_like_per_content CHECK (
    (post_id IS NULL AND comment_id IS NOT NULL) OR
    (post_id IS NOT NULL AND comment_id IS NULL)
  ),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

-- 设置RLS策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 用户资料
CREATE POLICY "用户资料对所有人可见" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "用户只能更新自己的资料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 创建RLS策略 - 分享的习惯
CREATE POLICY "公共习惯对所有人可见" ON public.shared_habits
  FOR SELECT USING (public = true);

CREATE POLICY "用户可以查看自己的所有习惯" ON public.shared_habits
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "用户可以创建自己的习惯" ON public.shared_habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的习惯" ON public.shared_habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的习惯" ON public.shared_habits
  FOR DELETE USING (auth.uid() = user_id);

-- 创建RLS策略 - 帖子
CREATE POLICY "所有人可以查看帖子" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "用户可以创建帖子" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的帖子" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的帖子" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- 创建RLS策略 - 评论
CREATE POLICY "所有人可以查看评论" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "用户可以创建评论" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的评论" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的评论" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- 创建RLS策略 - 关注
CREATE POLICY "用户可以查看自己的关注列表" ON public.follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "用户可以添加关注" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "用户可以取消关注" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 创建RLS策略 - 习惯进度
CREATE POLICY "所有人可以查看习惯进度" ON public.habit_progress
  FOR SELECT USING (true);

CREATE POLICY "用户可以创建自己的习惯进度" ON public.habit_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建RLS策略 - 点赞
CREATE POLICY "所有人可以查看点赞" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "用户可以创建点赞" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的点赞" ON public.likes
  FOR DELETE USING (auth.uid() = user_id); 