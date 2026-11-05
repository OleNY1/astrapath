(function () {
  const canvas = document.getElementById("tower");
  const panel = document.getElementById("panel-towers");
  if (!canvas || !panel || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 22, 48);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(-7, 16, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -6, near: 1, far: 50 });
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  const group = new THREE.Group();
  scene.add(group);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  const hiMat = new THREE.LineBasicMaterial({ color: 0xe6e6e6 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.6 });
  const sh = function (m) { m.castShadow = m.receiveShadow = true; return m; };
  const edges = function (m, a) {
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, a == null ? 20 : a), edgeMat));
  };

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshStandardMaterial({ color: 0x151515 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  group.add(new THREE.GridHelper(22, 44, 0x2b2b2b, 0x1c1c1c));
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(3, 64), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.004;
  plaza.receiveShadow = true;
  group.add(plaza);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3, 3.08, 64), new THREE.MeshBasicMaterial({ color: 0x777777 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.006;
  group.add(ring);

  (function () {
    const pts = [];
    for (let i = 0; i < 34; i++) {
      const a = i / 34 * Math.PI * 2;
      const r = 3.7 + (i % 3) * 0.5;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + 0.2;
      const r = 5.8 + (i % 2) * 0.8;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.02, 0.12, 6), new THREE.MeshStandardMaterial({ color: 0x777777 }), pts.length);
    const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({ color: 0xb5b5b5, flatShading: true }), pts.length);
    const m4 = new THREE.Matrix4();
    pts.forEach(function (p, i) {
      const s = 0.8 + ((i * 37) % 5) / 10;
      m4.makeScale(s, s, s);
      m4.setPosition(p[0], 0.06 * s, p[1]);
      trunks.setMatrixAt(i, m4);
      m4.makeScale(s, s, s);
      m4.setPosition(p[0], 0.21 * s, p[1]);
      crowns.setMatrixAt(i, m4);
    });
    crowns.castShadow = true;
    group.add(trunks, crowns);
  })();

  function glassTex() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#e2e2e2";
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#8c8c8c";
    g.fillRect(0, 8, 64, 48);
    g.fillStyle = "#6e6e6e";
    g.fillRect(0, 8, 64, 6);
    g.fillStyle = "#e2e2e2";
    [0, 32].forEach(function (x) { g.fillRect(x + 30, 8, 2, 48); });
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }

  const tower = new THREE.Group();
  group.add(tower);
  tower.scale.y = 0.001;
  const H = 10;
  const N = 80;
  const dy = H / N;
  const Yc = 5;
  const hw = function (y) { return 0.85 - 0.03 * y / H; };
  const hd = function (y) { return 0.85 * (1 - 0.94 * Math.pow(y / H, 2.2)); };
  const xb = function (y) { return hw(y) * Math.pow(Math.abs(y - Yc) / Math.max(Yc, H - Yc), 1.4); };
  const ze = function (y) { return hd(y) * (1 - 0.5 * (1 - xb(y) / hw(y))); };
  const HY0 = 8.75;
  const HY1 = 9.625;
  const hx = function (y) { return 0.42 + 0.13 * (y - HY0) / (HY1 - HY0); };
  const pos = [];
  const uvs = [];
  const S = 0.06;
  function quad(a, b, c, d, f) {
    [[a, b, c], [a, c, d]].forEach(function (tri) {
      tri.forEach(function (p) {
        pos.push(p[0], p[1], p[2]);
        const u = f(p);
        uvs.push(u[0] / S, u[1] / S);
      });
    });
  }
  const fxy = function (p) { return [p[0], p[1]]; };
  const fzy = function (p) { return [p[2], p[1]]; };
  function rowPts(y, hole) {
    const a = hw(y);
    const b = xb(y);
    const d = hd(y);
    const e = ze(y);
    return hole
      ? [[-a, e], [-b, d], [-hx(y), d], [hx(y), d], [b, d], [a, e]]
      : [[-a, e], [-b, d], [b, d], [a, e]];
  }
  for (let i = 0; i < N; i++) {
    const y0 = i * dy;
    const y1 = (i + 1) * dy;
    const hole = y0 >= HY0 - 1e-6 && y1 <= HY1 + 1e-6;
    const p0 = rowPts(y0, hole);
    const p1 = rowPts(y1, hole);
    const segs = hole ? [0, 1, 3, 4] : [0, 1, 2];
    segs.forEach(function (j) {
      const A = p0[j];
      const B = p0[j + 1];
      const C = p1[j + 1];
      const D = p1[j];
      quad([A[0], y0, A[1]], [B[0], y0, B[1]], [C[0], y1, C[1]], [D[0], y1, D[1]], fxy);
      quad([B[0], y0, -B[1]], [A[0], y0, -A[1]], [D[0], y1, -D[1]], [C[0], y1, -C[1]], fxy);
    });
    const a0 = hw(y0);
    const a1 = hw(y1);
    const e0 = ze(y0);
    const e1 = ze(y1);
    quad([a0, y0, e0], [a0, y0, -e0], [a1, y1, -e1], [a1, y1, e1], fzy);
    quad([-a0, y0, -e0], [-a0, y0, e0], [-a1, y1, e1], [-a1, y1, -e1], fzy);
    if (hole) {
      const d0 = hd(y0);
      const d1 = hd(y1);
      const x0 = hx(y0);
      const x1 = hx(y1);
      quad([-x0, y0, d0], [-x0, y0, -d0], [-x1, y1, -d1], [-x1, y1, d1], fzy);
      quad([x0, y0, -d0], [x0, y0, d0], [x1, y1, d1], [x1, y1, -d1], fzy);
    }
  }
  (function () {
    const f = function (p) { return [p[0], p[2]]; };
    let y = HY0;
    let x = hx(y);
    let d = hd(y);
    quad([-x, y, d], [x, y, d], [x, y, -d], [-x, y, -d], f);
    y = HY1;
    x = hx(y);
    d = hd(y);
    quad([-x, y, d], [-x, y, -d], [x, y, -d], [x, y, d], f);
    y = H;
    x = hw(y);
    d = ze(y);
    quad([-x, y, d], [x, y, d], [x, y, -d], [-x, y, -d], f);
  })();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  tower.add(sh(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: glassTex(),
    roughness: 0.45,
    metalness: 0.1,
    side: THREE.DoubleSide
  }))));

  const line = function (pts, m) {
    tower.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m));
  };
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (sign) {
    const sx = sign[0];
    const sz = sign[1];
    const p = [];
    const q = [];
    for (let i = 0; i <= N; i++) {
      const y = i * dy;
      p.push(new THREE.Vector3(sx * hw(y), y, sz * ze(y)));
      q.push(new THREE.Vector3(sx * xb(y), y, sz * (hd(y) + 0.002)));
    }
    line(p, hiMat);
    line(q, hiMat);
  });
  [1, -1].forEach(function (sz) {
    const p = [[-hx(HY0), HY0], [-hx(HY1), HY1], [hx(HY1), HY1], [hx(HY0), HY0], [-hx(HY0), HY0]].map(function (q) {
      return new THREE.Vector3(q[0], q[1], sz * (hd(q[1]) + 0.003));
    });
    line(p, hiMat);
  });
  [1.4, 2.8, 4.2, 5.6, 7, 8.2].forEach(function (y) {
    const P = rowPts(y, false);
    const pts = [];
    P.forEach(function (q) { pts.push(new THREE.Vector3(q[0], y, q[1] + 0.002)); });
    for (let k = P.length - 1; k >= 0; k--) pts.push(new THREE.Vector3(P[k][0], y, -P[k][1] - 0.002));
    pts.push(pts[0].clone());
    line(pts, hiMat);
  });

  const stone = sh(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.42, 1.8), new THREE.MeshStandardMaterial({ color: 0x5e5e5e, roughness: 0.9 })));
  stone.position.y = 0.12 + 0.21;
  edges(stone);
  tower.add(stone);
  const pod = sh(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 3.4), white));
  pod.position.y = 0.06;
  edges(pod);
  tower.add(pod);
  const wall = sh(new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.45, 0.4, 40, 1, true, -Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xbdbdbd, side: THREE.DoubleSide })
  ));
  wall.position.y = 0.32;
  tower.add(wall);
  const wt = new THREE.Mesh(
    new THREE.RingGeometry(1.3, 1.45, 40, 1, -Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, side: THREE.DoubleSide })
  );
  wt.rotation.x = -Math.PI / 2;
  wt.position.y = 0.52;
  tower.add(wt);
  const pav = sh(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.75), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3 })));
  pav.position.set(0, 0.2, 2.05);
  pav.rotation.x = -0.22;
  edges(pav);
  tower.add(pav);
  const lv = sh(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.07), white));
  lv.position.set(0, H + 0.05, 0);
  tower.add(lv);

  let theta = 0.7;
  let phi = 1.3;
  const dist = canvas.clientWidth < 760 ? 26 : 19;
  let drag = false;
  let lx = 0;
  let ly = 0;
  let auto = true;
  let idle = 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tgt = new THREE.Vector3(0, 4.8, 0);
  const ease = function (t) {
    t = Math.min(1, Math.max(0, t));
    return 1 - Math.pow(1 - t, 3);
  };
  let raf = 0;
  let elapsed = 0;
  let last = 0;

  canvas.addEventListener("pointerdown", function (e) {
    drag = true;
    auto = false;
    lx = e.clientX;
    ly = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("pointerup", function () {
    drag = false;
    idle = performance.now();
    canvas.style.cursor = "grab";
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!drag) return;
    theta -= (e.clientX - lx) * 0.006;
    phi = Math.min(1.5, Math.max(0.3, phi - (e.clientY - ly) * 0.005));
    lx = e.clientX;
    ly = e.clientY;
  });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    raf = 0;
    if (panel.hidden || document.hidden) { last = 0; return; }
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduce) elapsed += dt;
    resize();
    const t = reduce ? 8 : elapsed;
    tower.scale.y = Math.max(0.001, ease(t / 2.2));
    if (!drag && !auto && now - idle > 3000) auto = true;
    if (auto && !reduce) theta += 0.002;
    camera.position.set(
      Math.sin(theta) * Math.sin(phi) * dist,
      tgt.y + Math.cos(phi) * dist,
      Math.cos(theta) * Math.sin(phi) * dist
    );
    camera.lookAt(tgt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || panel.hidden) return;
    raf = requestAnimationFrame(frame);
  }

  new MutationObserver(start).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", start);
  new ResizeObserver(resize).observe(canvas);
  start();
})();
