import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getCommunityUser, 
  getUserPosts, 
  getUserSharedHabits,
  getHabitProgressByUser,
  followUser,
  unfollowUser
} from "@/services/communityService";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  ArrowLeft,
  Users,
  User,
  Calendar,
  Trophy,
  BarChart
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postsPage, setPostsPage] = useState(1);
  const [habitsPage, setHabitsPage] = useState(1);
  const [progressPage, setProgressPage] = useState(1);

  // 获取用户信息
  const { 
    data: profileUser, 
    isLoading: isProfileLoading 
  } = useQuery({
    queryKey: ["community-user", id],
    queryFn: () => getCommunityUser(id!),
    enabled: !!id,
  });

  // 获取用户发布的帖子
  const { 
    data: postsData, 
    isLoading: isPostsLoading 
  } = useQuery({
    queryKey: ["user-posts", id, postsPage],
    queryFn: () => getUserPosts(id!, postsPage),
    enabled: !!id,
  });

  // 获取用户分享的习惯
  const { 
    data: habitsData, 
    isLoading: isHabitsLoading 
  } = useQuery({
    queryKey: ["user-habits", id, habitsPage],
    queryFn: () => getUserSharedHabits(id!, habitsPage),
    enabled: !!id,
  });

  // 获取用户习惯进度
  const { 
    data: progressData, 
    isLoading: isProgressLoading 
  } = useQuery({
    queryKey: ["user-progress", id, progressPage],
    queryFn: () => getHabitProgressByUser(id!, progressPage),
    enabled: !!id,
  });

  // 关注/取消关注用户
  const followMutation = useMutation({
    mutationFn: () => profileUser?.is_following 
      ? unfollowUser(id!) 
      : followUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-user", id] });
      toast({
        title: profileUser?.is_following ? "已取消关注" : "关注成功",
        description: profileUser?.is_following 
          ? `你已取消关注 ${profileUser.username}` 
          : `你已成功关注 ${profileUser?.username}`,
      });
    },
    onError: () => {
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  });

  // 处理关注/取消关注
  const handleFollowToggle = () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "需要登录后才能关注用户",
        variant: "destructive"
      });
      return;
    }

    followMutation.mutate();
  };

  // 加载更多帖子
  const loadMorePosts = () => {
    if (postsData?.hasMore) {
      setPostsPage(prev => prev + 1);
    }
  };

  // 加载更多习惯
  const loadMoreHabits = () => {
    if (habitsData?.hasMore) {
      setHabitsPage(prev => prev + 1);
    }
  };

  // 加载更多进度
  const loadMoreProgress = () => {
    if (progressData?.hasMore) {
      setProgressPage(prev => prev + 1);
    }
  };

  // 查看帖子详情
  const openPostDetail = (postId: string) => {
    navigate(`/community/post/${postId}`);
  };

  // 查看习惯详情
  const viewHabitDetail = (habitId: string) => {
    navigate(`/community/habit/${habitId}`);
  };

  // 查看关注者列表
  const viewFollowers = () => {
    navigate(`/community/user/${id}/followers`);
  };

  // 查看关注的人列表
  const viewFollowing = () => {
    navigate(`/community/user/${id}/following`);
  };

  if (isProfileLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">未找到用户</h2>
          <p className="text-muted-foreground mb-4">该用户可能不存在</p>
          <Button onClick={() => navigate("/community")}>返回社区</Button>
        </div>
      </div>
    );
  }

  const isCurrentUser = user && user.id === id;

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={profileUser.avatar_url || ""} />
                <AvatarFallback>{profileUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{profileUser.username}</CardTitle>
              {profileUser.bio && (
                <CardDescription className="mt-2">{profileUser.bio}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex justify-around mb-4">
                <div className="text-center cursor-pointer" onClick={viewFollowers}>
                  <div className="text-xl font-bold">{profileUser.followers_count}</div>
                  <div className="text-sm text-muted-foreground">粉丝</div>
                </div>
                <div className="text-center cursor-pointer" onClick={viewFollowing}>
                  <div className="text-xl font-bold">{profileUser.following_count}</div>
                  <div className="text-sm text-muted-foreground">关注</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{habitsData?.count || 0}</div>
                  <div className="text-sm text-muted-foreground">习惯</div>
                </div>
              </div>
              
              {!isCurrentUser && user && (
                <Button 
                  className="w-full" 
                  variant={profileUser.is_following ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending}
                >
                  {followMutation.isPending 
                    ? "处理中..." 
                    : (profileUser.is_following ? "已关注" : "关注")}
                </Button>
              )}
              
              {isCurrentUser && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate("/community/profile/edit")}
                >
                  编辑资料
                </Button>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              <div>注册于 {new Date(profileUser.created_at).toLocaleDateString()}</div>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">TA的成就</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>习惯坚持天数: 32天</span>
              </div>
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>已完成习惯: 12个</span>
              </div>
              <div className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>获得能量: 1024</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="posts">发布的帖子</TabsTrigger>
              <TabsTrigger value="habits">分享的习惯</TabsTrigger>
              <TabsTrigger value="progress">习惯进度</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-6">
              {isPostsLoading ? (
                <div className="flex justify-center py-8">
                  <p>加载中...</p>
                </div>
              ) : postsData?.data.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-center text-muted-foreground mb-4">暂无帖子</p>
                    {isCurrentUser && (
                      <Button onClick={() => navigate("/community")}>
                        发布第一个帖子
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {postsData?.data.map((post) => (
                    <Card key={post.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center">
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: zhCN })}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div onClick={() => openPostDetail(post.id)} className="cursor-pointer">
                          <CardTitle className="mb-2 text-xl hover:text-primary">{post.title}</CardTitle>
                          <CardDescription className="line-clamp-3">{post.content}</CardDescription>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between">
                        <div className="flex items-center space-x-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="flex items-center gap-1 text-muted-foreground"
                          >
                            <Heart className={`h-4 w-4 ${post.user_has_liked ? "fill-primary text-primary" : ""}`} />
                            <span>{post.likes_count}</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="flex items-center gap-1 text-muted-foreground"
                            onClick={() => openPostDetail(post.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.comments_count}</span>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {postsData?.hasMore && (
                    <div className="flex justify-center mt-4">
                      <Button variant="outline" onClick={loadMorePosts}>
                        加载更多
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="habits" className="space-y-6">
              {isHabitsLoading ? (
                <div className="flex justify-center py-8">
                  <p>加载中...</p>
                </div>
              ) : habitsData?.data.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-center text-muted-foreground mb-4">暂无分享的习惯</p>
                    {isCurrentUser && (
                      <Button onClick={() => navigate("/habits")}>
                        分享我的习惯
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {habitsData?.data.map((habit) => (
                    <Card 
                      key={habit.id} 
                      className="overflow-hidden cursor-pointer hover:border-primary"
                      onClick={() => viewHabitDetail(habit.id)}
                    >
                      <CardHeader>
                        <CardTitle>{habit.name}</CardTitle>
                        {habit.description && (
                          <CardDescription>{habit.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm">
                          <div>能量值: +{habit.energy_value}</div>
                          <div className={habit.public ? "text-green-600" : "text-amber-600"}>
                            {habit.public ? "公开" : "私有"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {habitsData?.hasMore && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={loadMoreHabits}>
                    加载更多
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-6">
              {isProgressLoading ? (
                <div className="flex justify-center py-8">
                  <p>加载中...</p>
                </div>
              ) : progressData?.data.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-center text-muted-foreground mb-4">暂无习惯进度分享</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {progressData?.data.map((progress) => (
                    <Card key={progress.id}>
                      <CardHeader>
                        <CardTitle>{progress.name}</CardTitle>
                        <CardDescription>
                          分享于 {new Date(progress.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>连续坚持</span>
                          <span className="font-bold">{progress.streak_days}天</span>
                        </div>
                        <Progress value={Math.min(progress.streak_days / 100 * 100, 100)} className="h-2" />
                        
                        <div className="flex justify-between">
                          <span>累计完成</span>
                          <span className="font-bold">{progress.completed_count}次</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>累计能量</span>
                          <span className="font-bold text-primary">+{progress.energy_earned}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {progressData?.hasMore && (
                    <div className="flex justify-center mt-4">
                      <Button variant="outline" onClick={loadMoreProgress}>
                        加载更多
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 