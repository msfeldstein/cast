import * as THREE from 'three';
import { Generation, GenerationFactory, ControlDefinition } from '../../types/generation';

class CubesGeneration implements Generation {
  id = 'cubes';
  name = 'Rotating Cubes';
  type: 'sketch' = 'sketch';

  controls: ControlDefinition[] = [
    { name: 'rotationSpeed', type: 'number', label: 'Rotation Speed', defaultValue: 1.0, min: 0.1, max: 5.0, step: 0.1 },
    { name: 'cubeCount', type: 'number', label: 'Cube Count', defaultValue: 5, min: 1, max: 20, step: 1 },
  ];

  private canvas!: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private cubes: THREE.Mesh[] = [];

  private rotationSpeed = 1.0;
  private cubeCount = 5;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
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
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7];

    for (let i = 0; i < this.cubeCount; i++) {
      const material = new THREE.MeshPhongMaterial({
        color: colors[i % colors.length],
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

  render(time: number): void {
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

  setControl(name: string, value: number | boolean | string): void {
    if (name === 'rotationSpeed' && typeof value === 'number') {
      this.rotationSpeed = value;
    } else if (name === 'cubeCount' && typeof value === 'number') {
      const newCount = Math.floor(value);
      if (newCount !== this.cubeCount) {
        this.cubeCount = newCount;
        this.createCubes();
      }
    }
  }

  getControl(name: string): number | undefined {
    if (name === 'rotationSpeed') return this.rotationSpeed;
    if (name === 'cubeCount') return this.cubeCount;
    return undefined;
  }
}

export const cubesFactory: GenerationFactory = {
  id: 'cubes',
  name: 'Rotating Cubes',
  type: 'sketch',
  create: () => new CubesGeneration(),
};
