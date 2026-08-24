import * as THREE from "three";
import { MAP_CONFIG, PALETTE } from "../config/gameConfig";

type Materials = Record<keyof typeof PALETTE, THREE.MeshStandardMaterial>;
type TileMaterial = "river" | "cliff" | "clearing" | "valley" | "grass";

interface TreeTransform {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
}

export class WorldRenderer {
  readonly worldLimit = MAP_CONFIG.radius * MAP_CONFIG.tileSize - 2.5;
  readonly stats = { tiles: 0, trees: 0, terrainDrawCalls: 0, treeDrawCalls: 0 };

  private readonly terrainGroup = new THREE.Group();
  private readonly objectGroup = new THREE.Group();
  private readonly random: () => number;

  constructor(private readonly scene: THREE.Scene, private readonly materials: Materials) {
    this.random = this.createRandom(MAP_CONFIG.seed);
    this.scene.add(this.terrainGroup, this.objectGroup);
    this.build();
  }

  heightAt(x: number, z: number): number {
    const distance = Math.hypot(x, z);
    const valley = -1.8 * Math.exp(-(x * x + z * z) / 90);
    const ridge = Math.max(0, distance - 27) * 0.34;
    return valley + ridge + Math.sin(x * 0.45) * 0.22 + Math.cos(z * 0.38) * 0.18;
  }

  riverOffset(z: number): number {
    return Math.sin(z * 0.33) * 3.2;
  }

  private build(): void {
    const tiles: Record<TileMaterial, THREE.Matrix4[]> = {
      river: [], cliff: [], clearing: [], valley: [], grass: []
    };
    const trees: TreeTransform[] = [];
    const radius = MAP_CONFIG.radius;
    const tileSize = MAP_CONFIG.tileSize;

    for (let gx = -radius; gx <= radius; gx += 1) {
      for (let gz = -radius; gz <= radius; gz += 1) {
        if (Math.hypot(gx, gz) >= radius + 0.75) continue;
        const x = gx * tileSize;
        const z = gz * tileSize;
        const y = this.heightAt(x, z);
        const sideMountain = Math.hypot(x, z) > 35 || Math.abs(x) > 40;
        const material = this.tileMaterial(x, z, sideMountain);
        const height = 0.34 + Math.max(0, y + 2.2);
        const matrix = new THREE.Matrix4().compose(
          new THREE.Vector3(x, y - height / 2, z),
          new THREE.Quaternion(),
          new THREE.Vector3(tileSize * 0.98, height, tileSize * 0.98)
        );
        tiles[material].push(matrix);

        if (sideMountain && this.random() > 0.67) this.addMountain(x, z, y);
        const river = Math.abs(x - this.riverOffset(z)) < 2.2;
        const clearing = this.isClearing(x, z, 1);
        if (!river && !clearing && this.random() > 0.55 && Math.hypot(x, z) > 5) {
          const treeX = x + (this.random() - 0.5) * 0.9;
          const treeZ = z + (this.random() - 0.5) * 0.9;
          trees.push({
            x: treeX,
            y: this.heightAt(treeX, treeZ) + 0.1,
            z: treeZ,
            scale: 0.8 + this.random() * 0.75,
            rotation: this.random() * Math.PI
          });
        }
      }
    }

    this.addTerrainInstances(tiles);
    this.addTreeInstances(trees);
    this.addRiverFoam();
    this.stats.tiles = Object.values(tiles).reduce((sum, entries) => sum + entries.length, 0);
    this.stats.trees = trees.length;
  }

  private tileMaterial(x: number, z: number, sideMountain: boolean): TileMaterial {
    if (Math.abs(x - this.riverOffset(z)) < 1.18) return "river";
    if (sideMountain) return "cliff";
    if (this.isClearing(x, z, 0)) return "clearing";
    if (Math.hypot(x, z) < 6) return "valley";
    return "grass";
  }

  private isClearing(x: number, z: number, margin: number): boolean {
    return (
      Math.hypot(x - 8, z + 6) < 4.2 + margin ||
      Math.hypot(x + 8, z - 5) < 3.7 + margin ||
      Math.hypot(x - 1, z - 9) < 3.4 + margin
    );
  }

  private addTerrainInstances(tiles: Record<TileMaterial, THREE.Matrix4[]>): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    for (const [material, matrices] of Object.entries(tiles) as Array<[TileMaterial, THREE.Matrix4[]]>) {
      if (matrices.length === 0) continue;
      const mesh = new THREE.InstancedMesh(geometry, this.materials[material], matrices.length);
      matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      mesh.receiveShadow = true;
      mesh.castShadow = material === "cliff";
      mesh.computeBoundingSphere();
      this.terrainGroup.add(mesh);
      this.stats.terrainDrawCalls += 1;
    }
  }

  private addTreeInstances(trees: TreeTransform[]): void {
    const definitions = [
      { geometry: new THREE.CylinderGeometry(0.14, 0.2, 1.2, 5), material: this.materials.trunk, y: 0.55 },
      { geometry: new THREE.ConeGeometry(0.9, 1.7, 6), material: this.materials.pineA, y: 1.55 },
      { geometry: new THREE.ConeGeometry(0.68, 1.35, 6), material: this.materials.pineB, y: 2.25 }
    ];
    for (const definition of definitions) {
      const mesh = new THREE.InstancedMesh(definition.geometry, definition.material, trees.length);
      trees.forEach((tree, index) => {
        const matrix = new THREE.Matrix4().compose(
          new THREE.Vector3(tree.x, tree.y + definition.y * tree.scale, tree.z),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), tree.rotation),
          new THREE.Vector3(tree.scale, tree.scale, tree.scale)
        );
        mesh.setMatrixAt(index, matrix);
      });
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      this.objectGroup.add(mesh);
      this.stats.treeDrawCalls += 1;
    }
  }

  private addMountain(x: number, z: number, y: number): void {
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(1.1 + this.random() * 0.9, 2.3 + this.random() * 2.8, 5),
      this.materials.cliff
    );
    peak.position.set(x + (this.random() - 0.5) * 0.6, y + 1.2, z + (this.random() - 0.5) * 0.6);
    peak.rotation.y = this.random() * Math.PI;
    peak.castShadow = true;
    peak.receiveShadow = true;
    this.objectGroup.add(peak);
    if (y > 1.4) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.75, 5), this.materials.snow);
      cap.position.set(peak.position.x, peak.position.y + 1.15, peak.position.z);
      cap.rotation.copy(peak.rotation);
      this.objectGroup.add(cap);
    }
  }

  private addRiverFoam(): void {
    const transforms: THREE.Matrix4[] = [];
    for (let z = -this.worldLimit; z <= this.worldLimit; z += 3.2) {
      const riverX = this.riverOffset(z);
      transforms.push(new THREE.Matrix4().compose(
        new THREE.Vector3(riverX + (this.random() - 0.5) * 0.9, this.heightAt(riverX, z) + 0.22, z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.random() * Math.PI),
        new THREE.Vector3(1.2, 0.035, 0.12)
      ));
    }
    const material = new THREE.MeshStandardMaterial({ color: 0xd6f5ff, roughness: 0.6, flatShading: true });
    const foam = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, transforms.length);
    transforms.forEach((matrix, index) => foam.setMatrixAt(index, matrix));
    foam.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    foam.computeBoundingSphere();
    this.objectGroup.add(foam);
  }

  private createRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }
}
