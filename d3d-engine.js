/* Melano Dieline - Three.js 3D Folding Box Simulator Engine */

class Dieline3DEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF8FAFC);

    this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 1, 2000);
    this.camera.position.set(250, 200, 350);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting
    this.setupLighting();

    // Box Mesh Group
    this.boxGroup = new THREE.Group();
    this.scene.add(this.boxGroup);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(600, 30, 0xCBD5E1, 0xE2E8F0);
    gridHelper.position.y = -60;
    this.scene.add(gridHelper);

    this.materials = {
      kraft: new THREE.MeshStandardMaterial({ color: 0xD4A373, roughness: 0.8, metalness: 0.1, side: THREE.DoubleSide }),
      white: new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.3, metalness: 0.05, side: THREE.DoubleSide }),
      corrugated: new THREE.MeshStandardMaterial({ color: 0xC19A6B, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide })
    };
    this.currentMaterial = this.materials.white;

    this.foldPercent = 0.0;
    this.panels = [];

    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(200, 300, 150);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00B9F0, 0.3);
    dirLight2.position.set(-200, 100, -150);
    this.scene.add(dirLight2);
  }

  buildBoxModel(params) {
    const { L = 100, W = 60, H = 140 } = params;

    // Clear existing group
    while (this.boxGroup.children.length > 0) {
      const obj = this.boxGroup.children[0];
      this.boxGroup.remove(obj);
    }
    this.panels = [];

    // Create Root Front Panel
    const frontGeo = new THREE.PlaneGeometry(L, H);
    const frontMesh = new THREE.Mesh(frontGeo, this.currentMaterial);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;
    this.boxGroup.add(frontMesh);

    // Right Side Pivot & Panel
    const pivotRight = new THREE.Group();
    pivotRight.position.set(L / 2, 0, 0);
    frontMesh.add(pivotRight);

    const rightMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.currentMaterial);
    rightMesh.position.set(W / 2, 0, 0);
    pivotRight.add(rightMesh);

    // Back Panel Pivot & Mesh
    const pivotBack = new THREE.Group();
    pivotBack.position.set(W / 2, 0, 0);
    rightMesh.add(pivotBack);

    const backMesh = new THREE.Mesh(new THREE.PlaneGeometry(L, H), this.currentMaterial);
    backMesh.position.set(L / 2, 0, 0);
    pivotBack.add(backMesh);

    // Left Side Pivot & Mesh
    const pivotLeft = new THREE.Group();
    pivotLeft.position.set(-L / 2, 0, 0);
    frontMesh.add(pivotLeft);

    const leftMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.currentMaterial);
    leftMesh.position.set(-W / 2, 0, 0);
    pivotLeft.add(leftMesh);

    // Top Lid Pivot & Mesh
    const pivotTop = new THREE.Group();
    pivotTop.position.set(0, H / 2, 0);
    frontMesh.add(pivotTop);

    const topMesh = new THREE.Mesh(new THREE.PlaneGeometry(L, W), this.currentMaterial);
    topMesh.position.set(0, W / 2, 0);
    pivotTop.add(topMesh);

    // Bottom Lid Pivot & Mesh
    const pivotBottom = new THREE.Group();
    pivotBottom.position.set(0, -H / 2, 0);
    frontMesh.add(pivotBottom);

    const bottomMesh = new THREE.Mesh(new THREE.PlaneGeometry(L, W), this.currentMaterial);
    bottomMesh.position.set(0, -W / 2, 0);
    pivotBottom.add(bottomMesh);

    // Track Joint Pivots for Fold Animation
    this.panels = [
      { pivot: pivotRight, axis: 'y', targetAngle: -Math.PI / 2 },
      { pivot: pivotBack, axis: 'y', targetAngle: -Math.PI / 2 },
      { pivot: pivotLeft, axis: 'y', targetAngle: Math.PI / 2 },
      { pivot: pivotTop, axis: 'x', targetAngle: -Math.PI / 2 },
      { pivot: pivotBottom, axis: 'x', targetAngle: Math.PI / 2 }
    ];

    this.updateFoldProgress(this.foldPercent);
  }

  updateFoldProgress(percent) {
    this.foldPercent = percent;
    const factor = percent / 100;

    this.panels.forEach(item => {
      if (item.axis === 'y') {
        item.pivot.rotation.y = item.targetAngle * factor;
      } else if (item.axis === 'x') {
        item.pivot.rotation.x = item.targetAngle * factor;
      }
    });
  }

  setMaterial(materialKey) {
    if (this.materials[materialKey]) {
      this.currentMaterial = this.materials[materialKey];
      this.boxGroup.traverse(child => {
        if (child.isMesh) {
          child.material = this.currentMaterial;
        }
      });
    }
  }

  setTheme(theme) {
    if (theme === 'dark') {
      this.scene.background = new THREE.Color(0x090D16);
    } else {
      this.scene.background = new THREE.Color(0xF8FAFC);
    }
  }

  onWindowResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.d3dEngine = Dieline3DEngine;
