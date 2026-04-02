import { qsa, qs, supportsReducedMotion } from "../utils/dom.js";

export const initSoundEffects = () => {
  const audio = qs("#ui-sound");
  if (!audio || supportsReducedMotion()) return;

  audio.volume = 0.12;
  let unlocked = false;

  const unlock = () => {
    unlocked = true;
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        // Silent fail; browser policy may still block playback.
      });
  };

  const play = () => {
    if (!unlocked) return;
    try {
      audio.currentTime = 0;
      audio.play();
    } catch {
      // no-op
    }
  };

  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });

  qsa(".dot").forEach((dot) => dot.addEventListener("click", play));
  qsa("[data-open-contact]").forEach((trigger) =>
    trigger.addEventListener("click", play)
  );
};
