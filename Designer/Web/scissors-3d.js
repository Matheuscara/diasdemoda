customElements.define('scissors-3d', class extends HTMLElement {
  async connectedCallback() {
    this.style.display = 'block';
    this.style.position = 'relative';
    if (!this.style.height && !this.clientHeight) this.style.height = '540px';
    this.style.minHeight = '420px';
    this.style.pointerEvents = 'none';
    const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
    if (!this.isConnected) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 26);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    this.appendChild(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x555555);
    const panel = (x, y, z, c, s) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m);
    };
    panel(0, 10, 0, 0xffffff, 14);   // ceiling light
    panel(-8, 2, 6, 0xffe9ee, 10);   // warm pink key
    panel(8, -2, 4, 0xdfe8ff, 8);    // cool fill
    panel(0, -10, 2, 0x888888, 12);  // floor bounce
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 8); scene.add(key);
    const rim = new THREE.DirectionalLight(0xE1ADB1, 1.4); rim.position.set(-6, -2, 5); scene.add(rim);
    const fill = new THREE.PointLight(0xAE567C, 30, 40); fill.position.set(-4, 4, 6); scene.add(fill);

    const steel = new THREE.MeshStandardMaterial({ color: 0xdfe3e9, metalness: 0.95, roughness: 0.22 });
    const steelDark = new THREE.MeshStandardMaterial({ color: 0x9aa1ab, metalness: 0.9, roughness: 0.35 });
    const pink = new THREE.MeshStandardMaterial({ color: 0xAE567C, metalness: 0.25, roughness: 0.4 });
    const pinkSoft = new THREE.MeshStandardMaterial({ color: 0xE1ADB1, metalness: 0.2, roughness: 0.5 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 0.95, roughness: 0.25 });

    function makeBlade() {
      const s = new THREE.Shape();
      s.moveTo(0, -0.5); s.lineTo(4.6, -0.28); s.quadraticCurveTo(6.2, -0.12, 6.3, 0);
      s.quadraticCurveTo(5.4, 0.14, 4.2, 0.2); s.lineTo(0, 0.5); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.13, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.07, bevelSegments: 4 });
      g.translate(0, 0, -0.065);
      return g;
    }
    function makeHalf(handleMat) {
      const half = new THREE.Group();
      half.add(new THREE.Mesh(makeBlade(), steel));
      const spine = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 3.2, 4, 10), steelDark);
      spine.rotation.z = Math.PI / 2; spine.position.set(2.3, 0.26, 0); half.add(spine);
      const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 2.0, 18), steelDark);
      shank.rotation.z = Math.PI / 2; shank.position.set(-1.5, 0, 0); half.add(shank);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.09, 14, 28), gold);
      collar.position.set(-2.4, 0, 0); collar.rotation.y = Math.PI / 2; half.add(collar);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.3, 22, 44), handleMat);
      ring.scale.set(1.25, 1, 1); ring.position.set(-3.7, 0, 0); half.add(ring);
      return half;
    }
    const scissors = new THREE.Group();
    const a = makeHalf(pink), b = makeHalf(pinkSoft);
    b.rotation.x = Math.PI;
    a.position.z = 0.1; b.position.z = -0.1;
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.55, 28), gold);
    screw.rotation.x = Math.PI / 2;
    const screwCap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), gold);
    screwCap.position.z = 0.3;
    scissors.add(a, b, screw, screwCap);
    scene.add(scissors);

    let mx = 0, my = 0;
    const onMouse = e => { mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1; };
    window.addEventListener('mousemove', onMouse, { passive: true });
    const getY = () => window.scrollY || (document.scrollingElement ? document.scrollingElement.scrollTop : 0);

    const resize = () => {
      const w = this.clientWidth || 400, h = this.clientHeight || 400;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    this._ro = new ResizeObserver(resize); this._ro.observe(this); resize();

    const t0 = performance.now();
    const animate = now => {
      const t = (now - t0) / 1000;
      const e = 1 - Math.pow(1 - Math.min(1, t / 2.4), 3); // entrance ease-out
      scissors.position.x = -18 + e * 20.5; // enters from the left, parks on the right
      scissors.position.y = Math.sin(t * 0.7) * 0.2;
      scissors.rotation.z = 0.7 + (1 - e) * Math.PI * 3; // spins while entering, then stops
      scissors.rotation.y = 0.25 + mx * 0.12 + Math.sin(t * 0.4) * 0.04;
      scissors.rotation.x = my * 0.08;
      const open = 0.45 + Math.sin(t * 0.9) * 0.08;
      a.rotation.z = open; b.rotation.z = open; // b is mirrored by rotation.x=PI, so +open reads as -open visually
      renderer.render(scene, camera);
      this._raf = requestAnimationFrame(animate);
    };
    this._raf = requestAnimationFrame(animate);
    this._dispose = () => { window.removeEventListener('mousemove', onMouse); renderer.dispose(); pmrem.dispose(); };
  }
  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    if (this._ro) this._ro.disconnect();
    if (this._dispose) this._dispose();
  }
});
