import * as THREE from 'three';
import { Sketch, SketchFactory, ControlDefinition, ControlValue } from '../../types/sketch';

class CubesSketch implements Sketch {
  id = 'cubes';
  name = 'Rotating Cubes';
  type: 'sketch' = 'sketch';

  controls: ControlDefinition[] = [
    { name: 'rotationSpeed', type: 'float', label: 'Rotation Speed', defaultValue: 1.0, min: 0.1, max: 5.0 },
    { name: 'cubeCount', type: 'integer', label: 'Cube Count', defaultValue: 5, min: 1, max: 20 },
    { name: 'cubeSize', type: 'float', label: 'Cube Size', defaultValue: 1.0, min: 0.2, max: 3.0 },
    { name: 'randomize', type: 'trigger', label: 'Randomize Colors' },
  ];

  private canvas!: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private cubes: THREE.Mesh[] = [];

  private rotationSpeed = 1.0;
  private cubeCount = 5;
  private cubeSize = 1.0;
  private shouldRandomize = false;
  private colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7];

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.camera.position.z = 10;

    // Lighting
    const ambient = new THREE.AmbientLight(0x404040);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(5, 5, 5);
    this.scene.add(directional);

    this.createCubes();
  }

  private createCubes(): void {
    // Remove existing cubes
    for (const cube of this.cubes) {
      this.scene.remove(cube);
      cube.geometry.dispose();
      (cube.material as THREE.Material).dispose();
    }
    this.cubes = [];

    // Create new cubes
    const geometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);

    for (let i = 0; i < this.cubeCount; i++) {
      const material = new THREE.MeshPhongMaterial({
        color: this.colors[i % this.colors.length],
        shininess: 100,
      });
      const cube = new THREE.Mesh(geometry, material);

      const angle = (i / this.cubeCount) * Math.PI * 2;
      const radius = 3;
      cube.position.x = Math.cos(angle) * radius;
      cube.position.y = Math.sin(angle) * radius;
      cube.position.z = Math.sin(angle * 2) * 2;

      this.scene.add(cube);
      this.cubes.push(cube);
    }
  }

  private randomizeColors(): void {
    this.colors = this.colors.map(() =>
      Math.floor(Math.random() * 0xffffff)
    );
    // Update existing cubes
    for (let i = 0; i < this.cubes.length; i++) {
      const material = this.cubes[i].material as THREE.MeshPhongMaterial;
      material.color.setHex(this.colors[i % this.colors.length]);
    }
  }

  render(time: number): void {
    // Handle trigger - randomize colors if triggered
    if (this.shouldRandomize) {
      this.randomizeColors();
      this.shouldRandomize = false;
    }

    // Update canvas size if needed
    if (this.renderer.domElement.width !== this.canvas.width ||
        this.renderer.domElement.height !== this.canvas.height) {
      this.renderer.setSize(this.canvas.width, this.canvas.height);
      this.camera.aspect = this.canvas.width / this.canvas.height;
      this.camera.updateProjectionMatrix();
    }

    // Rotate cubes
    for (let i = 0; i < this.cubes.length; i++) {
      const cube = this.cubes[i];
      cube.rotation.x = time * this.rotationSpeed + i * 0.5;
      cube.rotation.y = time * this.rotationSpeed * 0.7 + i * 0.3;

      // Orbit motion
      const angle = (i / this.cubes.length) * Math.PI * 2 + time * 0.3 * this.rotationSpeed;
      const radius = 3;
      cube.position.x = Math.cos(angle) * radius;
      cube.position.y = Math.sin(angle) * radius;
      cube.position.z = Math.sin(angle * 2 + time * 0.5) * 2;
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const cube of this.cubes) {
      cube.geometry.dispose();
      (cube.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'rotationSpeed' && typeof value === 'number') {
      this.rotationSpeed = value;
    } else if (name === 'cubeCount' && typeof value === 'number') {
      const newCount = Math.floor(value);
      if (newCount !== this.cubeCount) {
        this.cubeCount = newCount;
        this.createCubes();
      }
    } else if (name === 'cubeSize' && typeof value === 'number') {
      if (value !== this.cubeSize) {
        this.cubeSize = value;
        this.createCubes();
      }
    } else if (name === 'randomize' && value === true) {
      this.shouldRandomize = true;
    }
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'rotationSpeed') return this.rotationSpeed;
    if (name === 'cubeCount') return this.cubeCount;
    if (name === 'cubeSize') return this.cubeSize;
    if (name === 'randomize') return false; // Triggers always return false
    return undefined;
  }
}

export const cubesFactory: SketchFactory = {
  id: 'cubes',
  name: 'Rotating Cubes',
  type: 'sketch',
  create: () => new CubesSketch(),
};
