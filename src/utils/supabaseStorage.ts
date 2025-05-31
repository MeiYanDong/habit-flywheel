import { supabase } from '@/integrations/supabase/client';
import { AppState, Group, Habit, Reward, HabitLog, EnergyLog, RedeemedRewardLog, Frequency } from '@/types';

// 缓存机制
let cachedData: AppState | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 5秒缓存

// 从Supabase加载应用状态
export const loadAppStateFromSupabase = async (forceRefresh = false): Promise<AppState | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 使用缓存，除非强制刷新
    const now = Date.now();
    if (!forceRefresh && cachedData && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedData;
    }

    // 并行获取所有数据
    const [
      { data: groups },
      { data: habits },
      { data: rewards },
      { data: habitLogs },
      { data: energyLogs },
      { data: redeemedRewardsLogs }
    ] = await Promise.all([
      supabase.from('groups').select('*').eq('user_id', user.id),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('rewards').select('*').eq('user_id', user.id),
      supabase.from('habit_logs').select('*').eq('user_id', user.id),
      supabase.from('energy_logs').select('*').eq('user_id', user.id),
      supabase.from('redeemed_rewards_log').select('*').eq('user_id', user.id)
    ]);

    // 计算分组能量
    const groupEnergies: Record<string, number> = {};
    let globalEnergy = 0;

    // 初始化所有分组能量为0
    groups?.forEach(group => {
      groupEnergies[group.id] = 0;
    });

    // 计算能量值
    energyLogs?.forEach(log => {
      const amount = log.type === 'gain' ? log.amount : -log.amount;
      if (log.group_id) {
        groupEnergies[log.group_id] = (groupEnergies[log.group_id] || 0) + amount;
      } else {
        globalEnergy += amount;
      }
    });

    const appState: AppState = {
      groups: groups?.map(g => ({ id: g.id, name: g.name })) || [],
      habits: habits?.map(h => ({
        id: h.id,
        name: h.name,
        groupId: h.group_id,
        frequency: h.frequency as unknown as Frequency,
        energyValue: h.energy_value
      })) || [],
      rewards: rewards?.map(r => ({
        id: r.id,
        name: r.name,
        groupId: r.group_id,
        energyCost: r.energy_cost,
        description: r.description || undefined,
        redeemed: r.redeemed || false,
        redeemedTimestamp: r.redeemed_timestamp || undefined
      })) || [],
      groupEnergies,
      globalEnergy,
      habitLog: habitLogs?.map(log => ({
        habitId: log.habit_id,
        timestamp: log.timestamp,
        completed: log.completed
      })) || [],
      energyLog: energyLogs?.map(log => ({
        timestamp: log.timestamp,
        groupId: log.group_id,
        amount: log.amount,
        type: log.type as 'gain' | 'spend',
        reason: log.reason
      })) || [],
      redeemedRewardsLog: redeemedRewardsLogs?.map(log => ({
        rewardId: log.reward_id,
        name: log.name,
        groupId: log.group_id,
        energyCost: log.energy_cost,
        timestamp: log.timestamp
      })) || []
    };

    // 更新缓存
    cachedData = appState;
    lastFetchTime = now;

    return appState;
  } catch (error) {
    console.error('加载数据失败:', error);
    return null;
  }
};

// 清除缓存
export const clearCache = () => {
  cachedData = null;
  lastFetchTime = 0;
};

// 快速操作 - 无需刷新整个数据
export const quickSaveGroup = async (group: Group): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('groups')
      .upsert({
        id: group.id,
        user_id: user.id,
        name: group.name
      });

    if (!error && cachedData) {
      // 更新缓存中的数据
      const existingIndex = cachedData.groups.findIndex(g => g.id === group.id);
      if (existingIndex >= 0) {
        cachedData.groups[existingIndex] = group;
      } else {
        cachedData.groups.push(group);
      }
    }

    return !error;
  } catch (error) {
    console.error('保存分组失败:', error);
    return false;
  }
};

// 保存分组
export const saveGroup = async (group: Group): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('groups')
      .upsert({
        id: group.id,
        user_id: user.id,
        name: group.name
      });

    return !error;
  } catch (error) {
    console.error('保存分组失败:', error);
    return false;
  }
};

// 保存习惯
export const saveHabit = async (habit: Habit): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('habits')
      .upsert({
        id: habit.id,
        user_id: user.id,
        name: habit.name,
        group_id: habit.groupId,
        frequency: habit.frequency as unknown as any,
        energy_value: habit.energyValue
      });

    return !error;
  } catch (error) {
    console.error('保存习惯失败:', error);
    return false;
  }
};

// 保存奖励
export const saveReward = async (reward: Reward): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('rewards')
      .upsert({
        id: reward.id,
        user_id: user.id,
        name: reward.name,
        group_id: reward.groupId,
        energy_cost: reward.energyCost,
        description: reward.description,
        redeemed: reward.redeemed,
        redeemed_timestamp: reward.redeemedTimestamp
      });

    return !error;
  } catch (error) {
    console.error('保存奖励失败:', error);
    return false;
  }
};

// 批量操作 - 完成习惯
export const batchCompleteHabit = async (habitId: string, energyChange: { groupId: string | null, amount: number, reason: string }): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // 并行执行操作
    const [habitResult, energyResult] = await Promise.all([
      supabase.from('habit_logs').insert({
        user_id: user.id,
        habit_id: habitId,
        completed: true,
        timestamp: new Date().toISOString()
      }),
      supabase.from('energy_logs').insert({
        user_id: user.id,
        group_id: energyChange.groupId,
        amount: energyChange.amount,
        type: 'gain',
        reason: energyChange.reason,
        timestamp: new Date().toISOString()
      })
    ]);

    return !habitResult.error && !energyResult.error;
  } catch (error) {
    console.error('批量完成习惯失败:', error);
    return false;
  }
};

// 批量操作 - 兑换奖励
export const batchRedeemReward = async (
  rewardId: string,
  name: string,
  groupId: string | null,
  energyCost: number
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const timestamp = new Date().toISOString();

    // 并行执行所有操作
    const [redeemResult, energyResult, updateResult] = await Promise.all([
      supabase.from('redeemed_rewards_log').insert({
        user_id: user.id,
        reward_id: rewardId,
        name,
        group_id: groupId,
        energy_cost: energyCost,
        timestamp
      }),
      supabase.from('energy_logs').insert({
        user_id: user.id,
        group_id: groupId,
        amount: energyCost,
        type: 'spend',
        reason: `兑换奖励: ${name}`,
        timestamp
      }),
      supabase.from('rewards').update({
        redeemed: true,
        redeemed_timestamp: timestamp
      }).eq('id', rewardId)
    ]);

    return !redeemResult.error && !energyResult.error && !updateResult.error;
  } catch (error) {
    console.error('批量兑换奖励失败:', error);
    return false;
  }
};

// 记录习惯完成
export const logHabitCompletion = async (habitId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('habit_logs')
      .insert({
        user_id: user.id,
        habit_id: habitId,
        completed: true,
        timestamp: new Date().toISOString()
      });

    return !error;
  } catch (error) {
    console.error('记录习惯完成失败:', error);
    return false;
  }
};

// 记录能量变化
export const logEnergyChange = async (
  groupId: string | null,
  amount: number,
  type: 'gain' | 'spend',
  reason: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('energy_logs')
      .insert({
        user_id: user.id,
        group_id: groupId,
        amount,
        type,
        reason,
        timestamp: new Date().toISOString()
      });

    return !error;
  } catch (error) {
    console.error('记录能量变化失败:', error);
    return false;
  }
};

// 记录奖励兑换
export const logRewardRedemption = async (
  rewardId: string,
  name: string,
  groupId: string | null,
  energyCost: number
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('redeemed_rewards_log')
      .insert({
        user_id: user.id,
        reward_id: rewardId,
        name,
        group_id: groupId,
        energy_cost: energyCost,
        timestamp: new Date().toISOString()
      });

    return !error;
  } catch (error) {
    console.error('记录奖励兑换失败:', error);
    return false;
  }
};

// 删除数据的辅助函数
export const deleteGroup = async (groupId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (!error && cachedData) {
      // 更新缓存
      cachedData.groups = cachedData.groups.filter(g => g.id !== groupId);
    }

    return !error;
  } catch (error) {
    console.error('删除分组失败:', error);
    return false;
  }
};

export const deleteHabit = async (habitId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    return !error;
  } catch (error) {
    console.error('删除习惯失败:', error);
    return false;
  }
};

export const deleteReward = async (rewardId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    return !error;
  } catch (error) {
    console.error('删除奖励失败:', error);
    return false;
  }
};
