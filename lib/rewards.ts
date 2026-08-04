export type RewardTier = {
  hours: number;
  item: string;
};

export const REWARD_CATALOG: RewardTier[] = [
  { hours: 5, item: "adaptive switch + adapter kit" },
  { hours: 15, item: "braille label maker" },
  { hours: 30, item: "ergonomic split keyboard" },
  { hours: 50, item: "screen magnifier / CCTV reader" },
];

export type RewardStatus = {
  totalHours: number;
  currentTier: RewardTier | null;
  nextTier: RewardTier | null;
  hoursToNextTier: number | null;
};

export function getRewardStatus(totalHours: number): RewardStatus {
  const sorted = [...REWARD_CATALOG].sort((a, b) => a.hours - b.hours);

  let currentTier: RewardTier | null = null;
  let nextTier: RewardTier | null = null;

  for (const tier of sorted) {
    if (totalHours >= tier.hours) {
      currentTier = tier;
    } else if (!nextTier) {
      nextTier = tier;
    }
  }

  return {
    totalHours,
    currentTier,
    nextTier,
    hoursToNextTier: nextTier ? Math.max(0, nextTier.hours - totalHours) : null,
  };
}
