import { useState } from "react";
import { useAppState } from "@/contexts/AppStateContext";
import { Habit, Frequency, FrequencyType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressBar } from "@/components/ui/progress-bar";

// 工具函数：生成频率描述
const generateFrequencyDescription = (frequency: Frequency): string => {
  switch (frequency.type) {
    case "daily":
      return `每天 ${frequency.times} 次`;
    case "weekly":
      if (frequency.weekdays && frequency.weekdays.length > 0) {
        const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        const selectedDays = frequency.weekdays.map(day => weekdayNames[day]).join("、");
        return `每周${selectedDays}，${frequency.times} 次`;
      }
      return `每周 ${frequency.times} 次`;
    case "monthly":
      return `每月 ${frequency.times} 次`;
    case "custom":
      return frequency.period ? `每 ${frequency.period} 天 ${frequency.times} 次` : frequency.description;
    default:
      return frequency.description;
  }
};

const Habits = () => {
  const { 
    state, 
    addHabit, 
    updateHabit, 
    deleteHabit, 
    getGroupById,
    getHabitCompletionCount
  } = useAppState();
  
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // New habit form state
  const [newHabit, setNewHabit] = useState({
    name: "",
    groupId: "" as string | null,
    frequency: {
      type: "daily" as FrequencyType,
      times: 1,
      period: undefined,
      weekdays: [] as number[],
      description: ""
    } as Frequency,
    energyValue: 10
  });
  
  // Edit habit form state
  const [editHabit, setEditHabit] = useState({
    id: "",
    name: "",
    groupId: "" as string | null,
    frequency: {
      type: "daily" as FrequencyType,
      times: 1,
      period: undefined,
      weekdays: [] as number[],
      description: ""
    } as Frequency,
    energyValue: 10
  });
  
  // 更新新习惯频率
  const updateNewHabitFrequency = (updates: Partial<Frequency>) => {
    const updatedFrequency = { ...newHabit.frequency, ...updates };
    updatedFrequency.description = generateFrequencyDescription(updatedFrequency);
    setNewHabit({ ...newHabit, frequency: updatedFrequency });
  };

  // 更新编辑习惯频率
  const updateEditHabitFrequency = (updates: Partial<Frequency>) => {
    const updatedFrequency = { ...editHabit.frequency, ...updates };
    updatedFrequency.description = generateFrequencyDescription(updatedFrequency);
    setEditHabit({ ...editHabit, frequency: updatedFrequency });
  };

  const handleAddHabit = () => {
    if (newHabit.name.trim()) {
      const groupId = newHabit.groupId === "global" ? null : newHabit.groupId;
      addHabit(
        newHabit.name.trim(),
        groupId,
        newHabit.frequency,
        Number(newHabit.energyValue) || 10
      );
      
      setNewHabit({
        name: "",
        groupId: "",
        frequency: {
          type: "daily",
          times: 1,
          period: undefined,
          weekdays: [],
          description: "每天 1 次"
        },
        energyValue: 10
      });
      
      setIsAddDialogOpen(false);
    }
  };
  
  const handleEditHabit = () => {
    if (editHabit.name.trim()) {
      const groupId = editHabit.groupId === "global" ? null : editHabit.groupId;
      updateHabit({
        id: editHabit.id,
        name: editHabit.name.trim(),
        groupId: groupId,
        frequency: editHabit.frequency,
        energyValue: Number(editHabit.energyValue) || 10
      });
      
      setEditingHabit(null);
      setIsEditDialogOpen(false);
    }
  };
  
  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setEditHabit({
      id: habit.id,
      name: habit.name,
      groupId: habit.groupId === null ? "global" : habit.groupId,
      frequency: habit.frequency,
      energyValue: habit.energyValue
    });
    setIsEditDialogOpen(true);
  };
  
  // 切换星期几选择
  const toggleWeekday = (day: number, isEdit: boolean = false) => {
    if (isEdit) {
      const currentWeekdays = editHabit.frequency.weekdays || [];
      const newWeekdays = currentWeekdays.includes(day)
        ? currentWeekdays.filter(d => d !== day)
        : [...currentWeekdays, day].sort();
      updateEditHabitFrequency({ weekdays: newWeekdays });
    } else {
      const currentWeekdays = newHabit.frequency.weekdays || [];
      const newWeekdays = currentWeekdays.includes(day)
        ? currentWeekdays.filter(d => d !== day)
        : [...currentWeekdays, day].sort();
      updateNewHabitFrequency({ weekdays: newWeekdays });
    }
  };

  // 渲染频率设置组件
  const renderFrequencySettings = (frequency: Frequency, isEdit: boolean = false) => {
    const updateFrequency = isEdit ? updateEditHabitFrequency : updateNewHabitFrequency;
    
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">频率类型</label>
          <Select 
            value={frequency.type} 
            onValueChange={(value: FrequencyType) => updateFrequency({ type: value, weekdays: [], period: undefined })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">每天</SelectItem>
              <SelectItem value="weekly">每周</SelectItem>
              <SelectItem value="monthly">每月</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">次数</label>
          <Input
            type="number"
            min="1"
            value={frequency.times}
            onChange={(e) => updateFrequency({ times: parseInt(e.target.value) || 1 })}
          />
        </div>

        {frequency.type === "weekly" && (
          <div>
            <label className="text-sm font-medium mb-2 block">选择星期几</label>
            <div className="grid grid-cols-4 gap-2">
              {["周日", "周一", "周二", "周三", "周四", "周五", "周六"].map((day, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`weekday-${index}-${isEdit ? 'edit' : 'new'}`}
                    checked={(frequency.weekdays || []).includes(index)}
                    onCheckedChange={() => toggleWeekday(index, isEdit)}
                  />
                  <label 
                    htmlFor={`weekday-${index}-${isEdit ? 'edit' : 'new'}`}
                    className="text-sm"
                  >
                    {day}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {frequency.type === "custom" && (
          <div>
            <label className="text-sm font-medium mb-1 block">间隔天数</label>
            <Input
              type="number"
              min="1"
              value={frequency.period || ""}
              onChange={(e) => updateFrequency({ period: parseInt(e.target.value) || undefined })}
              placeholder="例如：3（每3天）"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block">描述预览</label>
          <div className="p-2 bg-gray-50 rounded text-sm">
            {frequency.description || "请设置频率"}
          </div>
        </div>
      </div>
    );
  };

  // Filter habits based on selected group
  const filteredHabits = selectedGroup === "all" 
    ? state.habits
    : selectedGroup === "global"
    ? state.habits.filter(habit => habit.groupId === null)
    : state.habits.filter(habit => habit.groupId === selectedGroup);
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">习惯管理</h1>
        <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
          <Select 
            value={selectedGroup} 
            onValueChange={setSelectedGroup}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择分组" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分组</SelectItem>
              <SelectItem value="global">公共池</SelectItem>
              {state.groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>添加习惯</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>添加新习惯</DialogTitle>
                <DialogDescription>
                  创建一个新的习惯并设置其完成后获得的能量值。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="text-sm font-medium mb-1 block">习惯名称</label>
                  <Input
                    value={newHabit.name}
                    onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                    placeholder="例如：晨跑30分钟"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">所属分组</label>
                  <Select 
                    value={newHabit.groupId || ""} 
                    onValueChange={value => setNewHabit({...newHabit, groupId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分组" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">公共池</SelectItem>
                      {state.groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {renderFrequencySettings(newHabit.frequency)}
                
                <div>
                  <label className="text-sm font-medium mb-1 block">能量值</label>
                  <Input
                    type="number"
                    min="1"
                    value={newHabit.energyValue}
                    onChange={e => setNewHabit({...newHabit, energyValue: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAddHabit}>
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredHabits.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedGroup === "all" ? "还没有习惯" : 
               selectedGroup === "global" ? "公共池下没有习惯" :
               "该分组下没有习惯"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">点击"添加习惯"按钮创建你的第一个习惯。</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>添加习惯</Button>
          </CardContent>
        </Card>
      )}

      {filteredHabits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map(habit => {
            const group = habit.groupId ? getGroupById(habit.groupId) : null;
            const completionCount = getHabitCompletionCount(habit.id);
            
            return (
              <Card key={habit.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                    <span className="energy-badge bg-habit-softpurple text-habit-purple">
                      +{habit.energyValue} 能量
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">
                    频率: {habit.frequency.description}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    分组: {group?.name || "公共池"}
                  </p>
                  
                  <p className="text-sm font-medium mb-1">
                    已完成: <span className="font-bold">{completionCount}</span> 次
                  </p>
                  
                  <ProgressBar 
                    current={completionCount} 
                    max={30} 
                    barColor="bg-[hsl(var(--habit-purple))]"
                    label="完成进度"
                    className="mb-4"
                  />
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(habit)}
                    >
                      编辑
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除习惯</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除习惯 "{habit.name}" 吗？此操作不可撤销，相关的完成记录也会被删除。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteHabit(habit.id)}>
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑习惯</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 max-h-96 overflow-y-auto">
            <div>
              <label className="text-sm font-medium mb-1 block">习惯名称</label>
              <Input
                value={editHabit.name}
                onChange={e => setEditHabit({...editHabit, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">所属分组</label>
              <Select 
                value={editHabit.groupId || ""} 
                onValueChange={value => setEditHabit({...editHabit, groupId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">公共池</SelectItem>
                  {state.groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {renderFrequencySettings(editHabit.frequency, true)}
            
            <div>
              <label className="text-sm font-medium mb-1 block">能量值</label>
              <Input
                type="number"
                min="1"
                value={editHabit.energyValue}
                onChange={e => setEditHabit({...editHabit, energyValue: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditHabit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Habits;
