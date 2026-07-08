import { usePage } from "@inertiajs/react";
import type { SharedProps, Plan } from "../Types";
import { PLAN_FEATURES, FEATURE_LOCKS } from "../lib/constants";

export function useSubscription() {
  const { subscription } = usePage<SharedProps>().props;

  const plan: Plan = subscription?.plan ?? "pro"; // Fallback ke pro untuk backward-compatibility

  // Gunakan plan_features dari server jika ada, fallback ke constants lokal
  const planFeatures = subscription?.plan_features ?? PLAN_FEATURES[plan] ?? [];
  const featureLocks = subscription?.feature_locks ?? FEATURE_LOCKS;

  const hasFeature = (feature: string): boolean => {
    return planFeatures.includes(feature);
  };

  const isLocked = (feature: string): boolean => {
    return !hasFeature(feature);
  };

  return {
    plan,
    status: subscription?.status ?? "active",
    isTrialing: subscription?.status === "trialing",
    daysLeft: subscription?.days_left ?? 0,
    hasFeature,
    isLocked,
    featureLocks,
    planFeatures,
  };
}
