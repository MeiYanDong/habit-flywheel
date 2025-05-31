import { useAppState } from "@/contexts/AppStateContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { memo, useMemo } from "react";
import { CheckCircle, Plus, Award, Clock } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";

// 将习惯卡片抽离为单独组件并用memo优化
const HabitCard = memo(({ habit, onComplete, groupName, energy }: {
  habit: any;
  onComplete: (id: string) => void;
  groupName: string;
  energy: number;
}) => (
  <Card className="apple-card overflow-hidden">
    <div className="p-5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-lg">{habit.name}</h3>
          <p className="text-[hsl(var(--apple-gray))] text-sm">{habit.frequency.description}</p>
        </div>
        <span className="energy-badge bg-[hsl(var(--apple-blue)_/_0.1)] text-[hsl(var(--apple-blue))] font-medium">
          +{energy}
        </span>
      </div>
      
      <div className="flex items-center mt-1 mb-3">
        <div className="w-3 h-3 rounded-full bg-[hsl(var(--habit-softpurple))] flex-shrink-0"></div>
        <p className="text-xs text-[hsl(var(--apple-gray))] ml-2">
          {groupName}
        </p>
      </div>
      
      <div className="mt-auto">
        <Button 
          onClick={() => onComplete(habit.id)}
          className="apple-button apple-button-primary w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          完成
        </Button>
      </div>
    </div>
  </Card>
));

// 能量卡片组件
const EnergyCard = memo(({ title, energy, className, icon, max = 200 }: {
  title: string;
  energy: number;
  className: string;
  icon?: React.ReactNode;
  max?: number;
}) => (
  <Card className={`apple-card overflow-hidden ${className}`}>
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-base">{title}</h3>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
      <div className="flex items-baseline mb-2">
        <span className="text-3xl font-bold">{energy}</span>
        <span className="text-sm ml-1 opacity-70">能量</span>
      </div>
      
      <ProgressBar 
        current={energy} 
        max={max} 
        showText={false} 
      />
    </div>
  </Card>
));

const Today = () => {
  const { 
    state, 
    loading,
    completeHabit, 
    getTodaysHabits, 
    getGroupById,
    getGroupEnergy,
    getTotalEnergy
  } = useAppState();
  
  // 缓存计算结果
  const todaysHabits = useMemo(() => getTodaysHabits(), [getTodaysHabits]);
  const hasHabits = useMemo(() => state.habits.length > 0, [state.habits.length]);
  const totalEnergy = useMemo(() => getTotalEnergy(), [getTotalEnergy]);
  const globalEnergy = useMemo(() => getGroupEnergy(null), [getGroupEnergy]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">今日习惯</h1>
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--apple-light-gray))] flex items-center justify-center">
            <Clock className="h-5 w-5 text-[hsl(var(--apple-blue))]" />
          </div>
        </div>
        
        <Card className="apple-card p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--apple-blue))] mx-auto mb-4"></div>
            <p className="text-[hsl(var(--apple-gray))]">正在加载数据...</p>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">今日习惯</h1>
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--apple-light-gray))] flex items-center justify-center">
          <Clock className="h-5 w-5 text-[hsl(var(--apple-blue))]" />
        </div>
      </div>
      
      {!hasHabits && (
        <Card className="apple-card mb-8 p-6">
          <div className="text-center p-4">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--apple-light-gray))] flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-[hsl(var(--apple-blue))]" />
            </div>
            <CardTitle className="mb-2">开始你的习惯之旅</CardTitle>
            <CardDescription className="mb-6 max-w-md mx-auto">
              你还没有创建任何习惯。前往"习惯管理"创建你的第一个习惯吧！
            </CardDescription>
            <Button onClick={() => window.location.href = '/habits'} className="apple-button apple-button-primary">
              去创建习惯
            </Button>
          </div>
        </Card>
      )}
      
      {hasHabits && todaysHabits.length === 0 && (
        <Card className="apple-card mb-8 bg-gradient-to-br from-[hsl(var(--apple-green)_/_0.05)] to-[hsl(var(--apple-green)_/_0.1)]">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--apple-green)_/_0.1)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-[hsl(var(--apple-green))]" />
            </div>
            <CardTitle className="mb-2">恭喜你！</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto">
              今天的所有习惯都已完成！好好休息，明天再接再厉。
            </CardDescription>
          </div>
        </Card>
      )}
      
      {todaysHabits.length > 0 && (
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {todaysHabits.map(habit => {
              const group = habit.groupId ? getGroupById(habit.groupId) : null;
              const groupName = group?.name || "公共池";
              
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onComplete={completeHabit}
                  groupName={groupName}
                  energy={habit.energyValue}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {hasHabits && (
        <div>
          <div className="flex items-center mb-5">
            <h2 className="text-xl font-semibold">能量概览</h2>
            <div className="ml-3 flex items-center">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--apple-blue))]"></div>
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--apple-purple))] ml-1"></div>
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--apple-green))] ml-1"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 公共池能量 */}
            <EnergyCard
              title="公共池"
              energy={globalEnergy}
              className="bg-gradient-to-br from-white to-[hsl(var(--apple-blue)_/_0.1)]"
              icon={<div className="w-8 h-8 rounded-full bg-[hsl(var(--apple-blue)_/_0.1)] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--apple-blue))]"></div>
              </div>}
            />
            
            {/* 各分组能量 */}
            {state.groups.map(group => (
              <EnergyCard
                key={group.id}
                title={group.name}
                energy={getGroupEnergy(group.id)}
                className="bg-gradient-to-br from-white to-[hsl(var(--apple-purple)_/_0.1)]"
                icon={<div className="w-8 h-8 rounded-full bg-[hsl(var(--habit-softpurple))] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--habit-purple))]"></div>
                </div>}
              />
            ))}
            
            {/* 总能量 */}
            <EnergyCard
              title="总能量"
              energy={totalEnergy}
              className="bg-gradient-to-br from-white to-[hsl(var(--apple-green)_/_0.1)]"
              icon={<Award className="h-5 w-5 text-[hsl(var(--apple-green))]" />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Today;
