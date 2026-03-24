const ONBOARDING_KEY = "esn_fm_onboarding_done";

export function hasCompletedOnboarding(userId: string): boolean {
  return localStorage.getItem(`${ONBOARDING_KEY}_${userId}`) === "true";
}

export function markOnboardingDone(userId: string): void {
  localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, "true");
}
