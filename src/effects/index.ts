import { EffectFactory } from '../types/effect';
import { zoomBlurFactory } from './effects/ZoomBlur';
import { wobbleFactory } from './effects/Wobble';
import { colorAdjustFactory } from './effects/ColorAdjust';
import { bloomFactory } from './effects/Bloom';
import { chromaticAberrationFactory } from './effects/ChromaticAberration';
import { pixelateFactory } from './effects/Pixelate';
import { mirrorFactory } from './effects/Mirror';
import { edgeGlowFactory } from './effects/EdgeGlow';
import { feedbackFactory } from './effects/Feedback';

// All available effects
export const effects: EffectFactory[] = [
  zoomBlurFactory,
  wobbleFactory,
  colorAdjustFactory,
  bloomFactory,
  chromaticAberrationFactory,
  pixelateFactory,
  mirrorFactory,
  edgeGlowFactory,
  feedbackFactory,
];

export {
  zoomBlurFactory,
  wobbleFactory,
  colorAdjustFactory,
  bloomFactory,
  chromaticAberrationFactory,
  pixelateFactory,
  mirrorFactory,
  edgeGlowFactory,
  feedbackFactory,
};

export { BaseEffect } from './BaseEffect';
