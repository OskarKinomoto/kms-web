import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Rysuje atomy jako instancjonowane sfery kolorowane energią kinetyczną
// oraz półprzezroczystą kulę o promieniu L (ściana).
export class Renderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  private controls: OrbitControls;
  private mesh: THREE.InstancedMesh | null = null;
  private wall: THREE.Mesh;
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  private eMax = 1;

  constructor(host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(devicePixelRatio);
    host.appendChild(this.renderer.domElement);

    this.camera.position.set(0, -4.5, 3);
    this.camera.up.set(0, 0, 1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(3, -4, 5);
    this.scene.add(sun);

    this.wall = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 24),
      new THREE.MeshBasicMaterial({ color: 0x5b7cff, wireframe: true, transparent: true, opacity: 0.12 }),
    );
    this.scene.add(this.wall);

    addEventListener('resize', () => this.resize());
    this.resize();
  }

  setWall(L: number) { this.wall.scale.setScalar(L); }
  showWall(v: boolean) { this.wall.visible = v; }

  setAtoms(N: number, radius = 0.09) {
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.dispose(); }
    this.mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(radius, 20, 14),
      new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 }),
      N,
    );
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(3 * N), 3);
    this.scene.add(this.mesh);
    this.eMax = 1;
  }

  update(pos: Float32Array, ekin: Float32Array) {
    const m = this.mesh;
    if (!m) return;
    let mx = 0;
    for (const e of ekin) if (e > mx) mx = e;
    this.eMax = Math.max(mx, this.eMax * 0.995); // wolno opadająca skala kolorów
    for (let i = 0; i < ekin.length; i++) {
      this.dummy.position.set(pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]);
      this.dummy.updateMatrix();
      m.setMatrixAt(i, this.dummy.matrix);
      // zimne = niebieskie (240°), gorące = czerwone (0°)
      this.color.setHSL((1 - Math.min(1, ekin[i] / this.eMax)) * 0.66, 0.85, 0.55);
      m.setColorAt(i, this.color);
    }
    m.instanceMatrix.needsUpdate = true;
    m.instanceColor!.needsUpdate = true;
  }

  render() { this.controls.update(); this.renderer.render(this.scene, this.camera); }

  private resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
