import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPosts, getSharedHabits, likePost, unlikePost, createPost } from "@/services/communityService";
import { PostWithAuthor, SharedHabitWithAuthor } from "@/types/community";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Share2, Plus, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Community = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 获取帖子列表
  const { 
    data: postsData, 
    isLoading: isPostsLoading,
    isError: isPostsError,
    error: postsError,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ["posts", currentPage],
    queryFn: () => getPosts(currentPage),
  });

  // 获取热门习惯
  const { data: habitsData, isLoading: isHabitsLoading } = useQuery({
    queryKey: ["shared-habits"],
    queryFn: () => getSharedHabits(1, 5),
  });

  // 处理手动刷新
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 先使缓存失效
      queryClient.invalidateQueries({queryKey: ["posts"]});
      await refetchPosts();
      toast({
        title: "刷新成功",
        description: "已加载最新数据",
      });
    } catch (error) {
      console.error("刷新数据失败:", error);
      toast({
        title: "刷新失败",
        description: "请稍后再试",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // 处理帖子点赞
  const handleLikePost = async (post: PostWithAuthor) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "需要登录后才能点赞",
        variant: "destructive"
      });
      return;
    }

    try {
      if (post.user_has_liked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
      refetchPosts();
    } catch (error) {
      toast({
        title: "操作失败",
        description: "点赞操作失败，请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 创建新帖子
  const handleCreatePost = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "需要登录后才能发布帖子",
        variant: "destructive"
      });
      return;
    }

    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: "内容不完整",
        description: "标题和内容不能为空",
        variant: "destructive"
      });
      return;
    }

    try {
      // 调用createPost服务保存数据到Supabase
      const result = await createPost({
        user_id: user.id,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        shared_habit_id: null
      });
      
      if (result) {
        toast({
          title: "发布成功",
          description: "帖子已成功发布到社区",
        });
        setNewPostTitle("");
        setNewPostContent("");
        setIsCreatePostDialogOpen(false);
        
        // 强制使缓存失效并重新获取帖子
        queryClient.invalidateQueries({queryKey: ["posts"]});
        
        // 延迟一小段时间后再次刷新，确保数据已经写入
        setTimeout(() => {
          refetchPosts();
        }, 500);
      } else {
        throw new Error("发布失败");
      }
    } catch (error) {
      console.error("发布帖子错误:", error);
      toast({
        title: "发布失败",
        description: "帖子发布失败，请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 加载更多帖子
  const loadMorePosts = () => {
    if (postsData?.hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // 打开帖子详情
  const openPostDetail = (postId: string) => {
    navigate(`/community/post/${postId}`);
  };

  // 查看用户资料
  const viewUserProfile = (userId: string) => {
    navigate(`/community/user/${userId}`);
  };

  // 查看习惯详情
  const viewHabitDetail = (habitId: string) => {
    navigate(`/community/habit/${habitId}`);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">社区</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isCreatePostDialogOpen} onOpenChange={setIsCreatePostDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> 发布帖子
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>发布新帖子</DialogTitle>
                <DialogDescription>
                  分享你的习惯心得、进步或者寻求建议
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input
                    placeholder="标题"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Textarea
                    placeholder="内容"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatePostDialogOpen(false)}>取消</Button>
                <Button onClick={handleCreatePost}>发布</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="posts">最新动态</TabsTrigger>
          <TabsTrigger value="followed">关注的人</TabsTrigger>
          <TabsTrigger value="trending">热门讨论</TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <TabsContent value="posts" className="space-y-6">
              {isPostsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>加载失败</AlertTitle>
                  <AlertDescription>
                    无法获取帖子数据: {postsError?.message || "未知错误"}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2" 
                      onClick={handleManualRefresh}
                    >
                      重试
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {isPostsLoading ? (
                <div className="flex justify-center py-8">
                  <p>加载中...</p>
                </div>
              ) : postsData?.data.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-center text-muted-foreground mb-4">暂无帖子</p>
                    <Button onClick={() => setIsCreatePostDialogOpen(true)}>
                      发布第一个帖子
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {postsData?.data.map((post) => (
                    <Card key={post.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2 cursor-pointer" onClick={() => viewUserProfile(post.author.id)}>
                            <AvatarImage src={post.author.avatar_url || ""} />
                            <AvatarFallback>{post.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium cursor-pointer hover:underline" onClick={() => viewUserProfile(post.author.id)}>
                              {post.author.username}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: zhCN })}
                            </div>
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
                            onClick={() => handleLikePost(post)}
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
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
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
            
            <TabsContent value="followed">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-center text-muted-foreground mb-4">关注其他用户以查看他们的动态</p>
                  <Button onClick={() => navigate("/community/explore")}>
                    探索用户
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trending">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-center text-muted-foreground">敬请期待...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>热门习惯</CardTitle>
              </CardHeader>
              <CardContent>
                {isHabitsLoading ? (
                  <p>加载中...</p>
                ) : habitsData?.data.length === 0 ? (
                  <p className="text-muted-foreground">暂无热门习惯</p>
                ) : (
                  <div className="space-y-4">
                    {habitsData?.data.map((habit) => (
                      <div 
                        key={habit.id} 
                        className="flex items-start space-x-2 cursor-pointer hover:bg-accent p-2 rounded-md"
                        onClick={() => viewHabitDetail(habit.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={habit.author.avatar_url || ""} />
                          <AvatarFallback>{habit.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{habit.name}</div>
                          <div className="text-xs text-muted-foreground">
                            能量值: +{habit.energy_value}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => navigate("/community/habits")}
                    >
                      查看更多
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>发现更多</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/community/habits")}
                >
                  浏览习惯库
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/community/users")}
                >
                  寻找用户
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/community/progress")}
                >
                  查看进度分享
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default Community; 