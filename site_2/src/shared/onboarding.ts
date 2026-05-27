import { INTRO_STORAGE_KEY } from "./intro_copy";

export const TAP_HINT_STORAGE_KEY = "posteriograph.tapHintDismissed";

export type OnboardingFlowState =
  | "welcome"
  | "intro-1"
  | "intro-2"
  | "intro-3"
  | "landing"
  | "manual"
  | "results";

export function readIntroDismissed(): boolean {
  try {
    return localStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeIntroDismissed(dismissed: boolean) {
  try {
    if (dismissed) localStorage.setItem(INTRO_STORAGE_KEY, "1");
    else localStorage.removeItem(INTRO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function initialOnboardingFlow(): OnboardingFlowState {
  return readIntroDismissed() ? "landing" : "welcome";
}

export function isOnboardingStep(flow: OnboardingFlowState): boolean {
  return flow === "welcome" || flow.startsWith("intro-");
}

export function nextIntroStep(flow: OnboardingFlowState): OnboardingFlowState {
  switch (flow) {
    case "welcome":
      return "intro-1";
    case "intro-1":
      return "intro-2";
    case "intro-2":
      return "intro-3";
    case "intro-3":
      return "landing";
    default:
      return flow;
  }
}

export function readTapHintDismissed(): boolean {
  try {
    return localStorage.getItem(TAP_HINT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeTapHintDismissed(dismissed: boolean) {
  try {
    if (dismissed) localStorage.setItem(TAP_HINT_STORAGE_KEY, "1");
    else localStorage.removeItem(TAP_HINT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function prevIntroStep(flow: OnboardingFlowState): OnboardingFlowState {
  switch (flow) {
    case "intro-1":
      return "welcome";
    case "intro-2":
      return "intro-1";
    case "intro-3":
      return "intro-2";
    default:
      return flow;
  }
}
