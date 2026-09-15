import successAudio from "@/assets/success.mp3.asset.json";

/** Plays the store's success chime. Safe to call anywhere; silently ignores blocked autoplay. */
export function playSuccessSound() {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio(successAudio.url);
    audio.volume = 0.6;
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

export const OAUTH_SOUND_FLAG = "trx-auth-sound-pending";

export function markAuthSoundPending() {
  try {
    sessionStorage.setItem(OAUTH_SOUND_FLAG, "1");
  } catch {
    /* ignore */
  }
}

/** Plays the chime once if a sign-in was started in this tab. */
export function playPendingAuthSound() {
  try {
    if (sessionStorage.getItem(OAUTH_SOUND_FLAG) !== "1") return;
    sessionStorage.removeItem(OAUTH_SOUND_FLAG);
  } catch {
    return;
  }
  playSuccessSound();
}
