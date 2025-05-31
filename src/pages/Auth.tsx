
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: '登录失败',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '登录成功',
            description: '欢迎回来！',
          });
          navigate('/');
        }
      } else {
        if (!username.trim()) {
          toast({
            title: '注册失败',
            description: '请输入用户名',
            variant: 'destructive',
          });
          return;
        }
        
        const { error } = await signUp(email, password, username);
        if (error) {
          toast({
            title: '注册失败',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '注册成功',
            description: '请检查您的邮箱以验证账户',
          });
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast({
        title: '操作失败',
        description: '发生了未知错误，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isLogin ? '登录' : '注册'} 习惯飞轮
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? '欢迎回来！请登录您的账户' : '创建新账户开始您的习惯之旅'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  placeholder="请输入用户名"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="请输入邮箱地址"
              />
            </div>
            
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="请输入密码"
                minLength={6}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin ? '没有账户？立即注册' : '已有账户？立即登录'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
