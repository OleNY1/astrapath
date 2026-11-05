(function () {
  const canvas = document.getElementById("assist");
  const panel = document.getElementById("panel-assist");
  const tagsBox = document.getElementById("assist-tags");
  const stepsBox = document.getElementById("assist-steps");
  if (!canvas || !panel || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 20, 42);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.85);
  sun.position.set(-6, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  const softEdge = new THREE.LineBasicMaterial({ color: 0x5a5a5a });
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 });
  const furnMat = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.85 });
  const personMat = new THREE.MeshStandardMaterial({ color: 0xc4c4c4, roughness: 0.7 });
  const sh = function (m) { m.castShadow = m.receiveShadow = true; return m; };

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshStandardMaterial({ color: 0x151515 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(new THREE.GridHelper(26, 52, 0x2b2b2b, 0x1c1c1c));

  const plan = new THREE.Group();
  plan.scale.y = 0.001;
  scene.add(plan);

  function box(w, h, d, x, y, z, mat, edges) {
    const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
    m.position.set(x, y + h / 2, z);
    if (edges !== false) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), mat === white ? edgeMat : softEdge));
    plan.add(m);
    return m;
  }

  function cyl(r, h, x, y, z, mat) {
    const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), mat));
    m.position.set(x, y + h / 2, z);
    plan.add(m);
    return m;
  }

  const FLOOR = 0.12;
  box(10.4, FLOOR, 6.4, 0, 0, 0, new THREE.MeshStandardMaterial({ color: 0x1f1f1f }));
  box(10, 0.006, 0.8, 0, FLOOR, 0, new THREE.MeshStandardMaterial({ color: 0x2e2e2e }), false);
  box(0.8, 0.006, 2.6, 0, FLOOR, 1.7, new THREE.MeshStandardMaterial({ color: 0x2e2e2e }), false);
  box(2.4, 0.04, 1.4, 0, 0, 3.9, new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));

  const WH = 0.5;
  const T = 0.05;
  function wallSeg(x0, z0, x1, z1) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    if (len < 0.01) return;
    const horiz = Math.abs(z1 - z0) < 1e-6;
    box(horiz ? len : T, WH, horiz ? T : len, (x0 + x1) / 2, FLOOR, (z0 + z1) / 2, white);
  }

  function room(r) {
    const i = 0.03;
    const x0 = r.x0 + i;
    const x1 = r.x1 - i;
    const z0 = r.z0 + i;
    const z1 = r.z1 - i;
    const gap = 0.26;
    const doorZ = r.door === "s" ? z1 : z0;
    const otherZ = r.door === "s" ? z0 : z1;
    wallSeg(x0, otherZ, x1, otherZ);
    wallSeg(x0, z0, x0, z1);
    wallSeg(x1, z0, x1, z1);
    wallSeg(x0, doorZ, r.dx - gap, doorZ);
    wallSeg(r.dx + gap, doorZ, x1, doorZ);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(x1 - x0 - 0.06, z1 - z0 - 0.06),
      new THREE.MeshBasicMaterial({ color: 0x262626 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((x0 + x1) / 2, FLOOR + 0.004, (z0 + z1) / 2);
    plan.add(floor);
    r.floor = floor;
    r.cx = (r.x0 + r.x1) / 2;
    r.cz = (r.z0 + r.z1) / 2;
    return r;
  }

  const rooms = {
    classA: room({ x0: -5, x1: -2.5, z0: -3, z1: -0.4, door: "s", dx: -3.2 }),
    cafe: room({ x0: -2.5, x1: 0, z0: -3, z1: -0.4, door: "s", dx: -0.8 }),
    class2: room({ x0: 0, x1: 2.5, z0: -3, z1: -0.4, door: "s", dx: 1.6 }),
    quiet: room({ x0: 2.5, x1: 5, z0: -3, z1: -0.4, door: "s", dx: 3.2 }),
    atrium: room({ x0: -5, x1: -2, z0: 0.4, z1: 3, door: "n", dx: -2.8 }),
    rest: room({ x0: -2, x1: -0.4, z0: 0.4, z1: 3, door: "n", dx: -1.2 }),
    lab: room({ x0: 0.4, x1: 2.5, z0: 0.4, z1: 3, door: "n", dx: 1.2 }),
    library: room({ x0: 2.5, x1: 5, z0: 0.4, z1: 3, door: "n", dx: 3.4 })
  };
  wallSeg(-0.4, 3, -0.3, 3);
  wallSeg(0.3, 3, 0.4, 3);
  wallSeg(-5, -0.4, -5, 0.4);
  wallSeg(5, -0.4, 5, 0.4);

  const F = FLOOR;
  function desk(x, z) {
    box(0.34, 0.025, 0.2, x, F + 0.14, z, furnMat);
    box(0.03, 0.14, 0.18, x - 0.15, F, z, furnMat, false);
    box(0.03, 0.14, 0.18, x + 0.15, F, z, furnMat, false);
    box(0.12, 0.08, 0.12, x, F, z + 0.2, furnMat, false);
  }
  [rooms.classA, rooms.class2].forEach(function (r) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) desk(r.x0 + 0.55 + col * 0.7, r.z0 + 0.7 + row * 0.6);
    }
    box(0.9, 0.03, 0.3, r.cx, F + 0.14, r.z0 + 0.25, furnMat);
  });
  [[-1.9, -2.2], [-0.8, -2.3], [-1.6, -1.2], [-0.6, -1.3]].forEach(function (p) {
    cyl(0.2, 0.02, p[0], F + 0.15, p[1], furnMat);
    cyl(0.03, 0.15, p[0], F, p[1], furnMat);
  });
  box(1.6, 0.25, 0.22, -1.25, F, -2.78, furnMat);
  [[3.2, -2.3], [4.3, -2.3]].forEach(function (p) {
    box(0.42, 0.12, 0.38, p[0], F, p[1], furnMat);
    box(0.42, 0.18, 0.08, p[0], F + 0.12, p[1] - 0.15, furnMat);
  });
  cyl(0.16, 0.12, 3.75, F, -1.7, furnMat);
  const plant = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: 0xb5b5b5, flatShading: true })));
  plant.position.set(4.6, F + 0.3, -0.9);
  plan.add(plant);
  cyl(0.08, 0.16, 4.6, F, -0.9, furnMat);
  [[-4.3, 1.1], [-3.0, 1.1], [-4.3, 2.3], [-3.0, 2.3]].forEach(function (p) {
    box(0.8, 0.09, 0.24, p[0], F, p[1], furnMat);
  });
  for (let i = 0; i < 3; i++) box(0.28, 0.4, 0.04, -1.75 + i * 0.4, F, 2.2, furnMat);
  [1.0, 1.9].forEach(function (z) { box(1.6, 0.18, 0.36, 1.45, F, z, furnMat); });
  [1.3, 2.0, 2.7].forEach(function (z) { box(2.0, 0.42, 0.14, 3.85, F, z, furnMat); });

  const lightMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.6 });
  const lockerMat = new THREE.MeshStandardMaterial({ color: 0x5e5e5e, roughness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xbfbfbf, transparent: true, opacity: 0.3, roughness: 0.1, depthWrite: false });
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x9c9c9c, flatShading: true, roughness: 0.9 });

  [rooms.classA, rooms.class2].forEach(function (r) {
    box(1.2, 0.22, 0.02, r.cx, F + 0.18, r.z0 + 0.06, lightMat);
    box(0.5, 0.02, 0.06, r.cx, F + 0.17, r.z0 + 0.08, furnMat, false);
    box(0.16, 0.04, 0.12, r.cx, F + 0.42, r.z0 + 1.0, furnMat, false);
  });

  [-1.9, -1.6, -1.3].forEach(function (x) { box(0.14, 0.12, 0.12, x, F + 0.25, -2.8, lightMat); });
  box(1.0, 0.14, 0.02, -1.25, F + 0.32, -2.93, lightMat);
  [0.9, 1.45, 2.0].forEach(function (x) {
    [1.0, 1.9].forEach(function (z) {
      box(0.22, 0.15, 0.02, x, F + 0.18, z - 0.06, lightMat);
      cyl(0.07, 0.12, x, F, z + 0.32, furnMat);
    });
  });
  box(0.14, 0.2, 0.6, 2.38, F, 2.5, lockerMat);

  [1.3, 2.0, 2.7].forEach(function (z) {
    [0.12, 0.24, 0.36].forEach(function (y) { box(1.96, 0.014, 0.16, 3.85, F + y, z, lightMat, false); });
  });
  box(0.22, 0.18, 0.9, -1.84, F, 1.5, lightMat);
  [1.2, 1.5, 1.8].forEach(function (z) { cyl(0.06, 0.02, -1.84, F + 0.18, z, furnMat); });
  cyl(0.18, 0.14, -4.72, F, 2.72, lockerMat);
  const atriumTree = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), plantMat));
  atriumTree.position.set(-4.72, F + 0.48, 2.72);
  plan.add(atriumTree);

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ color: 0x8c8c8c }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(3.75, F + 0.006, -2.0);
  plan.add(rug);
  box(0.14, 0.42, 1.0, 4.86, F, -2.2, furnMat);
  [0.12, 0.26].forEach(function (y) { box(0.16, 0.014, 0.96, 4.85, F + y, -2.2, lightMat, false); });
  cyl(0.015, 0.4, 2.72, F, -2.78, furnMat);
  cyl(0.07, 0.06, 2.72, F + 0.4, -2.78, lightMat);
  const reader = new THREE.Group();
  const readerBody = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 12), personMat));
  readerBody.position.y = 0.2;
  const readerHead = sh(new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), personMat));
  readerHead.position.y = 0.33;
  reader.add(readerBody, readerHead);
  reader.position.set(4.3, F, -2.28);
  plan.add(reader);

  [[-4.1, -0.32], [-1.8, -0.32], [-4.3, 0.32], [2.0, 0.32]].forEach(function (p) {
    box(1.0, 0.36, 0.1, p[0], F, p[1], lockerMat);
    for (let i = 1; i < 5; i++) box(0.006, 0.34, 0.104, p[0] - 0.5 + i * 0.2, F + 0.01, p[1], furnMat, false);
  });
  box(0.14, 0.2, 0.1, 4.7, F, 0.32, lightMat);
  cyl(0.06, 0.16, 0.7, F, -0.3, furnMat);

  const seams = [];
  for (let x = -4.75; x <= 4.76; x += 0.5) seams.push(x, F + 0.009, -0.4, x, F + 0.009, 0.4);
  for (let z = 0.75; z <= 2.8; z += 0.5) seams.push(-0.4, F + 0.009, z, 0.4, F + 0.009, z);
  const seamGeo = new THREE.BufferGeometry();
  seamGeo.setAttribute("position", new THREE.Float32BufferAttribute(seams, 3));
  plan.add(new THREE.LineSegments(seamGeo, new THREE.LineBasicMaterial({ color: 0x3c3c3c })));

  const doors = {};
  Object.keys(rooms).forEach(function (k) {
    const r = rooms[k];
    const g = new THREE.Group();
    const leaf = sh(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.025), white));
    leaf.position.set(0.21, 0.21, 0);
    leaf.add(new THREE.LineSegments(new THREE.EdgesGeometry(leaf.geometry), edgeMat));
    g.add(leaf);
    g.position.set(r.dx - 0.23, F, r.door === "s" ? r.z1 - 0.03 : r.z0 + 0.03);
    g.userData.open = r.door === "s" ? 1.3 : -1.3;
    g.rotation.y = k === "quiet" ? 0 : g.userData.open;
    plan.add(g);
    doors[k] = g;
  });

  const entry = [-1, 1].map(function (s) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.42, 0.02), glassMat);
    m.position.set(s * 0.145, F + 0.21, 3.06);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), softEdge));
    plan.add(m);
    return { m: m, s: s };
  });

  box(14, 0.02, 0.9, 0, 0, 5.2, new THREE.MeshStandardMaterial({ color: 0x242424 }));
  [[-2.0, 3.9], [2.0, 3.9], [-3.6, 3.75], [3.6, 3.75], [-5.4, 3.7], [5.4, 3.7], [-6.4, 1.5], [6.4, -1.2]].forEach(function (p, i) {
    cyl(0.04, 0.3, p[0], 0, p[1], furnMat);
    const crown = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + (i % 3) * 0.05, 0), plantMat));
    crown.position.set(p[0], 0.5, p[1]);
    crown.rotation.y = i;
    plan.add(crown);
  });
  for (let i = 0; i < 4; i++) box(0.02, 0.16, 0.26, 1.45 + i * 0.12, 0.04, 4.3, lightMat, false);
  box(0.7, 0.08, 0.22, -1.6, 0, 4.35, furnMat);

  const people = [];
  function person(x, z, range, phase) {
    const g = new THREE.Group();
    const body = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.24, 12), personMat));
    body.position.y = 0.12;
    const head = sh(new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), personMat));
    head.position.y = 0.3;
    g.add(body, head);
    g.position.set(x, F, z);
    plan.add(g);
    people.push({ g: g, x: x, z: z, range: range, phase: phase });
  }
  [[-1.9, -1.9], [-1.5, -2.25], [-0.8, -1.95], [-0.35, -1.3], [-1.6, -0.85], [-0.95, -1.0], [-2.2, -1.4]].forEach(function (p, i) {
    person(p[0], p[1], 0.18, i * 1.3);
  });
  [[-4.6, 1.6], [-3.6, 1.7], [-2.6, 1.6], [-3.9, 2.7], [-2.6, 2.6], [-4.4, 0.75]].forEach(function (p, i) {
    person(p[0], p[1], 0.3, i * 0.9 + 2);
  });
  [[3.0, 1.65], [4.6, 2.35]].forEach(function (p, i) {
    person(p[0], p[1], 0.12, i * 2.1 + 5);
  });
  const walkers = [[0, 0.17, 1], [3.1, -0.17, -1], [6.2, 0.17, 1], [4.6, -0.17, -1]].map(function (w) {
    person(0, w[1], 0, 0);
    const p = people.pop();
    return { g: p.g, off: w[0], z: w[1], dir: w[2] };
  });

  function outline(r, color) {
    const y = F + 0.012;
    const pts = [
      new THREE.Vector3(r.x0 + 0.08, y, r.z0 + 0.08),
      new THREE.Vector3(r.x1 - 0.08, y, r.z0 + 0.08),
      new THREE.Vector3(r.x1 - 0.08, y, r.z1 - 0.08),
      new THREE.Vector3(r.x0 + 0.08, y, r.z1 - 0.08),
      new THREE.Vector3(r.x0 + 0.08, y, r.z0 + 0.08)
    ];
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0 }));
    plan.add(l);
    return l;
  }
  const classLine = outline(rooms.class2, 0xffffff);
  const quietLine = outline(rooms.quiet, 0xffffff);

  const candidates = [rooms.cafe, rooms.atrium, rooms.library, rooms.quiet].map(function (r, i) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.4, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(r.cx, F + 0.02, r.cz);
    plan.add(ring);
    const meter = new THREE.Group();
    const bars = [];
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    back.position.set(0, 0.18, -0.005);
    back.renderOrder = 1;
    meter.add(back);
    for (let b = 0; b < 5; b++) {
      const h = 0.06 + b * 0.055;
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.07, h),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
      );
      bar.position.set((b - 2) * 0.1, h / 2, 0);
      bar.renderOrder = 2;
      meter.add(bar);
      bars.push(bar);
    }
    meter.position.set(r.cx, 0.62, r.cz);
    plan.add(meter);
    const level = [5, 4, 3, 1][i];
    return { r: r, ring: ring, meter: meter, back: back, bars: bars, level: level, at: 2.9 + i * 0.25, keep: r === rooms.quiet };
  });

  const scan = new THREE.Mesh(
    new THREE.RingGeometry(0.96, 1, 96),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  scan.rotation.x = -Math.PI / 2;
  scan.position.set(rooms.class2.cx, F + 0.03, rooms.class2.cz);
  plan.add(scan);

  const RY = F + 0.04;
  const pts = [
    [0, RY - F, 4.4], [0, RY - F, 3.25], [0, RY, 3.0], [0, RY, 0], [rooms.quiet.dx, RY, 0],
    [rooms.quiet.dx, RY, -0.4], [rooms.quiet.dx, RY, -1.55]
  ].map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
  const path = new THREE.CurvePath();
  for (let i = 1; i < pts.length; i++) path.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
  const SEGS = 700;
  const RADIAL = 8;
  const routeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
  const routeGeo = new THREE.TubeGeometry(path, SEGS, 0.045, RADIAL, false);
  routeGeo.setDrawRange(0, 0);
  plan.add(new THREE.Mesh(routeGeo, routeMat));
  const head = new THREE.Group();
  head.material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
  const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.28, 14), head.material);
  hb.position.y = 0.14;
  const hh = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), head.material);
  hh.position.y = 0.35;
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.13, 0.17, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.01;
  head.add(hb, hh, halo);
  plan.add(head);

  const linkPts = [
    new THREE.Vector3(rooms.quiet.dx, RY, -0.4),
    new THREE.Vector3(rooms.quiet.dx, RY, -0.12),
    new THREE.Vector3(rooms.class2.dx, RY, -0.12),
    new THREE.Vector3(rooms.class2.dx, RY, -0.4)
  ];
  const link = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(linkPts),
    new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.1, gapSize: 0.08, transparent: true, opacity: 0 })
  );
  link.computeLineDistances();
  plan.add(link);

  const tags = {};
  if (tagsBox) {
    tagsBox.querySelectorAll("[data-tag]").forEach(function (el) { tags[el.getAttribute("data-tag")] = el; });
  }
  const tagPos = {
    class: new THREE.Vector3(rooms.class2.cx, 1.0, rooms.class2.cz),
    quiet: new THREE.Vector3(rooms.quiet.cx, 1.15, rooms.quiet.cz)
  };
  const steps = stepsBox ? Array.from(stepsBox.children) : [];

  const START = 1.8;
  const CYCLE = 14;
  const smooth = function (t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  const ease = function (t) { t = Math.min(1, Math.max(0, t)); return 1 - Math.pow(1 - t, 3); };
  const lerp = function (a, b, t) { return a + (b - a) * t; };
  const grey = function (mat, v) { mat.color.setRGB(v / 255, v / 255, v / 255); };

  function story(t) {
    people.forEach(function (p) {
      const a = t * 0.6 + p.phase;
      p.g.position.x = p.x + Math.sin(a) * p.range;
      p.g.position.z = p.z + Math.cos(a * 0.8) * p.range * 0.6;
    });
    walkers.forEach(function (w) {
      const u = ((t * 0.32 + w.off) % 9.4 + 9.4) % 9.4;
      w.g.position.x = w.dir * (u - 4.7);
      w.g.position.z = w.z;
      w.g.position.y = F + Math.abs(Math.sin(t * 7 + w.off)) * 0.015;
    });

    if (t < START) {
      steps.forEach(function (li) { li.classList.remove("is-on"); });
      return { cls: 0, quiet: 0 };
    }
    const c = (t - START) % CYCLE;
    const out = c < 12 ? 1 : 1 - smooth((c - 12) / 1.4);

    const stage = c < 2.6 ? 0 : c < 5.6 ? 1 : c < 12 ? 2 : -1;
    steps.forEach(function (li, i) { li.classList.toggle("is-on", stage >= i); });

    const clsOn = smooth(c / 0.6) * out;
    const pulse = c < 2.6 ? 0.55 + 0.45 * Math.sin(c * 5) : 1;
    classLine.material.opacity = clsOn * pulse;
    grey(rooms.class2.floor.material, lerp(0x26, 0x4a, clsOn));

    const sc = (c - 2.6) / 1.8;
    scan.visible = sc > 0 && sc < 1;
    scan.scale.setScalar(0.2 + sc * 6.5);
    scan.material.opacity = (1 - sc) * 0.8;

    let quietOn = 0;
    candidates.forEach(function (cd) {
      const appear = smooth((c - cd.at) / 0.3);
      const drop = cd.keep ? 0 : smooth((c - 4.4) / 0.6);
      const op = appear * (1 - drop) * out;
      cd.ring.material.opacity = op;
      cd.ring.scale.setScalar(1 + 0.12 * Math.sin(t * 4 + cd.at));
      const fill = smooth((c - cd.at - 0.2) / 0.6);
      cd.back.material.opacity = op * 0.85;
      cd.bars.forEach(function (bar, b) {
        const lit = b < cd.level ? smooth(fill * cd.level - b) : 0;
        bar.material.opacity = op * (0.18 + 0.82 * lit);
      });
      if (cd.keep) quietOn = smooth((c - 4.7) / 0.6) * out;
    });
    quietLine.material.opacity = quietOn;
    grey(rooms.quiet.floor.material, lerp(0x26, 0xd8, quietOn));

    const rd = smooth((c - 5.6) / 3.4);
    const frac = c < 5.6 ? 0 : rd;
    routeGeo.setDrawRange(0, Math.floor(frac * SEGS) * RADIAL * 6);
    routeMat.opacity = out;
    const hp = path.getPointAt(Math.min(0.9999, Math.max(0.0001, frac)));
    head.visible = c >= 5.6 && out > 0.01;
    const moving = c > 5.6 && rd < 1 ? 1 : 0;
    head.position.set(hp.x, hp.y - 0.035 + moving * Math.abs(Math.sin(t * 9)) * 0.02, hp.z);
    head.material.opacity = out;
    halo.material.opacity = 0.5 * out;

    const doorsOpen = c < 12 ? smooth((c - 5.7) / 0.5) * (1 - smooth((c - 7.2) / 0.6)) : 0;
    entry.forEach(function (d) { d.m.position.x = d.s * (0.145 + 0.27 * doorsOpen); });
    const q = smooth((c - 7.4) / 0.6) * out;
    doors.quiet.rotation.y = doors.quiet.userData.open * q;

    link.material.opacity = smooth((c - 9.4) / 0.6) * out * 0.9;
    return { cls: clsOn, quiet: quietOn };
  }

  let thetaBase = 0.35;
  let theta = thetaBase;
  let phi = 0.86;
  const dist = canvas.clientWidth < 760 ? 20 : 14.2;
  const target = canvas.clientWidth < 760 ? new THREE.Vector3(0.2, 0, 0.6) : new THREE.Vector3(-1.0, 0, 0.5);
  let drag = false;
  let lx = 0;
  let ly = 0;
  let auto = true;
  let idle = 0;
  let sway = 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const v = new THREE.Vector3();
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
    phi = Math.min(1.35, Math.max(0.3, phi - (e.clientY - ly) * 0.005));
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

  function placeTag(el, p, on) {
    if (!el) return;
    v.copy(p).project(camera);
    el.style.left = ((v.x + 1) / 2 * canvas.clientWidth) + "px";
    el.style.top = ((1 - v.y) / 2 * canvas.clientHeight) + "px";
    el.style.opacity = on > 0.5 && v.z < 1 ? "1" : "0";
  }

  function frame(now) {
    raf = 0;
    if (panel.hidden || document.hidden) { last = 0; return; }
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduce) elapsed += dt;
    resize();
    const t = reduce ? START + 10 : elapsed;
    plan.scale.y = Math.max(0.001, ease(t / 1.6));
    const s = story(t);

    if (!drag && !auto && now - idle > 3000) {
      auto = true;
      thetaBase = theta - Math.sin(sway * 0.15) * 0.45;
    }
    if (auto && !reduce) {
      sway += dt;
      theta = thetaBase + Math.sin(sway * 0.15) * 0.45;
    }
    camera.position.set(
      target.x + Math.sin(theta) * Math.sin(phi) * dist,
      target.y + Math.cos(phi) * dist,
      target.z + Math.cos(theta) * Math.sin(phi) * dist
    );
    camera.lookAt(target);
    candidates.forEach(function (cd) { cd.meter.quaternion.copy(camera.quaternion); });
    renderer.render(scene, camera);
    placeTag(tags.class, tagPos.class, s.cls);
    placeTag(tags.quiet, tagPos.quiet, s.quiet);
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
