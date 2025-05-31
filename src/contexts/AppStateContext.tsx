
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { AppState, Group, Habit, Reward, Frequency } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  loadAppStateFromSupabase,
  quickSaveGroup,
  saveHabit,
  saveReward,
  batchCompleteHabit,
  batchRedeemReward,
  deleteGroup as deleteGroupFromSupabase,
  deleteHabit as deleteHabitFromSupabase,
  deleteReward as deleteRewardFromSupabase,
  clearCache
} from '@/utils/supabaseStorage';
import { useAuth } from './AuthContext';

interface AppStateContextType {
  state: AppState;
  loading: boolean;
  // Group management
  addGroup: (name: string) => Promise<void>;
  updateGroup: (id: string, name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  getGroupById: (id: string) => Group | undefined;
  
  // Habit management
  addHabit: (name: string, groupId: string | null, frequency: Frequency, energyValue: number) => Promise<void>;
  updateHabit: (updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string) => Promise<void>;
  getHabitById: (id: string) => Habit | undefined;
  getTodaysHabits: () => Habit[];
  getHabitsByGroupId: (groupId: string) => Habit[];
  getHabitCompletionCount: (habitId: string) => number;
  
  // Reward management
  addReward: (name: string, groupId: string | null, energyCost: number, description?: string) => Promise<void>;
  updateReward: (updates: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  redeemReward: (id: string) => Promise<void>;
  getRewardById: (id: string) => Reward | undefined;
  getRewardsByGroupId: (groupId: string) => Reward[];
  getAvailableRewards: (groupId?: string | null) => Reward[];
  getRedeemedRewards: (groupId?: string | null) => Reward[];
  
  // Energy management
  getGroupEnergy: (groupId: string | null) => number;
  getTotalEnergy: () => number;
  
  // Utility functions
  refreshData: () => Promise<void>;
}

const defaultState: AppState = {
  groups: [],
  habits: [],
  rewards: [],
  groupEnergies: {},
  globalEnergy: 0,
  habitLog: [],
  energyLog: [],
  redeemedRewardsLog: []
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider = ({ children }: AppStateProviderProps) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // 防抖刷新
  const debouncedRefresh = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (forceRefresh = false) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => refreshData(forceRefresh), 300);
      };
    })(),
    []
  );

  // 从Supabase加载数据
  const refreshData = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await loadAppStateFromSupabase(forceRefresh);
      if (data) {
        setState(data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载应用数据',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 初始化时加载数据
  useEffect(() => {
    if (user) {
      clearCache(); // 清除缓存确保获取最新数据
      refreshData(true);
    } else {
      setState(defaultState);
      setLoading(false);
    }
  }, [user, refreshData]);

  // Group management - 使用快速保存
  const addGroup = useCallback(async (name: string) => {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
    };

    const success = await quickSaveGroup(newGroup);
    if (success) {
      // 立即更新本地状态，无需等待刷新
      setState(prev => ({
        ...prev,
        groups: [...prev.groups, newGroup],
        groupEnergies: { ...prev.groupEnergies, [newGroup.id]: 0 }
      }));
      toast({
        title: '成功',
        description: '分组已创建',
      });
    } else {
      toast({
        title: '失败',
        description: '创建分组失败',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const updateGroup = useCallback(async (id: string, name: string) => {
    const group = state.groups.find(g => g.id === id);
    if (!group) return;

    const updatedGroup = { ...group, name };
    const success = await quickSaveGroup(updatedGroup);
    if (success) {
      // 立即更新本地状态
      setState(prev => ({
        ...prev,
        groups: prev.groups.map(g => g.id === id ? updatedGroup : g)
      }));
      toast({
        title: '成功',
        description: '分组已更新',
      });
    } else {
      toast({
        title: '失败',
        description: '更新分组失败',
        variant: 'destructive',
      });
    }
  }, [state.groups, toast]);

  const deleteGroup = useCallback(async (id: string) => {
    const success = await deleteGroupFromSupabase(id);
    if (success) {
      // 立即更新本地状态
      setState(prev => {
        const newGroupEnergies = { ...prev.groupEnergies };
        delete newGroupEnergies[id];
        return {
          ...prev,
          groups: prev.groups.filter(g => g.id !== id),
          groupEnergies: newGroupEnergies
        };
      });
      toast({
        title: '成功',
        description: '分组已删除',
      });
    } else {
      toast({
        title: '失败',
        description: '删除分组失败',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // 缓存计算结果
  const getGroupById = useCallback((id: string) => {
    return state.groups.find(g => g.id === id);
  }, [state.groups]);

  // Habit management
  const addHabit = useCallback(async (name: string, groupId: string | null, frequency: Frequency, energyValue: number) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      groupId,
      frequency,
      energyValue,
    };

    const success = await saveHabit(newHabit);
    if (success) {
      debouncedRefresh();
      toast({
        title: '成功',
        description: '习惯已创建',
      });
    } else {
      toast({
        title: '失败',
        description: '创建习惯失败',
        variant: 'destructive',
      });
    }
  }, [debouncedRefresh, toast]);

  const updateHabit = useCallback(async (updates: Partial<Habit>) => {
    if (!updates.id) return;
    
    const habit = state.habits.find(h => h.id === updates.id);
    if (!habit) return;

    const updatedHabit = { ...habit, ...updates };
    const success = await saveHabit(updatedHabit);
    if (success) {
      debouncedRefresh();
      toast({
        title: '成功',
        description: '习惯已更新',
      });
    } else {
      toast({
        title: '失败',
        description: '更新习惯失败',
        variant: 'destructive',
      });
    }
  }, [state.habits, debouncedRefresh, toast]);

  const deleteHabit = useCallback(async (id: string) => {
    const success = await deleteHabitFromSupabase(id);
    if (success) {
      debouncedRefresh();
      toast({
        title: '成功',
        description: '习惯已删除',
      });
    } else {
      toast({
        title: '失败',
        description: '删除习惯失败',
        variant: 'destructive',
      });
    }
  }, [debouncedRefresh, toast]);

  const completeHabit = useCallback(async (id: string) => {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    // 使用批量操作
    const success = await batchCompleteHabit(id, {
      groupId: habit.groupId,
      amount: habit.energyValue,
      reason: `完成习惯: ${habit.name}`
    });

    if (success) {
      debouncedRefresh();
      toast({
        title: '完成习惯',
        description: `恭喜！获得 ${habit.energyValue} 点能量`,
      });
    } else {
      toast({
        title: '失败',
        description: '记录习惯完成失败',
        variant: 'destructive',
      });
    }
  }, [state.habits, debouncedRefresh, toast]);

  // 缓存复杂计算
  const getHabitById = useCallback((id: string) => {
    return state.habits.find(h => h.id === id);
  }, [state.habits]);

  const getHabitsByGroupId = useCallback((groupId: string) => {
    return state.habits.filter(habit => habit.groupId === groupId);
  }, [state.habits]);

  const getHabitCompletionCount = useCallback((habitId: string) => {
    return state.habitLog.filter(log => log.habitId === habitId && log.completed).length;
  }, [state.habitLog]);

  // 计算今日习惯的逻辑
  const todaysHabitsData = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    
    return state.habits.filter(habit => {
      const todaysLogs = state.habitLog.filter(log => {
        const logDate = new Date(log.timestamp);
        return log.habitId === habit.id && 
               logDate.toDateString() === todayStr && 
               log.completed;
      });

      const { type, times } = habit.frequency;
      
      switch (type) {
        case 'daily':
          return todaysLogs.length < times;
        case 'weekly':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          weekStart.setHours(0, 0, 0, 0);
          
          const thisWeeksLogs = state.habitLog.filter(log => {
            const logDate = new Date(log.timestamp);
            return log.habitId === habit.id && 
                   logDate >= weekStart && 
                   log.completed;
          });
          return thisWeeksLogs.length < times;
        case 'monthly':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const thisMonthsLogs = state.habitLog.filter(log => {
            const logDate = new Date(log.timestamp);
            return log.habitId === habit.id && 
                   logDate >= monthStart && 
                   log.completed;
          });
          return thisMonthsLogs.length < times;
        default:
          return todaysLogs.length < times;
      }
    });
  }, [state.habits, state.habitLog]);

  // 返回今日习惯的函数
  const getTodaysHabits = useCallback(() => {
    return todaysHabitsData;
  }, [todaysHabitsData]);

  // Reward management
  const addReward = useCallback(async (name: string, groupId: string | null, energyCost: number, description?: string) => {
    const newReward: Reward = {
      id: crypto.randomUUID(),
      name,
      groupId,
      energyCost,
      description,
      redeemed: false,
    };

    const success = await saveReward(newReward);
    if (success) {
      debouncedRefresh();
      toast({
        title: '成功',
        description: '奖励已创建',
      });
    } else {
      toast({
        title: '失败',
        description: '创建奖励失败',
        variant: 'destructive',
      });
    }
  }, [debouncedRefresh, toast]);

  const updateReward = useCallback(async (updates: Partial<Reward>) => {
    if (!updates.id) return;
    
    const reward = state.rewards.find(r => r.id === updates.id);
    if (!reward) return;

    const updatedReward = { ...reward, ...updates };
    const success = await saveReward(updatedReward);
    if (success) {
      debouncedRefresh();
      toast({
        title: '成功',
        description: '奖励已更新',
      });
    } else {
      toast({
        title: '失败',
        description: '更新奖励失败',
        variant: 'destructive',
      });
    }
  }, [state.rewards, debouncedRefresh, toast]);

  const deleteReward = useCallback(async (id: string) => {
    const success = await deleteRewardFromSupabase(id);
    if (success) {
      debouncedRefresh();
      toast({
        title: '成功',
        description: '奖励已删除',
      });
    } else {
      toast({
        title: '失败',
        description: '删除奖励失败',
        variant: 'destructive',
      });
    }
  }, [debouncedRefresh, toast]);

  const redeemReward = useCallback(async (id: string) => {
    const reward = state.rewards.find(r => r.id === id);
    if (!reward) return;

    const currentEnergy = getGroupEnergy(reward.groupId);
    
    if (currentEnergy < reward.energyCost) {
      toast({
        title: '能量不足',
        description: `需要 ${reward.energyCost} 点能量，当前只有 ${currentEnergy} 点`,
        variant: 'destructive',
      });
      return;
    }

    // 使用批量操作
    const success = await batchRedeemReward(
      reward.id,
      reward.name,
      reward.groupId,
      reward.energyCost
    );

    if (success) {
      debouncedRefresh();
      toast({
        title: '兑换成功',
        description: `已兑换奖励: ${reward.name}`,
      });
    } else {
      toast({
        title: '失败',
        description: '兑换奖励失败',
        variant: 'destructive',
      });
    }
  }, [state.rewards, debouncedRefresh, toast]);

  // 缓存其他计算
  const getRewardById = useCallback((id: string) => {
    return state.rewards.find(r => r.id === id);
  }, [state.rewards]);

  const getRewardsByGroupId = useCallback((groupId: string) => {
    return state.rewards.filter(reward => reward.groupId === groupId);
  }, [state.rewards]);

  const getAvailableRewards = useCallback((groupId?: string | null) => {
    if (groupId === undefined) {
      return state.rewards.filter(reward => !reward.redeemed);
    }
    return state.rewards.filter(reward => reward.groupId === groupId && !reward.redeemed);
  }, [state.rewards]);

  const getRedeemedRewards = useCallback((groupId?: string | null) => {
    if (groupId === undefined) {
      return state.rewards.filter(reward => reward.redeemed);
    }
    return state.rewards.filter(reward => reward.groupId === groupId && reward.redeemed);
  }, [state.rewards]);

  // Energy management
  const getGroupEnergy = useCallback((groupId: string | null) => {
    if (groupId === null) {
      return state.globalEnergy;
    }
    return state.groupEnergies[groupId] || 0;
  }, [state.globalEnergy, state.groupEnergies]);

  const getTotalEnergy = useCallback(() => {
    const groupTotal = Object.values(state.groupEnergies).reduce((sum, energy) => sum + energy, 0);
    return groupTotal + state.globalEnergy;
  }, [state.groupEnergies, state.globalEnergy]);

  const value: AppStateContextType = useMemo(() => ({
    state,
    loading,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    getHabitById,
    getTodaysHabits,
    getHabitsByGroupId,
    getHabitCompletionCount,
    addReward,
    updateReward,
    deleteReward,
    redeemReward,
    getRewardById,
    getRewardsByGroupId,
    getAvailableRewards,
    getRedeemedRewards,
    getGroupEnergy,
    getTotalEnergy,
    refreshData,
  }), [
    state,
    loading,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    getHabitById,
    getTodaysHabits,
    getHabitsByGroupId,
    getHabitCompletionCount,
    addReward,
    updateReward,
    deleteReward,
    redeemReward,
    getRewardById,
    getRewardsByGroupId,
    getAvailableRewards,
    getRedeemedRewards,
    getGroupEnergy,
    getTotalEnergy,
    refreshData,
  ]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};
