import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast({
        title: '已退出登录',
        description: '您已成功退出登录',
      });
    } catch (error) {
      toast({
        title: '退出失败',
        description: '退出登录时发生错误',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEditProfile = () => {
    navigate('/community/profile/edit');
  };

  if (!user) return null;

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          用户信息
        </CardTitle>
        <CardDescription>
          管理您的账户设置
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">邮箱</p>
          <p className="text-base">{user.email}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">用户ID</p>
          <p className="text-xs text-gray-400 font-mono">{user.id}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">注册时间</p>
          <p className="text-sm">{new Date(user.created_at).toLocaleDateString('zh-CN')}</p>
        </div>
        
        <Button 
          onClick={handleEditProfile}
          variant="outline"
          className="w-full mb-2"
        >
          <Edit className="h-4 w-4 mr-2" />
          编辑个人资料
        </Button>
        
        <Button 
          onClick={handleSignOut}
          variant="outline"
          className="w-full"
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? '退出中...' : '退出登录'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
