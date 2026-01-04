export type GenerationType = 'video' | 'shader' | 'sketch';

export interface ControlDefinition {
  name: string;
  type: 'number' | 'boolean' | 'color' | 'select';
  label: string;
  defaultValue: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface Generation {
  id: string;
  name: string;
  type: GenerationType;

  // Lifecycle
  init(canvas: HTMLCanvasElement): Promise<void>;
  render(time: number, deltaTime: number): void;
  dispose(): void;

  // Optional controls
  controls?: ControlDefinition[];
  setControl?(name: string, value: number | boolean | string): void;
  getControl?(name: string): number | boolean | string | undefined;
}

export interface GenerationFactory {
  id: string;
  name: string;
  type: GenerationType;
  create(): Generation;
}
