import { ControlDefinition, ControlValue } from './sketch';

export interface Effect {
  id: string;
  name: string;

  // Lifecycle
  init(): Promise<void>;
  apply(
    source: OffscreenCanvas,
    destination: OffscreenCanvas,
    time: number,
    deltaTime: number
  ): void;
  dispose(): void;

  // Controls (same as sketches for signal binding compatibility)
  controls: ControlDefinition[];
  setControl(name: string, value: ControlValue): void;
  getControl(name: string): ControlValue | undefined;

  // Enable/disable
  enabled: boolean;
}

export interface EffectFactory {
  id: string;
  name: string;
  create(): Effect;
}
