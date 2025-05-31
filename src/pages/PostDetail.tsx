import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getPostById, 
  getCommentsByPostId, 
  createComment, 
  likePost, 
  unlikePost,
  likeComment,
  unlikeComment,
  deleteComment
} from "@/services/communityService";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  ArrowLeft,
  MoreVertical,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PostWithAuthor, CommentWithAuthor } from "@/types/community";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");
  const [commentPage, setCommentPage] = useState(1);

  // 获取帖子详情
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => getPostById(id!),
    enabled: !!id,
  });

  // 获取评论列表
  const { 
    data: commentsData, 
    isLoading: isCommentsLoading,
    refetch: refetchComments
  } = useQuery({
    queryKey: ["comments", id, commentPage],
    queryFn: () => getCommentsByPostId(id!, commentPage),
    enabled: !!id,
  });

  // 提交评论
  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      setCommentContent("");
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      toast({
        title: "评论成功",
        description: "你的评论已成功发布",
      });
    },
    onError: () => {
      toast({
        title: "评论失败",
        description: "发布评论时出错，请稍后重试",
        variant: "destructive",
      });
    }
  });

  // 处理帖子点赞
  const handleLikePost = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "需要登录后才能点赞",
        variant: "destructive"
      });
      return;
    }

    try {
      if (post?.user_has_liked) {
        await unlikePost(post.id);
      } else {
        await likePost(post!.id);
      }
      queryClient.invalidateQueries({ queryKey: ["post", id] });
    } catch (error) {
      toast({
        title: "操作失败",
        description: "点赞操作失败，请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 处理评论点赞
  const handleLikeComment = async (comment: CommentWithAuthor) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "需要登录后才能点赞",
        variant: "destructive"
      });
      return;
    }

    try {
      if (comment.user_has_liked) {
        await unlikeComment(comment.id);
      } else {
        await likeComment(comment.id);
      }
      refetchComments();
    } catch (error) {
      toast({
        title: "操作失败",
        description: "点赞操作失败，请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      toast({
        title: "删除成功",
        description: "评论已被删除",
      });
    } catch (error) {
      toast({
        title: "删除失败",
        description: "删除评论时出错，请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 提交评论
  const handleSubmitComment = () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "需要登录后才能发表评论",
        variant: "destructive"
      });
      return;
    }

    if (!commentContent.trim()) {
      toast({
        title: "评论不能为空",
        description: "请输入评论内容",
        variant: "destructive"
      });
      return;
    }

    createCommentMutation.mutate({
      post_id: id!,
      user_id: user.id,
      content: commentContent.trim()
    });
  };

  // 加载更多评论
  const loadMoreComments = () => {
    if (commentsData?.hasMore) {
      setCommentPage(prev => prev + 1);
    }
  };

  // 查看用户资料
  const viewUserProfile = (userId: string) => {
    navigate(`/community/user/${userId}`);
  };

  if (isPostLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">未找到帖子</h2>
          <p className="text-muted-foreground mb-4">该帖子可能已被删除或不存在</p>
          <Button onClick={() => navigate("/community")}>返回社区</Button>
        </div>
      </div>
    );
  }

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

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Avatar 
                className="h-10 w-10 mr-3 cursor-pointer" 
                onClick={() => viewUserProfile(post.author.id)}
              >
                <AvatarImage src={post.author.avatar_url || ""} />
                <AvatarFallback>{post.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div 
                  className="font-medium cursor-pointer hover:underline"
                  onClick={() => viewUserProfile(post.author.id)}
                >
                  {post.author.username}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: zhCN })}
                </div>
              </div>
            </div>
            {user && user.id === post.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/community/post/edit/${post.id}`)}>
                    编辑帖子
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        删除帖子
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除帖子？</AlertDialogTitle>
                        <AlertDialogDescription>
                          删除后将无法恢复，所有相关评论也将被删除。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction>确认删除</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardTitle className="text-2xl mt-2">{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap">{post.content}</div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-1"
              onClick={handleLikePost}
            >
              <Heart className={`h-4 w-4 ${post.user_has_liked ? "fill-primary text-primary" : ""}`} />
              <span>{post.likes_count}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-1"
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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">评论 ({post.comments_count})</h2>
        
        {user && (
          <div className="mb-6">
            <Textarea
              placeholder="发表你的评论..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="min-h-[100px] mb-2"
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmitComment} disabled={createCommentMutation.isPending}>
                {createCommentMutation.isPending ? "发布中..." : "发表评论"}
              </Button>
            </div>
          </div>
        )}

        <Separator className="my-6" />

        {isCommentsLoading ? (
          <div className="flex justify-center py-8">
            <p>加载评论中...</p>
          </div>
        ) : commentsData?.data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">暂无评论，来发表第一条评论吧</p>
          </div>
        ) : (
          <div className="space-y-6">
            {commentsData?.data.map((comment) => (
              <Card key={comment.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Avatar 
                        className="h-8 w-8 mr-2 cursor-pointer" 
                        onClick={() => viewUserProfile(comment.author.id)}
                      >
                        <AvatarImage src={comment.author.avatar_url || ""} />
                        <AvatarFallback>{comment.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div 
                          className="font-medium cursor-pointer hover:underline"
                          onClick={() => viewUserProfile(comment.author.id)}
                        >
                          {comment.author.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: zhCN })}
                        </div>
                      </div>
                    </div>
                    {user && (user.id === comment.user_id || user.id === post.user_id) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除评论？</AlertDialogTitle>
                            <AlertDialogDescription>
                              删除后将无法恢复。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="whitespace-pre-wrap">{comment.content}</div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleLikeComment(comment)}
                  >
                    <Heart className={`h-4 w-4 ${comment.user_has_liked ? "fill-primary text-primary" : ""}`} />
                    <span>{comment.likes_count}</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {commentsData?.hasMore && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={loadMoreComments}>
                  加载更多评论
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail; 