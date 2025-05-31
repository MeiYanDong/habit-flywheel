import { supabase } from "@/integrations/supabase/client";
import { 
  Profile, 
  SharedHabit, 
  Post, 
  Comment, 
  PostWithAuthor, 
  CommentWithAuthor, 
  SharedHabitWithAuthor,
  CommunityUser,
  PaginatedResult,
  HabitProgress
} from "@/types/community";

// 分页默认值
const DEFAULT_PAGE_SIZE = 10;

// 个人资料相关
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("获取个人资料失败:", error);
    return null;
  }

  return data;
};

export const updateProfile = async (profile: Partial<Profile>): Promise<Profile | null> => {
  console.log("开始更新用户资料:", profile.id);
  
  if (!profile.id) {
    console.error("更新资料失败: 缺少用户ID");
    return null;
  }

  try {
    // 检查用户资料是否存在
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profile.id)
      .maybeSingle();

    if (checkError) {
      console.error("检查用户资料失败:", checkError);
      throw checkError;
    }

    // 如果资料不存在，创建新资料
    if (!existingProfile) {
      console.log("用户资料不存在，创建新资料");
      
      const newProfileData = {
        id: profile.id,
        username: profile.username || `user_${profile.id.substring(0, 8)}`,
        avatar_url: profile.avatar_url || null,
        bio: profile.bio || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("将创建的新资料:", newProfileData);
      
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert(newProfileData)
        .select()
        .single();

      if (insertError) {
        console.error("创建用户资料失败:", insertError);
        throw insertError;
      }

      console.log("成功创建新资料:", newProfile);
      return newProfile;
    }

    console.log("找到现有资料，准备更新:", existingProfile);
    
    // 确保更新的数据格式正确
    const updateData = {
      ...(profile.username !== undefined && { username: profile.username }),
      ...(profile.bio !== undefined && { bio: profile.bio }),
      ...(profile.avatar_url !== undefined && { avatar_url: profile.avatar_url }),
      updated_at: new Date().toISOString()
    };
    
    console.log("将更新的数据:", updateData);

    // 更新现有资料
    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", profile.id)
      .select()
      .single();

    if (error) {
      console.error("更新个人资料失败:", error);
      throw error;
    }

    console.log("资料更新成功:", data);
    return data;
  } catch (error) {
    console.error("updateProfile函数执行出错:", error);
    throw error;
  }
};

// 习惯分享相关
export const createSharedHabit = async (habit: Omit<SharedHabit, "id" | "created_at" | "updated_at">): Promise<SharedHabit | null> => {
  const { data, error } = await supabase
    .from("shared_habits")
    .insert(habit)
    .select()
    .single();

  if (error) {
    console.error("创建分享习惯失败:", error);
    return null;
  }

  return data;
};

export const getSharedHabits = async (
  page = 1, 
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<SharedHabitWithAuthor>> => {
  // 获取总数
  const { count, error: countError } = await supabase
    .from("shared_habits")
    .select("*", { count: "exact", head: true })
    .eq("public", true);

  if (countError) {
    console.error("获取习惯总数失败:", countError);
    return { data: [], count: 0, page, pageSize, hasMore: false };
  }

  // 获取分页数据
  const { data, error } = await supabase
    .from("shared_habits")
    .select(`
      *,
      author:profiles(*)
    `)
    .eq("public", true)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("获取分享习惯失败:", error);
    return { data: [], count: count || 0, page, pageSize, hasMore: false };
  }

  return {
    data: data as unknown as SharedHabitWithAuthor[],
    count: count || 0,
    page,
    pageSize,
    hasMore: count ? (page * pageSize) < count : false
  };
};

export const getUserSharedHabits = async (
  userId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<SharedHabit>> => {
  // 获取总数
  const { count, error: countError } = await supabase
    .from("shared_habits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    console.error("获取用户习惯总数失败:", countError);
    return { data: [], count: 0, page, pageSize, hasMore: false };
  }

  // 获取分页数据
  const { data, error } = await supabase
    .from("shared_habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("获取用户分享习惯失败:", error);
    return { data: [], count: count || 0, page, pageSize, hasMore: false };
  }

  return {
    data,
    count: count || 0,
    page,
    pageSize,
    hasMore: count ? (page * pageSize) < count : false
  };
};

export const getSharedHabitById = async (id: string): Promise<SharedHabitWithAuthor | null> => {
  const { data, error } = await supabase
    .from("shared_habits")
    .select(`
      *,
      author:profiles(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("获取分享习惯详情失败:", error);
    return null;
  }

  return data as unknown as SharedHabitWithAuthor;
};

export const updateSharedHabit = async (
  id: string, 
  updates: Partial<Omit<SharedHabit, "id" | "user_id" | "created_at">>
): Promise<SharedHabit | null> => {
  const { data, error } = await supabase
    .from("shared_habits")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("更新分享习惯失败:", error);
    return null;
  }

  return data;
};

export const deleteSharedHabit = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("shared_habits")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("删除分享习惯失败:", error);
    return false;
  }

  return true;
};

// 帖子相关
export const createPost = async (post: Omit<Post, "id" | "created_at" | "updated_at">): Promise<Post | null> => {
  const { data, error } = await supabase
    .from("posts")
    .insert(post)
    .select()
    .single();

  if (error) {
    console.error("创建帖子失败:", error);
    return null;
  }

  return data;
};

export const getPosts = async (
  page = 1, 
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<PostWithAuthor>> => {
  console.log(`正在获取帖子，页码: ${page}, 每页数量: ${pageSize}`);
  
  // 获取当前用户ID
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  console.log(`当前用户ID: ${userId || '未登录'}`);

  // 获取总数
  const { count, error: countError } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("获取帖子总数失败:", countError);
    return { data: [], count: 0, page, pageSize, hasMore: false };
  }
  console.log(`帖子总数: ${count || 0}`);

  try {
    // 先获取帖子数据
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select(`*`)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (postsError) {
      console.error("获取帖子失败:", postsError);
      return { data: [], count: count || 0, page, pageSize, hasMore: false };
    }

    console.log(`获取到 ${postsData?.length || 0} 条帖子数据`);
    
    if (!postsData || postsData.length === 0) {
      return { 
        data: [], 
        count: count || 0, 
        page, 
        pageSize, 
        hasMore: count ? (page * pageSize) < count : false 
      };
    }

    // 为每个帖子获取作者信息
    const enhancedPosts = await Promise.all(
      postsData.map(async (post) => {
        // 获取作者信息
        const { data: authorData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", post.user_id)
          .single();

        // 获取点赞数
        const { count: likesCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        // 获取评论数
        const { count: commentsCount } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        // 检查当前用户是否点赞
        let userHasLiked = false;
        if (userId) {
          const { data: likeData } = await supabase
            .from("likes")
            .select("*")
            .eq("user_id", userId)
            .eq("post_id", post.id)
            .maybeSingle();
          
          userHasLiked = !!likeData;
        }

        // 构建完整的帖子对象
        return {
          ...post,
          author: authorData || {
            id: post.user_id,
            username: "未知用户",
            created_at: post.created_at,
            updated_at: post.created_at,
            avatar_url: null,
            bio: null
          },
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          user_has_liked: userHasLiked
        } as PostWithAuthor;
      })
    );

    console.log(`处理后的帖子数据:`, enhancedPosts);

    return {
      data: enhancedPosts,
      count: count || 0,
      page,
      pageSize,
      hasMore: count ? (page * pageSize) < count : false
    };
  } catch (error) {
    console.error("获取帖子过程中发生错误:", error);
    return { data: [], count: count || 0, page, pageSize, hasMore: false };
  }
};

export const getUserPosts = async (
  userId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<PostWithAuthor>> => {
  // 获取当前登录用户ID
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  // 获取总数
  const { count, error: countError } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    console.error("获取用户帖子总数失败:", countError);
    return { data: [], count: 0, page, pageSize, hasMore: false };
  }

  // 获取分页数据
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("获取用户帖子失败:", error);
    return { data: [], count: count || 0, page, pageSize, hasMore: false };
  }

  // 检查当前用户是否点赞了这些帖子
  let postsWithLikeInfo: PostWithAuthor[] = [];
  if (currentUserId) {
    // 查询用户点赞过的帖子ID列表
    const { data: likedPosts } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", data.map(post => post.id));

    const likedPostIds = new Set(likedPosts?.map(like => like.post_id) || []);

    postsWithLikeInfo = data.map(post => ({
      ...post,
      author: post.author,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      user_has_liked: likedPostIds.has(post.id)
    })) as unknown as PostWithAuthor[];
  } else {
    postsWithLikeInfo = data.map(post => ({
      ...post,
      author: post.author,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      user_has_liked: false
    })) as unknown as PostWithAuthor[];
  }

  return {
    data: postsWithLikeInfo,
    count: count || 0,
    page,
    pageSize,
    hasMore: count ? (page * pageSize) < count : false
  };
};

export const getPostById = async (id: string): Promise<PostWithAuthor | null> => {
  // 获取当前用户ID
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("获取帖子详情失败:", error);
    return null;
  }

  // 检查当前用户是否点赞了该帖子
  let userHasLiked = false;
  if (userId) {
    const { data: likeData, error: likeError } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", userId)
      .eq("post_id", id)
      .maybeSingle();

    if (!likeError) {
      userHasLiked = !!likeData;
    }
  }

  return {
    ...data,
    author: data.author,
    likes_count: data.likes_count,
    comments_count: data.comments_count,
    user_has_liked: userHasLiked
  } as unknown as PostWithAuthor;
};

export const updatePost = async (
  id: string, 
  updates: Partial<Omit<Post, "id" | "user_id" | "created_at">>
): Promise<Post | null> => {
  const { data, error } = await supabase
    .from("posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("更新帖子失败:", error);
    return null;
  }

  return data;
};

export const deletePost = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("删除帖子失败:", error);
    return false;
  }

  return true;
};

// 评论相关
export const createComment = async (comment: Omit<Comment, "id" | "created_at" | "updated_at">): Promise<Comment | null> => {
  const { data, error } = await supabase
    .from("comments")
    .insert(comment)
    .select()
    .single();

  if (error) {
    console.error("创建评论失败:", error);
    return null;
  }

  return data;
};

export const getCommentsByPostId = async (
  postId: string,
  page = 1, 
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<CommentWithAuthor>> => {
  // 获取当前用户ID
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  // 获取总数
  const { count, error: countError } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (countError) {
    console.error("获取评论总数失败:", countError);
    return { data: [], count: 0, page, pageSize, hasMore: false };
  }

  // 获取分页数据
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      author:profiles(*),
      likes_count:likes(count)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("获取评论失败:", error);
    return { data: [], count: count || 0, page, pageSize, hasMore: false };
  }

  // 检查当前用户是否点赞了这些评论
  let commentsWithLikeInfo: CommentWithAuthor[] = [];
  if (userId) {
    // 查询用户点赞过的评论ID列表
    const { data: likedComments } = await supabase
      .from("likes")
      .select("comment_id")
      .eq("user_id", userId)
      .in("comment_id", data.map(comment => comment.id));

    const likedCommentIds = new Set(likedComments?.map(like => like.comment_id) || []);

    commentsWithLikeInfo = data.map(comment => ({
      ...comment,
      author: comment.author,
      likes_count: comment.likes_count,
      user_has_liked: likedCommentIds.has(comment.id)
    })) as unknown as CommentWithAuthor[];
  } else {
    commentsWithLikeInfo = data.map(comment => ({
      ...comment,
      author: comment.author,
      likes_count: comment.likes_count,
      user_has_liked: false
    })) as unknown as CommentWithAuthor[];
  }

  return {
    data: commentsWithLikeInfo,
    count: count || 0,
    page,
    pageSize,
    hasMore: count ? (page * pageSize) < count : false
  };
};

export const updateComment = async (
  id: string, 
  content: string
): Promise<Comment | null> => {
  const { data, error } = await supabase
    .from("comments")
    .update({ 
      content, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("更新评论失败:", error);
    return null;
  }

  return data;
};

export const deleteComment = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("删除评论失败:", error);
    return false;
  }

  return true;
};

// 点赞相关
export const likePost = async (postId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("likes")
    .insert({
      user_id: (await supabase.auth.getUser()).data.user?.id!,
      post_id: postId
    });

  if (error) {
    console.error("点赞帖子失败:", error);
    return false;
  }

  return true;
};

export const unlikePost = async (postId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
    .eq("post_id", postId);

  if (error) {
    console.error("取消点赞帖子失败:", error);
    return false;
  }

  return true;
};

export const likeComment = async (commentId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("likes")
    .insert({
      user_id: (await supabase.auth.getUser()).data.user?.id!,
      comment_id: commentId
    });

  if (error) {
    console.error("点赞评论失败:", error);
    return false;
  }

  return true;
};

export const unlikeComment = async (commentId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
    .eq("comment_id", commentId);

  if (error) {
    console.error("取消点赞评论失败:", error);
    return false;
  }

  return true;
};

// 关注相关
export const followUser = async (followingId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("follows")
    .insert({
      follower_id: (await supabase.auth.getUser()).data.user?.id!,
      following_id: followingId
    });

  if (error) {
    console.error("关注用户失败:", error);
    return false;
  }

  return true;
};

export const unfollowUser = async (followingId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", (await supabase.auth.getUser()).data.user?.id!)
    .eq("following_id", followingId);

  if (error) {
    console.error("取消关注用户失败:", error);
    return false;
  }

  return true;
};

export const getFollowers = async (
  userId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Profile>> => {
  // 获取总数
  const { count, error: countError } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  if (countError) {
    console.error("获取粉丝总数失败:", countError);
    return { data: [], count: 0, page, pageSize, hasMore: false };
  }

  // 获取分页数据
  const { data, error } = await supabase
    .from("follows")
    .select(`
      follower:profiles!follows_follower_id_fkey(*)
    `)
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("获取粉丝失败:", error);
    return { data: [], count: count || 0, page, pageSize, hasMore: false };
  }

  // 从嵌套结果中提取出用户资料
  const followers = data.map(item => item.follower as unknown as Profile);

  return {
    data: followers,
    count: count || 0,
    page,
    pageSize,
    hasMore: count ? (page * pageSize) < count : false
  };
};

export const getFollowing = async (
  userId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Profile>> => {
  // 获取总数
  const { count, error: countError } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  if (countError) {
    console.error("获取关注总数失败:", countError);
    return { data: [], count: 0, page, pageSize, hasMore: false };
  }

  // 获取分页数据
  const { data, error } = await supabase
    .from("follows")
    .select(`
      following:profiles!follows_following_id_fkey(*)
    `)
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("获取关注失败:", error);
    return { data: [], count: count || 0, page, pageSize, hasMore: false };
  }

  // 从嵌套结果中提取出用户资料
  const following = data.map(item => item.following as unknown as Profile);

  return {
    data: following,
    count: count || 0,
    page,
    pageSize,
    hasMore: count ? (page * pageSize) < count : false
  };
};

export const getCommunityUser = async (userId: string): Promise<CommunityUser | null> => {
  // 获取当前登录用户ID
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  // 获取用户资料
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("获取用户资料失败:", profileError);
    return null;
  }

  // 获取粉丝数
  const { count: followersCount, error: followersError } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  if (followersError) {
    console.error("获取粉丝数失败:", followersError);
    return null;
  }

  // 获取关注数
  const { count: followingCount, error: followingError } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  if (followingError) {
    console.error("获取关注数失败:", followingError);
    return null;
  }

  // 检查当前用户是否关注了该用户
  let isFollowing = false;
  if (currentUserId && currentUserId !== userId) {
    const { data: followData, error: followError } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", currentUserId)
      .eq("following_id", userId)
      .maybeSingle();

    if (!followError) {
      isFollowing = !!followData;
    }
  }

  return {
    ...profile,
    followers_count: followersCount || 0,
    following_count: followingCount || 0,
    is_following: isFollowing
  };
};

// 习惯进度分享
export const shareHabitProgress = async (progress: Omit<HabitProgress, "id" | "created_at">): Promise<HabitProgress | null> => {
  const { data, error } = await supabase
    .from("habit_progress")
    .insert(progress)
    .select()
    .single();

  if (error) {
    console.error("分享习惯进度失败:", error);
    return null;
  }

  return data;
};

export const getHabitProgressByUser = async (
  userId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<HabitProgress>> => {
  // 获取总数
  const { count, error: countError } = await supabase
    .from("habit_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    console.error("获取习惯进度总数失败:", countError);
    return { data: [], count: 0, page, pageSize, hasMore: false };
  }

  // 获取分页数据
  const { data, error } = await supabase
    .from("habit_progress")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("获取习惯进度失败:", error);
    return { data: [], count: count || 0, page, pageSize, hasMore: false };
  }

  return {
    data,
    count: count || 0,
    page,
    pageSize,
    hasMore: count ? (page * pageSize) < count : false
  };
}; 