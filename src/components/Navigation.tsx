import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppState } from "@/contexts/AppStateContext";
import { useAuth } from "@/contexts/AuthContext";
import { Group } from "@/types";
import UserProfile from "./UserProfile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { User, Home, Calendar, LayoutGrid, Award, Clock, ChevronRight, Users } from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppState();
  const { user } = useAuth();
  const [showMobileNav, setShowMobileNav] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  
  const handleNavClick = (path: string) => {
    navigate(path);
    setShowMobileNav(false);
  };
  
  // 菜单项定义
  const menuItems = [
    { path: "/", label: "今日习惯", icon: <Home className="h-5 w-5" /> },
    { path: "/groups", label: "分组管理", icon: <LayoutGrid className="h-5 w-5" /> },
    { path: "/habits", label: "习惯管理", icon: <Calendar className="h-5 w-5" /> },
    { path: "/rewards", label: "奖励管理", icon: <Award className="h-5 w-5" /> },
    { path: "/history", label: "历史记录", icon: <Clock className="h-5 w-5" /> },
    { path: "/community", label: "社区互动", icon: <Users className="h-5 w-5" /> },
  ];
  
  // 渲染导航按钮
  const renderNavButton = (path: string, label: string, icon: React.ReactNode) => {
    const active = isActive(path);
    return (
      <Button
        key={path}
        variant="ghost"
        className={`justify-start w-full rounded-xl text-base font-medium h-11 ${
          active 
            ? "bg-[hsl(var(--apple-blue)_/_0.1)] text-[hsl(var(--apple-blue))]" 
            : "text-[hsl(var(--apple-gray))] hover:bg-[hsl(var(--apple-light-gray))] hover:text-[hsl(var(--apple-blue))]"
        }`}
        onClick={() => handleNavClick(path)}
      >
        <div className="flex items-center gap-3 w-full">
          <span className={active ? "text-[hsl(var(--apple-blue))]" : "text-[hsl(var(--apple-gray))]"}>
            {icon}
          </span>
          {label}
        </div>
      </Button>
    );
  };
  
  return (
    <>
      {/* 移动导航按钮 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">习惯飞轮</h2>
        <Button 
          variant="ghost" 
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
          onClick={() => setShowMobileNav(!showMobileNav)}
        >
          {showMobileNav ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          )}
        </Button>
      </div>
      
      {/* 移动导航抽屉 */}
      {showMobileNav && (
        <div className="md:hidden fixed inset-0 z-40 bg-white/95 pt-20 px-4 overflow-auto">
          <div className="flex flex-col gap-2">
            {/* 用户信息 */}
            {user && (
              <Card className="apple-card mb-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--apple-blue)_/_0.1)] flex items-center justify-center">
                    <User className="h-5 w-5 text-[hsl(var(--apple-blue))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.email}</p>
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <UserProfile />
                    </SheetContent>
                  </Sheet>
                </div>
              </Card>
            )}
            
            {/* 导航菜单 */}
            <div className="space-y-1.5">
              {menuItems.map(item => renderNavButton(item.path, item.label, item.icon))}
            </div>
            
            {/* 分组列表 */}
            {state.groups.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-[hsl(var(--apple-gray))] px-2">我的分组</h3>
                <div className="space-y-1.5">
                  {state.groups.map((group: Group) => (
                    <Button
                      key={group.id}
                      variant="ghost"
                      className={`justify-start w-full rounded-xl h-11 ${
                        isActive(`/group/${group.id}`) 
                          ? "bg-[hsl(var(--apple-blue)_/_0.1)] text-[hsl(var(--apple-blue))]" 
                          : "text-[hsl(var(--apple-gray))] hover:bg-[hsl(var(--apple-light-gray))]"
                      }`}
                      onClick={() => handleNavClick(`/group/${group.id}`)}
                    >
                      <div className="flex items-center gap-3 w-full overflow-hidden">
                        <span className="flex-shrink-0 w-5 h-5 rounded-md bg-[hsl(var(--habit-softpurple))] flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-[hsl(var(--habit-purple))]"></span>
                        </span>
                        <span className="truncate">{group.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 桌面导航 */}
      <div className="hidden md:block">
        <div className="fixed left-0 top-0 bottom-0 w-[260px] bg-white/80 backdrop-blur-md border-r p-4 overflow-auto">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold">习惯飞轮</h2>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                    <User className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <UserProfile />
                </SheetContent>
              </Sheet>
            </div>
            
            {/* 用户信息 */}
            {user && (
              <Card className="apple-card mb-6 p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--apple-blue)_/_0.1)] flex items-center justify-center">
                    <User className="h-4 w-4 text-[hsl(var(--apple-blue))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* 导航菜单 */}
            <div className="space-y-1.5 mb-6">
              {menuItems.map(item => renderNavButton(item.path, item.label, item.icon))}
            </div>
            
            {/* 分组列表 */}
            {state.groups.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[hsl(var(--apple-gray))] px-2">我的分组</h3>
                <div className="space-y-1.5">
                  {state.groups.map((group: Group) => (
                    <Button
                      key={group.id}
                      variant="ghost"
                      className={`justify-start w-full rounded-xl h-11 ${
                        isActive(`/group/${group.id}`) 
                          ? "bg-[hsl(var(--apple-blue)_/_0.1)] text-[hsl(var(--apple-blue))]" 
                          : "text-[hsl(var(--apple-gray))] hover:bg-[hsl(var(--apple-light-gray))]"
                      }`}
                      onClick={() => handleNavClick(`/group/${group.id}`)}
                    >
                      <div className="flex items-center gap-3 w-full overflow-hidden">
                        <span className="flex-shrink-0 w-5 h-5 rounded-md bg-[hsl(var(--habit-softpurple))] flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-[hsl(var(--habit-purple))]"></span>
                        </span>
                        <span className="truncate">{group.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-auto pt-4">
              <Card className="apple-card bg-gradient-to-br from-[hsl(var(--apple-blue)_/_0.05)] to-[hsl(var(--apple-purple)_/_0.1)] p-4 border-0">
                <p className="text-sm text-center mb-2">养成好习惯，健康生活每一天</p>
                <div className="w-16 h-1 bg-[hsl(var(--apple-blue)_/_0.2)] rounded-full mx-auto"></div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* 为桌面视图提供左侧导航的空间 */}
      <div className="hidden md:block w-[260px] flex-shrink-0"></div>
    </>
  );
};

export default Navigation;
