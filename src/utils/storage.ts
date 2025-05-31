import { AppState, Group, Habit, Reward, HabitLog, EnergyLog, RedeemedRewardLog } from "../types";

// Storage keys
const STORAGE_PREFIX = "habitFlywheel_";
const GROUPS_KEY = `${STORAGE_PREFIX}groups`;
const HABITS_KEY = `${STORAGE_PREFIX}habits`;
const REWARDS_KEY = `${STORAGE_PREFIX}rewards`;
const GROUP_ENERGIES_KEY = `${STORAGE_PREFIX}groupEnergies`;
const GLOBAL_ENERGY_KEY = `${STORAGE_PREFIX}globalEnergy`;
const HABIT_LOG_KEY = `${STORAGE_PREFIX}habitLog`;
const ENERGY_LOG_KEY = `${STORAGE_PREFIX}energyLog`;
const REDEEMED_REWARDS_LOG_KEY = `${STORAGE_PREFIX}redeemedRewardsLog`;

// Helper to get item from localStorage with default value
const getLocalItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

// Helper to set item in localStorage
const setLocalItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Load the entire app state from localStorage
export const loadAppState = (): AppState => {
  return {
    groups: getLocalItem<Group[]>(GROUPS_KEY, []),
    habits: getLocalItem<Habit[]>(HABITS_KEY, []),
    rewards: getLocalItem<Reward[]>(REWARDS_KEY, []),
    groupEnergies: getLocalItem<Record<string, number>>(GROUP_ENERGIES_KEY, {}),
    globalEnergy: getLocalItem<number>(GLOBAL_ENERGY_KEY, 0),
    habitLog: getLocalItem<HabitLog[]>(HABIT_LOG_KEY, []),
    energyLog: getLocalItem<EnergyLog[]>(ENERGY_LOG_KEY, []),
    redeemedRewardsLog: getLocalItem<RedeemedRewardLog[]>(REDEEMED_REWARDS_LOG_KEY, []),
  };
};

// Save the entire app state to localStorage
export const saveAppState = (state: AppState): void => {
  setLocalItem(GROUPS_KEY, state.groups);
  setLocalItem(HABITS_KEY, state.habits);
  setLocalItem(REWARDS_KEY, state.rewards);
  setLocalItem(GROUP_ENERGIES_KEY, state.groupEnergies);
  setLocalItem(GLOBAL_ENERGY_KEY, state.globalEnergy);
  setLocalItem(HABIT_LOG_KEY, state.habitLog);
  setLocalItem(ENERGY_LOG_KEY, state.energyLog);
  setLocalItem(REDEEMED_REWARDS_LOG_KEY, state.redeemedRewardsLog);
};

// Generate a simple UUID for entity IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Helper functions to save individual entities
export const saveGroups = (groups: Group[]): void => {
  setLocalItem(GROUPS_KEY, groups);
};

export const saveHabits = (habits: Habit[]): void => {
  setLocalItem(HABITS_KEY, habits);
};

export const saveRewards = (rewards: Reward[]): void => {
  setLocalItem(REWARDS_KEY, rewards);
};

export const saveGroupEnergies = (groupEnergies: Record<string, number>): void => {
  setLocalItem(GROUP_ENERGIES_KEY, groupEnergies);
};

export const saveHabitLog = (habitLog: HabitLog[]): void => {
  setLocalItem(HABIT_LOG_KEY, habitLog);
};

export const saveEnergyLog = (energyLog: EnergyLog[]): void => {
  setLocalItem(ENERGY_LOG_KEY, energyLog);
};

export const saveRedeemedRewardsLog = (redeemedRewardsLog: RedeemedRewardLog[]): void => {
  setLocalItem(REDEEMED_REWARDS_LOG_KEY, redeemedRewardsLog);
};

// Get the current date in ISO format
export const getCurrentDateISO = (): string => {
  return new Date().toISOString();
};

// Check if a habit has been completed today
export const hasHabitBeenCompletedToday = (habitId: string, habitLog: HabitLog[]): boolean => {
  const today = new Date().toISOString().split("T")[0];
  return habitLog.some(
    (log) => log.habitId === habitId && log.timestamp.startsWith(today)
  );
};
