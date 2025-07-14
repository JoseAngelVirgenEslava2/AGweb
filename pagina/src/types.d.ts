declare namespace THREE {
    export class OrbitControls {
      constructor(object: THREE.Camera, domElement?: HTMLElement);
      target: THREE.Vector3;
      update(): void;
      dispose(): void;
      enabled: boolean;
    }
  
  }
  
  // Declaración global para MathBox
  declare const MathBox: {
    mathBox: (options: any) => any;
  };
  
  interface MeshPointData {
      x: number[];
      y: number[];
      z: number[][];
  }
  
  interface MeshData {
      original: MeshPointData;
      organism: MeshPointData;
  }
