export type SketchType = 'video' | 'shader' | 'sketch';

export type ControlType = 'float' | 'integer' | 'color' | 'trigger';

export interface BaseControlDefinition {
  name: string;
  label: string;
}

export interface FloatControlDefinition extends BaseControlDefinition {
  type: 'float';
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
}

export interface IntegerControlDefinition extends BaseControlDefinition {
  type: 'integer';
  defaultValue: number;
  min: number;
  max: number;
}

export interface ColorControlDefinition extends BaseControlDefinition {
  type: 'color';
  defaultValue: string; // hex color like '#ff0000'
}

export interface TriggerControlDefinition extends BaseControlDefinition {
  type: 'trigger';
}

export type ControlDefinition =
  | FloatControlDefinition
  | IntegerControlDefinition
  | ColorControlDefinition
  | TriggerControlDefinition;

export type ControlValue = number | string | boolean;

export interface Sketch {
  id: string;
  name: string;
  type: SketchType;

  // Lifecycle
  init(canvas: HTMLCanvasElement): Promise<void>;
  render(time: number, deltaTime: number): void;
  dispose(): void;

  // Controls
  controls: ControlDefinition[];
  setControl(name: string, value: ControlValue): void;
  getControl(name: string): ControlValue | undefined;
}

export interface SketchFactory {
  id: string;
  name: string;
  type: SketchType;
  create(): Sketch;
}
