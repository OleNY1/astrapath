(function () {
  const canvas = document.getElementById("stepfree");
  const panel = document.getElementById("panel-stepfree");
  if (!canvas || !panel || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 20, 44);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.65));
  const sun = new THREE.DirectionalLight(0xffffff, 0.85);
  sun.position.set(-6, 12, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -4, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  const lightEdge = new THREE.LineBasicMaterial({ color: 0x9a9a9a });
  const dimEdge = new THREE.LineBasicMaterial({ color: 0x4a4a4a });
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 });
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.9 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x484848, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9 });
  const sh = function (m) { m.castShadow = m.receiveShadow = true; return m; };
  const edged = function (m, mat) {
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), mat || edgeMat));
    return m;
  };
  const edgeFor = function (mat) {
    if (mat === white) return edgeMat;
    if (mat === dark) return dimEdge;
    return lightEdge;
  };

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshStandardMaterial({ color: 0x151515 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(new THREE.GridHelper(24, 48, 0x2b2b2b, 0x1c1c1c));

  const building = new THREE.Group();
  building.scale.y = 0.001;
  scene.add(building);

  const FH = 1.05;
  const BASE = 0.25;
  const floorY = function (k) { return BASE + (k - 1) * FH; };
  const X0 = -3.2;
  const X1 = 3.2;
  const Z0 = -1.6;
  const Z1 = 1.6;
  const SHAFT = { x: 0.9, z: Z1 + 0.36, w: 0.72, d: 0.72 };
  const FRONT_Z = SHAFT.z + SHAFT.d / 2;
  const SERVED = [1, 3, 5];

  function box(w, h, d, x, y, z, mat, parent) {
    const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
    m.position.set(x, y + h / 2, z);
    edged(m, edgeFor(mat));
    (parent || building).add(m);
    return m;
  }

  box(7.2, BASE, 4.6, 0, 0, 0.3, slabMat);
  for (let i = 0; i < 3; i++) {
    box(1.4, BASE * (3 - i) / 3, 0.22, -1.4, 0, 2.71 + i * 0.22, dark);
  }
  const ramp = sh(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 1.45), white));
  ramp.position.set(2.4, BASE / 2, 3.3);
  ramp.rotation.x = Math.atan2(BASE, 1.4);
  edged(ramp);
  building.add(ramp);
  [-0.33, 0.33].forEach(function (rx) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 1.45), white);
    rail.position.set(rx, 0.2, 0);
    ramp.add(rail);
    [-0.68, 0, 0.68].forEach(function (rz) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.02), white);
      post.position.set(rx, 0.1, rz);
      ramp.add(post);
    });
  });

  const furnMat = new THREE.MeshStandardMaterial({ color: 0x626262, roughness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false });
  const glassEdge = new THREE.LineBasicMaterial({ color: 0xd0d0d0 });

  function desk(x, z, y) {
    box(0.34, 0.025, 0.18, x, y + 0.13, z, furnMat);
    box(0.025, 0.13, 0.16, x - 0.15, y, z, furnMat);
    box(0.025, 0.13, 0.16, x + 0.15, y, z, furnMat);
    box(0.12, 0.08, 0.12, x, y, z + 0.17, furnMat);
    box(0.12, 0.1, 0.02, x, y + 0.08, z + 0.23, furnMat);
  }

  function table(x, z, y, w, d) {
    box(w, 0.025, d, x, y + 0.13, z, furnMat);
    box(0.04, 0.13, 0.04, x, y, z, furnMat);
    for (let i = 0; i < 3; i++) {
      const cx = x - w / 2 + w * (i + 0.5) / 3;
      box(0.1, 0.08, 0.1, cx, y, z - d / 2 - 0.1, furnMat);
      box(0.1, 0.08, 0.1, cx, y, z + d / 2 + 0.1, furnMat);
    }
  }

  function lounge(x, z, y) {
    box(0.6, 0.09, 0.22, x, y, z, furnMat);
    box(0.6, 0.12, 0.06, x, y + 0.09, z - 0.08, furnMat);
    box(0.3, 0.06, 0.2, x, y, z + 0.32, furnMat);
  }

  for (let k = 2; k <= 5; k++) {
    box(X1 - X0, 0.08, Z1 - Z0, 0, floorY(k) - 0.08, 0, slabMat);
  }
  [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]].forEach(function (c) {
    box(0.1, FH * 4, 0.1, c[0], BASE, c[1], wallMat);
  });

  function wall(x0, z0, x1, z1, y, h, mat) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = box(len, h, 0.05, (x0 + x1) / 2, y, (z0 + z1) / 2, mat || wallMat);
    m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    return m;
  }

  function room(x0, x1, z0, z1, y, doorX) {
    const h = 0.32;
    wall(x0, z0, x1, z0, y, h);
    wall(x0, z0, x0, z1, y, h);
    wall(x1, z0, x1, z1, y, h);
    wall(x0, z1, doorX - 0.22, z1, y, h);
    wall(doorX + 0.22, z1, x1, z1, y, h);
  }

  let roomFloor = null;
  let door512 = null;
  for (let k = 1; k <= 5; k++) {
    const y = floorY(k);
    room(X0 + 0.08, -1.2, Z0 + 0.08, -0.4, y, -2.0);
    room(-1.2, 0.5, Z0 + 0.08, -0.4, y, -0.35);
    if (k > 1) {
      room(-1.6, 0.2, 0.75, Z1 - 0.08, y, -0.7);
      table(-0.7, 1.15, y, 0.9, 0.3);
      lounge(1.9, 0.55, y);
    } else {
      box(0.9, 0.2, 0.22, -0.6, y, 0.95, furnMat);
      box(0.9, 0.03, 0.3, -0.6, y + 0.2, 0.95, furnMat);
      box(0.7, 0.08, 0.2, -2.4, y, 1.1, furnMat);
      box(0.7, 0.08, 0.2, -2.4, y, 0.6, furnMat);
    }
    if (k === 5) {
      table(-2.6, -1.0, y, 0.6, 0.26);
    } else {
      desk(-2.7, -1.3, y);
      desk(-1.75, -1.3, y);
    }
    desk(-0.75, -1.3, y);
    desk(0.05, -1.3, y);
    if (k === 5) {
      door512 = new THREE.Group();
      door512.position.set(-2.22, y, -0.4);
      box(0.44, 0.3, 0.03, 0.22, 0, 0, wallMat, door512);
      building.add(door512);
      box(0.3, 0.07, 0.02, -2.0, y + 0.42, -0.37, white);
    }
    if (k === 5) {
      roomFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(1.95, 1.05),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
      );
      roomFloor.rotation.x = -Math.PI / 2;
      roomFloor.position.set((X0 + 0.08 - 1.2) / 2, y + 0.004, (Z0 + 0.08 - 0.4) / 2);
      building.add(roomFloor);
    }
  }

  for (let k = 1; k <= 4; k++) {
    const y = floorY(k);
    for (let s = 0; s < 6; s++) {
      box(0.75, (FH - 0.08) * (s + 1) / 6, 0.16, 2.75, y, Z0 + 0.2 + s * 0.16, dark);
    }
  }

  (function () {
    const top = floorY(5) + 0.45;
    const lines = [];
    const seg = function (a, b) { lines.push(a[0], a[1], a[2], b[0], b[1], b[2]); };
    for (let x = X0; x <= X1 + 1e-6; x += 0.4) seg([x, BASE, Z0 - 0.01], [x, top, Z0 - 0.01]);
    for (let z = Z0; z <= Z1 + 1e-6; z += 0.4) seg([X0 - 0.01, BASE, z], [X0 - 0.01, top, z]);
    for (let k = 1; k <= 5; k++) {
      [floorY(k) + 0.02, floorY(k) + 0.45].forEach(function (y) {
        seg([X0, y, Z0 - 0.01], [X1, y, Z0 - 0.01]);
        seg([X0 - 0.01, y, Z0], [X0 - 0.01, y, Z1]);
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    building.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x6a6a6a })));
    const back = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, top - BASE), glassMat);
    back.position.set(0, (BASE + top) / 2, Z0 - 0.012);
    building.add(back);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(Z1 - Z0, top - BASE), glassMat);
    side.rotation.y = Math.PI / 2;
    side.position.set(X0 - 0.012, (BASE + top) / 2, 0);
    building.add(side);
  })();

  box(0.06, 0.82, 0.08, 1.8, BASE, Z1, white);
  box(0.06, 0.82, 0.08, 3.0, BASE, Z1, white);
  box(1.26, 0.06, 0.08, 2.4, BASE + 0.82, Z1, white);
  box(1.6, 0.04, 0.7, 2.4, BASE + 0.95, Z1 + 0.3, white);
  const entryDoors = [-1, 1].map(function (side) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.76, 0.025), glassMat);
    d.add(new THREE.LineSegments(new THREE.EdgesGeometry(d.geometry), glassEdge));
    d.position.set(2.4 + side * 0.15, BASE + 0.38, Z1);
    building.add(d);
    return { mesh: d, side: side };
  });

  const shaftMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, depthWrite: false });
  const shaftH = FH * 4 + 0.45;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(SHAFT.w, shaftH, SHAFT.d), shaftMat);
  shaft.position.set(SHAFT.x, BASE + shaftH / 2, SHAFT.z);
  shaft.add(new THREE.LineSegments(new THREE.EdgesGeometry(shaft.geometry), new THREE.LineBasicMaterial({ color: 0xffffff })));
  building.add(shaft);
  box(SHAFT.w + 0.1, 0.06, SHAFT.d + 0.1, SHAFT.x, BASE + shaftH, SHAFT.z, white);

  const lamps = {};
  for (let k = 1; k <= 5; k++) {
    const y = floorY(k);
    const served = SERVED.indexOf(k) !== -1;
    box(SHAFT.w + 0.06, 0.035, 0.05, SHAFT.x, y - 0.035, FRONT_Z + 0.02, served ? white : dark);
    if (!served) continue;
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.03), new THREE.MeshBasicMaterial({ color: 0x555555 }));
    lamp.position.set(SHAFT.x + SHAFT.w / 2 + 0.14, y + 0.42, FRONT_Z - 0.1);
    building.add(lamp);
    lamps[k] = lamp;
  }

  [-1, 1].forEach(function (side) {
    box(0.03, shaftH, 0.04, SHAFT.x + side * (SHAFT.w / 2 - 0.03), BASE, SHAFT.z, wallMat);
  });

  const carMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2a2a2a, roughness: 0.5 });
  const car = sh(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.62, 0.5), carMat));
  edged(car);
  building.add(car);
  [-0.18, 0, 0.18].forEach(function (dx) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.5, 0.004), new THREE.MeshBasicMaterial({ color: 0x9a9a9a }));
    strip.position.set(dx, 0, 0.252);
    car.add(strip);
  });
  const counter = box(0.16, 0.32, 0.04, SHAFT.x - 0.16, 0, SHAFT.z - SHAFT.d / 2 + 0.04, dark);
  const cableGeo = new THREE.BufferGeometry();
  cableGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Array(12).fill(0), 3));
  building.add(new THREE.LineSegments(cableGeo, new THREE.LineBasicMaterial({ color: 0xbdbdbd })));
  const cableTop = BASE + shaftH;

  function setCar(y) {
    car.position.set(SHAFT.x, y + 0.33, SHAFT.z);
    const cw = floorY(1) + floorY(5) - y + 0.2;
    counter.position.y = cw;
    const p = cableGeo.attributes.position;
    p.setXYZ(0, SHAFT.x - 0.06, cableTop, SHAFT.z);
    p.setXYZ(1, SHAFT.x - 0.06, y + 0.64, SHAFT.z);
    p.setXYZ(2, SHAFT.x + 0.06, cableTop, SHAFT.z);
    p.setXYZ(3, SHAFT.x + 0.06, y + 0.64, SHAFT.z);
    p.needsUpdate = true;
  }

  (function () {
    box(12, 0.02, 1.1, 0, 0, 4.75, new THREE.MeshStandardMaterial({ color: 0x2a2a2a }), scene);
    box(0.7, 0.07, 0.2, 3.7, 0, 4.2, furnMat, scene);
    box(0.7, 0.1, 0.04, 3.7, 0.07, 4.12, furnMat, scene);
    box(0.03, 0.5, 0.03, 3.0, 0, 4.15, white, scene);
    box(0.2, 0.2, 0.02, 3.0, 0.5, 4.15, white, scene);
    const tp = [];
    for (let x = -5.5; x <= 5.5; x += 0.9) tp.push([x, 5.65]);
    for (let z = -2.5; z <= 3.5; z += 0.9) tp.push([-4.5, z], [4.6, z]);
    for (let x = -3.6; x <= 3.6; x += 0.9) tp.push([x, -2.9]);
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.02, 0.12, 6), new THREE.MeshStandardMaterial({ color: 0x777777 }), tp.length);
    const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshStandardMaterial({ color: 0xb5b5b5, flatShading: true }), tp.length);
    const m4 = new THREE.Matrix4();
    tp.forEach(function (p, i) {
      const s = 0.8 + ((i * 37) % 5) / 10;
      m4.makeScale(s, s, s);
      m4.setPosition(p[0], 0.06 * s, p[1]);
      trunks.setMatrixAt(i, m4);
      m4.setPosition(p[0], 0.22 * s, p[1]);
      crowns.setMatrixAt(i, m4);
    });
    crowns.castShadow = true;
    scene.add(trunks, crowns);
  })();

  const RY = 0.035;
  const pts = [
    [2.4, RY, 4.15],
    [2.4, BASE + RY, 2.6],
    [2.4, BASE + RY, 1.15],
    [SHAFT.x, BASE + RY, 1.15],
    [SHAFT.x, BASE + RY, SHAFT.z],
    [SHAFT.x, floorY(5) + RY, SHAFT.z],
    [SHAFT.x, floorY(5) + RY, 1.15],
    [SHAFT.x, floorY(5) + RY, 0.45],
    [-2.0, floorY(5) + RY, 0.45],
    [-2.0, floorY(5) + RY, -0.4],
    [-2.0, floorY(5) + RY, -0.95]
  ].map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });

  const path = new THREE.CurvePath();
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    path.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
    cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  }
  const total = cum[cum.length - 1];
  const TUBE_SEGS = 900;
  const RADIAL = 8;
  const routeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
  const routeGeo = new THREE.TubeGeometry(path, TUBE_SEGS, 0.045, RADIAL, false);
  const route = new THREE.Mesh(routeGeo, routeMat);
  routeGeo.setDrawRange(0, 0);
  building.add(route);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  building.add(head);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.16, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide }));
  halo.rotation.x = -Math.PI / 2;
  building.add(halo);

  const START = 2.4;
  const CYCLE = 13;
  const smooth = function (t) {
    t = Math.min(1, Math.max(0, t));
    return t * t * (3 - 2 * t);
  };
  const ease = function (t) {
    t = Math.min(1, Math.max(0, t));
    return 1 - Math.pow(1 - t, 3);
  };
  const lerp = function (a, b, t) { return a + (b - a) * t; };

  function carFloor(c) {
    if (c < 2.6) return 1;
    if (c < 4.4) return lerp(1, 3, smooth((c - 2.6) / 1.8));
    if (c < 5.4) return 3;
    if (c < 7.2) return lerp(3, 5, smooth((c - 5.4) / 1.8));
    if (c < 11.4) return 5;
    return lerp(5, 1, smooth((c - 11.4) / 1.6));
  }

  function headDist(c) {
    if (c < 2.6) return lerp(0, cum[4], smooth(c / 2.6));
    if (c < 7.2) return cum[4] + (floorY(carFloor(c)) - floorY(1));
    if (c < 9.4) return lerp(cum[5], total, smooth((c - 7.2) / 2.2));
    return total;
  }

  function story(t) {
    if (t < START) {
      routeGeo.setDrawRange(0, 0);
      head.visible = halo.visible = false;
      setCar(floorY(1));
      return;
    }
    const c = (t - START) % CYCLE;
    const fade = c < 11.4 ? 1 : 1 - smooth((c - 11.4) / 1.2);
    const d = headDist(c);
    const frac = d / total;
    routeGeo.setDrawRange(0, Math.floor(frac * TUBE_SEGS) * RADIAL * 6);
    routeMat.opacity = fade;

    const p = path.getPointAt(Math.min(0.9999, frac));
    const riding = c >= 2.6 && c < 7.2;
    head.visible = halo.visible = fade > 0.01 && !riding;
    head.position.set(p.x, p.y + 0.07, p.z);
    head.material.opacity = fade;
    const pulse = 1 + 0.35 * Math.sin(t * 5);
    halo.position.set(p.x, p.y + 0.005, p.z);
    halo.scale.setScalar(pulse);
    halo.material.opacity = fade * (0.9 - 0.4 * (pulse - 0.65));

    setCar(floorY(carFloor(c)));

    SERVED.forEach(function (k) {
      const near = Math.abs(carFloor(c) - k) < 0.04;
      lamps[k].material.color.setHex(near ? 0xffffff : 0x555555);
    });

    const stopped = c < 2.6 || (c > 4.4 && c < 5.4) || (c > 7.2 && c < 11.4);
    carMat.emissive.setHex(stopped ? 0x5a5a5a : 0x2a2a2a);

    const entryOpen = smooth((c - 0.7) / 0.4) * (1 - smooth((c - 2.2) / 0.5));
    entryDoors.forEach(function (d) {
      d.mesh.position.x = 2.4 + d.side * (0.15 + 0.3 * entryOpen);
    });

    const doorOpen = c < 11.4 ? smooth((c - 8.3) / 0.6) : 1 - smooth((c - 11.4) / 1.2);
    door512.rotation.y = 1.35 * doorOpen;

    const arrive = c < 9.0 ? 0 : (c < 11.4 ? smooth((c - 9.0) / 0.6) : fade);
    const g = Math.round(lerp(0x33, 0xe6, arrive));
    roomFloor.material.color.setRGB(g / 255, g / 255, g / 255);
  }

  let thetaBase = 0.3;
  let theta = thetaBase;
  let phi = 1.2;
  const dist = canvas.clientWidth < 760 ? 20 : 14;
  const target = new THREE.Vector3(0.6, 2.2, 0.3);
  let drag = false;
  let lx = 0;
  let ly = 0;
  let auto = true;
  let idle = 0;
  let sway = 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    phi = Math.min(1.45, Math.max(0.35, phi - (e.clientY - ly) * 0.005));
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
    const t = reduce ? START + 10 : elapsed;
    building.scale.y = Math.max(0.001, ease(t / 2));
    story(t);

    if (!drag && !auto && now - idle > 3000) {
      auto = true;
      thetaBase = theta - Math.sin(sway * 0.16) * 0.5;
    }
    if (auto && !reduce) {
      sway += dt;
      theta = thetaBase + Math.sin(sway * 0.16) * 0.5;
    }
    camera.position.set(
      target.x + Math.sin(theta) * Math.sin(phi) * dist,
      target.y + Math.cos(phi) * dist,
      target.z + Math.cos(theta) * Math.sin(phi) * dist
    );
    camera.lookAt(target);
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
