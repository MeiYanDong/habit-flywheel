import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/community";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, ArrowLeft, Camera, Loader2, Save, User, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 状态管理
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 加载用户资料
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 直接从Supabase获取用户资料
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("获取用户资料失败:", error);
          setError(`获取资料失败: ${error.message}`);
          return;
        }
        
        if (data) {
          setProfile(data);
          setUsername(data.username || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatar_url);
        } else {
          // 用户首次设置资料
          setUsername(user.email?.split('@')[0] || "用户");
          setBio("");
          setAvatarUrl(null);
        }
      } catch (error) {
        console.error("加载用户资料出错:", error);
        setError("加载资料时出现意外错误");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // 处理头像选择
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "文件过大",
        description: "头像图片大小不能超过2MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    
    // 释放之前的预览URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    // 创建新的预览URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAvatarUrl(objectUrl); // 用于预览显示
  };

  // 移除头像
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setAvatarUrl(null);
  };

  // 上传头像
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;
    
    setIsUploading(true);
    try {
      // 生成唯一文件名
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      // 上传文件
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: avatarFile.type
        });
      
      if (uploadError) {
        console.error("上传头像失败:", uploadError);
        throw uploadError;
      }
      
      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error("头像上传错误:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // 测试直接保存简单资料
  const testSimpleSave = async () => {
    if (!user) return;
    
    try {
      toast({
        title: "测试保存",
        description: "正在尝试简单保存...",
      });
      
      console.log("测试简单保存开始...");
      console.log("当前用户:", user);
      
      // 先刷新认证状态
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error("获取会话失败:", authError);
        throw authError;
      }
      
      console.log("当前会话:", authData);
      
      if (!authData.session) {
        console.error("用户未登录或会话已过期");
        toast({
          title: "未登录",
          description: "会话已过期，请重新登录",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      
      // 尝试直接操作数据库，跳过RPC调用
      // 尝试获取现有资料
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      console.log("现有资料检查结果:", existingProfile);
      
      const testData = {
        id: user.id,
        username: username.trim() || "测试用户",
        bio: bio.trim() || null,
        avatar_url: null,
        updated_at: new Date().toISOString()
      };
      
      // 打印当前认证状态
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log("当前登录用户:", currentUser);
      console.log("认证头:", await supabase.auth.getSession());
      
      let result;
      let error;
      
      if (!existingProfile) {
        // 创建新资料
        console.log("尝试创建最简单的资料(带认证)...");
        
        // 确保包含created_at字段
        testData['created_at'] = new Date().toISOString();
        
        const response = await supabase
          .from("profiles")
          .insert(testData)
          .select()
          .single();
          
        error = response.error;
        result = response.data;
      } else {
        // 更新现有资料
        console.log("尝试最简单的更新(带认证)...");
        const response = await supabase
          .from("profiles")
          .update(testData)
          .eq("id", user.id)
          .select()
          .single();
          
        error = response.error;
        result = response.data;
      }
      
      if (error) {
        console.error("测试保存出错:", error);
        console.error("错误代码:", error.code);
        console.error("错误详情:", error.details);
        console.error("错误提示:", error.hint);
        
        // 处理RLS错误的信息
        if (error.message.includes("row-level security") || error.message.includes("policy")) {
          toast({
            title: "权限错误",
            description: "您没有操作该数据的权限，请联系管理员",
            variant: "destructive"
          });
          
          // 显示修复RLS的指导
          console.log("RLS修复指南:");
          console.log("1. 确保已在Supabase中为profiles表启用了RLS");
          console.log("2. 添加以下RLS策略:");
          console.log(`
            CREATE POLICY "Users can create their own profile"
            ON public.profiles
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = id);
            
            CREATE POLICY "Users can update own profile"
            ON public.profiles
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = id);
            
            CREATE POLICY "Profiles are viewable by everyone"
            ON public.profiles
            FOR SELECT
            TO authenticated
            USING (true);
          `);
        } else {
          throw error;
        }
      } else {
        console.log("测试保存成功:", result);
        toast({
          title: "测试成功",
          description: "简单保存测试成功"
        });
      }
    } catch (error) {
      console.error("测试保存失败:", error);
      toast({
        title: "测试失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  };

  // 修复RLS权限问题的方式保存个人资料
  const handleSaveWithRLS = async (skipAvatar = false) => {
    if (!user) return;
    
    // 表单验证
    if (!username.trim()) {
      toast({
        title: "无法保存",
        description: "昵称不能为空",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      console.log("开始保存个人资料(RLS版本)...");
      
      // 1. 刷新认证状态，确保令牌有效
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData.session) {
        console.error("认证错误:", authError);
        toast({
          title: "会话已过期",
          description: "请重新登录",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      
      let finalAvatarUrl = avatarUrl;
      
      // 如果有新头像且不跳过上传头像
      if (avatarFile && !skipAvatar) {
        const newAvatarUrl = await uploadAvatar();
        if (!newAvatarUrl) {
          toast({
            title: "头像上传失败",
            description: "将仅保存文本信息",
            variant: "destructive",
          });
        } else {
          finalAvatarUrl = newAvatarUrl;
        }
      }
      
      // 2. 检查用户资料是否存在
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      if (checkError) {
        if (checkError.message.includes("row-level security")) {
          console.error("RLS权限错误:", checkError);
          throw new Error("您没有权限访问个人资料，请联系管理员");
        } else {
          throw checkError;
        }
      }
      
      // 3. 使用直接操作
      let result;
      let saveError = null;
      
      // 准备数据
      const profileData = {
        id: user.id,
        username: username.trim(),
        bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
        ...(skipAvatar ? {} : { avatar_url: finalAvatarUrl })
      };
      
      try {
        // 尝试直接操作数据库
        console.log("尝试直接操作数据库...");
        
        if (!existingProfile) {
          // 创建新资料
          console.log("创建新资料...");
          
          const insertData = {
            ...profileData,
            created_at: new Date().toISOString()
          };
          
          const { data, error } = await supabase
            .from("profiles")
            .insert(insertData)
            .select()
            .single();
            
          if (error) {
            saveError = error;
          } else {
            result = data;
          }
        } else {
          // 更新现有资料
          console.log("更新现有资料...");
          const { data, error } = await supabase
            .from("profiles")
            .update(profileData)
            .eq("id", user.id)
            .select()
            .single();
            
          if (error) {
            saveError = error;
          } else {
            result = data;
          }
        }
      } catch (error) {
        console.error("直接操作数据库失败:", error);
        saveError = error instanceof Error ? { message: error.message } : { message: "未知错误" };
      }
      
      if (saveError) {
        console.error("保存出错:", saveError);
        
        // 处理RLS错误
        if (saveError.message && (saveError.message.includes("row-level security") || saveError.message.includes("policy"))) {
          throw new Error("无权限操作个人资料(RLS限制)，请联系管理员设置正确的访问策略");
        } else {
          throw saveError;
        }
      }
      
      if (!result) {
        throw new Error("操作成功但未返回数据");
      }
      
      // 更新本地状态
      setProfile(result);
      
      toast({
        title: "保存成功",
        description: "您的个人资料已更新",
      });
      
      // 返回上一页
      navigate(-1);
    } catch (error) {
      console.error("保存资料失败:", error);
      
      let errorMessage = "保存失败，请稍后重试";
      if (error instanceof Error) {
        if (error.message.includes("row-level security") || error.message.includes("policy")) {
          errorMessage = "没有权限保存资料，请联系管理员";
        } else if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
          errorMessage = "用户名已被占用，请选择其他名称";
        } else {
          errorMessage = `保存失败: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      
      toast({
        title: "保存失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 测试数据库连接
  const testConnection = async () => {
    try {
      // 使用正确的Supabase count查询语法
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
        
      if (error) {
        toast({
          title: "连接测试失败",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "连接正常",
          description: `数据库连接测试成功，共有 ${count} 个用户资料`,
        });
      }
      
      console.log("连接测试结果:", { count, error });
    } catch (error) {
      console.error("测试连接错误:", error);
      toast({
        title: "连接测试失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>未登录</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">您需要登录后才能编辑个人资料</p>
            <Button onClick={() => navigate("/auth")}>去登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        
        <h1 className="text-2xl font-bold">个人资料</h1>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={testConnection}
          className="text-xs"
        >
          测试连接
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>出错了</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">加载中...</span>
        </div>
      ) : (
        <Tabs defaultValue="基本信息" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="基本信息">基本信息</TabsTrigger>
            <TabsTrigger value="头像设置">头像设置</TabsTrigger>
          </TabsList>
          
          <TabsContent value="基本信息" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium flex items-center">
                    昵称 <span className="text-destructive ml-1">*</span>
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入您的昵称"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    昵称将显示在您发布的帖子和评论中
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium">
                    个人简介
                  </label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="简单介绍一下自己吧..."
                    rows={4}
                    className="w-full resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    个人简介将显示在您的个人资料页面
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="头像设置">
            <Card>
              <CardHeader>
                <CardTitle>头像设置</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-2 border-primary/20">
                    <AvatarImage src={avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-12 w-12 text-primary/40" />
                    </AvatarFallback>
                  </Avatar>
                  
                  {avatarUrl && (
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                      onClick={handleRemoveAvatar}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                  <label 
                    htmlFor="avatar-upload"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <span>选择头像</span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={isUploading}
                    />
                  </label>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    支持JPG、PNG格式，文件大小不超过2MB
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <div className="flex justify-between mt-6">
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                disabled={isSaving || isUploading}
              >
                取消
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                className="text-xs"
                disabled={isSaving}
              >
                测试连接
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={testSimpleSave}
                className="text-xs"
                disabled={isSaving}
              >
                测试保存
              </Button>
            </div>
            
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleSaveWithRLS(true)}
                disabled={isSaving || isUploading}
              >
                仅保存文本信息
              </Button>
              
              <Button 
                onClick={() => handleSaveWithRLS(false)}
                disabled={isSaving || isUploading}
                className="flex items-center gap-2"
              >
                {isSaving || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>保存全部</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      )}
    </div>
  );
};

export default ProfileEdit; 