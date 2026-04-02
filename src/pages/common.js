import { initCopyHandlers } from "../components/copy.js";
import { createModalController } from "../components/modal.js";
import { initProgress } from "../components/progress.js";
import { initRevealAnimations } from "../components/reveal.js";
import { initSectionIndicator } from "../components/section-indicator.js";
import { initSoundEffects } from "../components/sound.js";

export const initCommonPage = ({ store }) => {
  const modal = createModalController(store);

  initRevealAnimations();
  initSectionIndicator();
  initProgress();
  initCopyHandlers();
  initSoundEffects();

  return { modal };
};
