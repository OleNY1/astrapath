(function () {
  const canvas = document.getElementById("campus");
  const panel = document.getElementById("panel-columbia");
  if (!canvas || !panel || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 20, 44);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 0.85);
  sun.position.set(-7, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  const S = 0.02;
  const CX = 250;
  const CY = 480;
  const P = function (x, y) { return [(x - CX) * S, (y - CY) * S]; };
  const group = new THREE.Group();
  scene.add(group);

  function winTex() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#ededed";
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#2b2b2b";
    for (let i = 0; i < 2; i++) g.fillRect(8 + i * 30, 10, 14, 34);
    g.fillStyle = "#bdbdbd";
    g.fillRect(0, 54, 64, 3);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }

  const baseTex = winTex();
  const plain = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.85 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  const items = [];

  function reg(g, delay) {
    g.scale.y = 0.001;
    group.add(g);
    items.push({ g: g, delay: delay });
  }

  function sh(m) {
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 24),
    new THREE.MeshStandardMaterial({ color: 0x161616 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  group.add(ground);
  group.add(new THREE.GridHelper(24, 48, 0x2c2c2c, 0x1d1d1d));

  function slab(x, y, w, h, col, t) {
    const thick = t || 0.02;
    const p = P(x + w / 2, y + h / 2);
    const m = sh(new THREE.Mesh(
      new THREE.BoxGeometry(w * S, thick, h * S),
      new THREE.MeshStandardMaterial({ color: col })
    ));
    m.position.set(p[0], thick / 2, p[1]);
    group.add(m);
    return m;
  }

  slab(0, 616, 500, 40, 0x2a2a2a);
  slab(166, 682, 70, 150, 0x3c3c3c);
  slab(262, 682, 70, 150, 0x3c3c3c);
  slab(150, 484, 200, 84, 0x303030);
  [[236, 656, 26, 190], [0, 566, 500, 6], [150, 300, 200, 10], [0, 296, 500, 8], [236, 512, 26, 56], [110, 300, 8, 170], [382, 300, 8, 170], [0, 150, 500, 8]].forEach(function (a) {
    slab(a[0], a[1], a[2], a[3], 0x4a4a4a, 0.03);
  });

  const B = [
    [16, 38, 52, 120, 1.3, "Northwest Corner"], [68, 38, 110, 58, 1.2, "Pupin"], [190, 48, 110, 68, 0.9, "Schapiro CEPSR"], [316, 38, 150, 52, 1.1, "Mudd"],
    [340, 92, 60, 110, 1.6, "Fairchild"], [430, 95, 44, 95, 1.4, "Computer Science"], [430, 190, 44, 50, 0.9, ""], [348, 225, 126, 55, 1.2, "Schermerhorn"],
    [16, 166, 42, 66, 1, "Chandler"], [16, 236, 134, 52, 1.2, "Havemeyer"], [108, 172, 40, 50, 0.6, ""],
    [16, 306, 50, 92, 1, "Mathematics"], [348, 305, 40, 90, 1.2, "Avery"], [438, 305, 36, 90, 0.9, "Fayerweather"], [50, 408, 70, 40, 0.5, "Earl"],
    [198, 366, 106, 118, 0.8, ""], [370, 408, 80, 50, 0.6, "St. Paul's"], [336, 476, 40, 36, 0.5, "Buell"], [16, 462, 40, 90, 1, "Lewisohn"],
    [436, 462, 36, 90, 1.1, "Philosophy"], [16, 570, 126, 36, 0.7, "Dodge / Miller"], [350, 570, 124, 36, 0.8, "Kent"], [16, 672, 118, 32, 0.8, "Pulitzer"],
    [350, 672, 124, 36, 1, "Hamilton"], [16, 716, 42, 80, 1.5, "Furnald"], [436, 714, 38, 70, 1.2, "Hartley"], [436, 790, 38, 70, 1.2, "Wallach"],
    [16, 822, 138, 90, 0.9, "Lerner"], [166, 846, 166, 76, 1.2, "Butler Library"], [350, 896, 124, 40, 1.4, "John Jay"]
  ];

  B.forEach(function (b, i) {
    const x = b[0];
    const y = b[1];
    const w = b[2];
    const h = b[3];
    const ht = b[4];
    const W = w * S;
    const D = h * S;
    const g = new THREE.Group();
    const p = P(x + w / 2, y + h / 2);
    g.position.set(p[0], 0, p[1]);
    const tex = baseTex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(Math.max(1, Math.round((W + D) / 2 / 0.22)), Math.max(1, Math.round(ht / 0.26)));
    const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    const geo = new THREE.BoxGeometry(W, ht, D);
    const body = sh(new THREE.Mesh(geo, [side, side, plain, plain, side, side]));
    body.position.y = ht / 2;
    body.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    g.add(body);
    const pl = sh(new THREE.Mesh(new THREE.BoxGeometry(W + 0.05, 0.07, D + 0.05), trim));
    pl.position.y = 0.035;
    g.add(pl);
    const co = sh(new THREE.Mesh(new THREE.BoxGeometry(W + 0.05, 0.05, D + 0.05), trim));
    co.position.y = ht + 0.025;
    g.add(co);
    if (i % 3 !== 1 && W > 0.5 && D > 0.5) {
      const r = sh(new THREE.Mesh(new THREE.BoxGeometry(W * 0.45, 0.18, D * 0.4), plain));
      r.position.y = ht + 0.05 + 0.09;
      r.add(new THREE.LineSegments(new THREE.EdgesGeometry(r.geometry), edgeMat));
      g.add(r);
    }
    reg(g, i * 0.05);
  });

  function dome(x, y, r, ht, delay) {
    const g = new THREE.Group();
    const p = P(x, y);
    g.position.set(p[0], 0, p[1]);
    const R = r * S;
    const tex = baseTex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(10, Math.max(1, Math.round(ht / 0.26)));
    const drumGeo = new THREE.CylinderGeometry(R, R, ht, 40);
    const drum = sh(new THREE.Mesh(drumGeo, [new THREE.MeshStandardMaterial({ map: tex }), plain, plain]));
    drum.position.y = ht / 2;
    g.add(drum);
    const ring = sh(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.05, 40), trim));
    ring.position.y = ht + 0.025;
    g.add(ring);
    const cap = sh(new THREE.Mesh(new THREE.SphereGeometry(R * 0.85, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), trim));
    cap.position.y = ht + 0.05;
    cap.add(new THREE.LineSegments(new THREE.WireframeGeometry(cap.geometry), new THREE.LineBasicMaterial({ color: 0x999999 })));
    g.add(cap);
    const lan = sh(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.12, R * 0.16, 0.14, 12), trim));
    lan.position.y = ht + 0.05 + R * 0.85 + 0.05;
    g.add(lan);
    reg(g, delay);
  }

  (function () {
    const g = new THREE.Group();
    const p = P(251, 430);
    g.position.set(p[0], 0, p[1]);
    const ln = function (m) { m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat)); };
    const dr = sh(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 1.3), plain));
    dr.position.y = 1.2;
    ln(dr);
    g.add(dr);
    const co = sh(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.4), trim));
    co.position.y = 1.43;
    ln(co);
    g.add(co);
    const arch = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    arch.position.set(0, 1.1, 0.655);
    g.add(arch);
    const base = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.1, 48), trim));
    base.position.y = 1.51;
    g.add(base);
    const cap = sh(new THREE.Mesh(new THREE.SphereGeometry(0.6, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), trim));
    cap.position.y = 1.56;
    cap.scale.y = 0.5;
    cap.add(new THREE.LineSegments(new THREE.WireframeGeometry(cap.geometry), new THREE.LineBasicMaterial({ color: 0x8a8a8a })));
    g.add(cap);
    reg(g, 1.7);
  })();

  function finTex() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#dcdcdc";
    g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 2; i++) {
      g.fillStyle = "#262626";
      g.fillRect(i * 32 + 6, 0, 26, 64);
      g.fillStyle = "#bfbfbf";
      g.fillRect(i * 32 + 6, 44, 26, 8);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }

  (function () {
    const g = new THREE.Group();
    const rep = function (tx, u, v) {
      const t = tx.clone();
      t.needsUpdate = true;
      t.repeat.set(u, v);
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
    };
    const box = function (w, h, d, x, y, z, mat) {
      const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
      m.position.set(x, y + h / 2, z);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat));
      g.add(m);
      return m;
    };
    const fin = finTex();
    const p = P(241, 265);
    const win = rep(baseTex, 10, 2);
    box(2.6, 0.55, 1.2, p[0], 0, p[1], [win, win, plain, plain, win, win]);
    box(2.65, 0.04, 1.25, p[0], 0.55, p[1], trim);
    const tower = P(241, 245);
    const finM = rep(fin, 14, 6);
    box(1.3, 1.35, 0.8, p[0], 0.59, tower[1], [finM, finM, plain, plain, finM, finM]);
    box(0.27, 1.35, 0.8, p[0] - 0.785, 0.59, tower[1], plain);
    box(0.27, 1.35, 0.8, p[0] + 0.785, 0.59, tower[1], plain);
    box(1.84, 0.05, 0.84, p[0], 1.94, tower[1], trim);
    const lv = rep(fin, 10, 1);
    box(1.3, 0.2, 0.5, p[0], 1.99, tower[1], [lv, lv, plain, plain, lv, lv]);
    [-0.785, 0.785].forEach(function (dx) {
      const s = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 20), trim));
      s.position.set(p[0] + dx, 1.99 + 0.14, tower[1] - 0.15);
      s.add(new THREE.LineSegments(new THREE.EdgesGeometry(s.geometry), edgeMat));
      g.add(s);
    });
    const hall = P(241, 195);
    const R = 1.1;
    const bay = rep(fin, 22, 2);
    const drum = sh(new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.6, 64), [bay, plain, plain]));
    drum.position.set(hall[0], 0.3, hall[1]);
    g.add(drum);
    const rim = sh(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.04, R + 0.04, 0.05, 64), trim));
    rim.position.set(hall[0], 0.625, hall[1]);
    g.add(rim);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(R - 0.03, 0.008, 6, 80), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    rail.rotation.x = Math.PI / 2;
    rail.position.set(hall[0], 0.7, hall[1]);
    g.add(rail);
    reg(g, 1.8);
  })();

  dome(85, 428, 13, 0.75, 1.5);

  function colonnade(g, n, x0, x1, z, h, r) {
    for (let i = 0; i < n; i++) {
      const c = sh(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 12), trim));
      c.position.set(x0 + (x1 - x0) * i / (n - 1), h / 2, z);
      g.add(c);
    }
  }

  (function () {
    const g = new THREE.Group();
    const p = P(251, 484);
    g.position.set(p[0], 0, p[1]);
    for (let i = 0; i < 5; i++) {
      const s = sh(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.055 * (5 - i), 0.2), trim));
      s.position.set(0, 0.0275 * (5 - i), 0.1 + i * 0.2);
      g.add(s);
    }
    const up = new THREE.Group();
    up.position.y = 0.25;
    up.position.z = -0.05;
    g.add(up);
    colonnade(up, 10, -0.78, 0.78, 0, 0.55, 0.04);
    const ent = sh(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.34), trim));
    ent.position.set(0, 0.62, -0.02);
    up.add(ent);
    const pav = sh(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 0.9), plain));
    pav.position.set(0, 0.25, -0.4);
    pav.add(new THREE.LineSegments(new THREE.EdgesGeometry(pav.geometry), edgeMat));
    up.add(pav);
    const att = sh(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.3), trim));
    att.position.set(0, 0.79, -0.1);
    att.add(new THREE.LineSegments(new THREE.EdgesGeometry(att.geometry), edgeMat));
    up.add(att);
    reg(g, 2.1);
  })();

  (function () {
    const g = new THREE.Group();
    const p = P(249, 846);
    g.position.set(p[0], 0, p[1]);
    const base = sh(new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.06, 0.2), trim));
    base.position.y = 0.03;
    base.position.z = -0.12;
    g.add(base);
    colonnade(g, 12, -1.2, 1.2, -0.12, 1.1, 0.04);
    const ent = sh(new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 0.22), trim));
    ent.position.set(0, 1.14, -0.12);
    g.add(ent);
    reg(g, 2.2);
  })();

  (function () {
    const g = new THREE.Group();
    const p = P(244, 681);
    g.position.set(p[0], 0, p[1]);
    const a = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 24), trim));
    a.position.y = 0.04;
    g.add(a);
    const b = sh(new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), trim));
    b.position.y = 0.13;
    g.add(b);
    reg(g, 2.3);
  })();

  const tp = [];
  for (let x = 30; x <= 470; x += 34) {
    if (x > 210 && x < 290) continue;
    tp.push([x, 624], [x, 648]);
  }
  for (let y = 700; y <= 830; y += 32) tp.push([158, y], [340, y]);
  [[130, 330], [370, 330], [130, 360], [370, 360], [210, 330], [290, 330], [120, 500], [385, 520], [60, 290], [440, 290], [100, 150], [400, 150], [160, 460], [340, 455]].forEach(function (p) { tp.push(p); });

  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.12, 6),
    new THREE.MeshStandardMaterial({ color: 0x777777 }),
    tp.length
  );
  const crowns = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.13, 0),
    new THREE.MeshStandardMaterial({ color: 0xb5b5b5, flatShading: true }),
    tp.length
  );
  const m4 = new THREE.Matrix4();
  tp.forEach(function (p, i) {
    const pos = P(p[0], p[1]);
    const s = 0.8 + ((i * 37) % 5) / 10;
    m4.makeScale(s, s, s);
    m4.setPosition(pos[0], 0.06 * s, pos[1]);
    trunks.setMatrixAt(i, m4);
    m4.makeScale(s, s, s);
    m4.setPosition(pos[0], 0.2 * s, pos[1]);
    crowns.setMatrixAt(i, m4);
  });
  crowns.castShadow = true;
  trunks.castShadow = true;
  const treeGroup = new THREE.Group();
  treeGroup.add(trunks, crowns);
  group.add(treeGroup);
  treeGroup.scale.setScalar(0.001);

  let theta = 0.6;
  let phi = 0.95;
  let dist = canvas.clientWidth < 760 ? 24 : 17;
  let drag = false;
  let lx = 0;
  let ly = 0;
  let auto = true;
  let idle = 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    phi = Math.min(1.45, Math.max(0.25, phi - (e.clientY - ly) * 0.005));
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
    items.forEach(function (it) {
      it.g.scale.y = Math.max(0.001, ease((t - it.delay) / 0.9));
    });
    treeGroup.scale.setScalar(Math.max(0.001, ease((t - 2.4) / 0.8)));
    if (!drag && !auto && now - idle > 3000) auto = true;
    if (auto && !reduce) theta += 0.002;
    camera.position.set(
      Math.sin(theta) * Math.sin(phi) * dist,
      Math.cos(phi) * dist,
      Math.cos(theta) * Math.sin(phi) * dist
    );
    camera.lookAt(0, 0, 0);
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
