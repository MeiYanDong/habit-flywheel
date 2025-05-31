
// Type definitions for the Habit Flywheel app

export interface Group {
  id: string;
  name: string;
}

export type FrequencyType = "daily" | "weekly" | "monthly" | "custom";

export interface Frequency {
  type: FrequencyType;
  times: number; // 次数
  period?: number; // 周期（用于自定义频率，如每X天）
  weekdays?: number[]; // 星期几（0-6，周日到周六，用于每周）
  description: string; // 显示用的描述
}

export interface Habit {
  id: string;
  name: string;
  groupId: string | null; // null表示属于公共池
  frequency: Frequency;
  energyValue: number;
}

export interface Reward {
  id: string;
  name: string;
  groupId: string | null; // null表示属于公共池，可用全局能量兑换
  energyCost: number;
  description?: string;
  redeemed?: boolean;
  redeemedTimestamp?: string;
}

export interface HabitLog {
  habitId: string;
  timestamp: string;
  completed: boolean;
}

export interface EnergyLog {
  timestamp: string;
  groupId: string | null; // null表示公共池的能量变动
  amount: number;
  type: "gain" | "spend";
  reason: string;
}

export interface RedeemedRewardLog {
  rewardId: string;
  name: string;
  groupId: string | null;
  energyCost: number;
  timestamp: string;
}

export interface AppState {
  groups: Group[];
  habits: Habit[];
  rewards: Reward[];
  groupEnergies: Record<string, number>;
  globalEnergy: number; // 新增：公共池能量
  habitLog: HabitLog[];
  energyLog: EnergyLog[];
  redeemedRewardsLog: RedeemedRewardLog[];
}
