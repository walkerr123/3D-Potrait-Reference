import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// ── STATE ─────────────────────────────────────────
let scene, camera, renderer, controls;
let currentMode = 'irl';
let lastAngleKey = '';
let searchTimeout = null;

// ── ANGLE MAP ─────────────────────────────────────
const ANGLES = [
  {
    key: 'front',
    label: 'Front View', degrees: '0°',
    desc: 'Direct frontal angle — reveals facial symmetry and proportions',
    pinterestIrl: 'https://in.pinterest.com/Kyliekeewee/photo-bashing/?invite_code=ab8520c8a3ed4c7896d272ccbb8465a3&sender=1065805205473485962',
    pinterestAnime: 'https://in.pinterest.com/eeriedeceit/front-facing-anime-pfp/?invite_code=0351da8e2c0c407f9980757a29fe58e6&sender=1065805205473485962',
    yawMin: -22, yawMax: 22, pitchMin: -20, pitchMax: 20,
  },
  {
    key: 'quarter_right',
    label: '3/4 Right View', degrees: '45°',
    desc: 'Three-quarter angle to the right — great for facial structure and nose bridge',
    pinterestIrl: 'https://in.pinterest.com/avernon/34-faces/?invite_code=6161e1370caf497b8db355d86ca25dfc&sender=1065805205473485962',
    pinterestAnime: 'https://in.pinterest.com/ltzmeow/anime-characters-34-faces/?invite_code=a23111a75116428b8ef56ce335190c8f&sender=1065805205473485962',
    yawMin: 22, yawMax: 68, pitchMin: -20, pitchMax: 20,
  },
  {
    key: 'profile_right',
    label: 'Side Profile Right', degrees: '90°',
    desc: 'Full side profile — jawline, nose silhouette, and ear placement',
    pinterestIrl: 'https://in.pinterest.com/stewartry/right-face/?invite_code=63764397760a4bfebb46b41e919a910b&sender=1065805205473485962',
    pinterestAnime: 'https://in.pinterest.com/wx1kerr/right-faced/?invite_code=eb03c924444e4b7c9c87cf22277e20f7&sender=1065805205473485962',
    yawMin: 68, yawMax: 112, pitchMin: -20, pitchMax: 20,
  },
  {
    key: 'back',
    label: 'Back View', degrees: '180°',
    desc: 'Rear view — back of head, hair and skull proportions',
    pinterestIrl: 'https://in.pinterest.com/naomiecsedii/back-faced-pfp/?invite_code=5f9eeea543eb4f7083bc5f21041589cb&sender=1065805205473485962',
    pinterestAnime: 'https://in.pinterest.com/wx1kerr/faced-back/?request_params=%7B%221%22%3A%20130%2C%20%227%22%3A%205969411380974793984%2C%20%228%22%3A%201065805136755718861%2C%20%2230%22%3A%20%22faced%20back%22%2C%20%2232%22%3A%2045%2C%20%2233%22%3A%20%5B1065805068083067217%2C%201065805068083067216%2C%201065805068083067214%2C%201065805068083067210%2C%201065805068083067207%2C%201065805068083067205%2C%201065805068083067203%2C%201065805068083067202%2C%201065805068083067199%2C%201065805068083066915%2C%201065805068083066876%5D%2C%20%2236%22%3A%20%5B1065805136755718861%5D%2C%20%2237%22%3A%20%22faced%20back%22%2C%20%2234%22%3A%200%2C%20%22102%22%3A%204%7D&full_feed_title=faced%20back&view_parameter_type=3069&pins_display=3', pitchMin: -20, pitchMax: 20,
  },
  {
    key: 'profile_left',
    label: 'Side Profile Left', degrees: '270°',
    desc: 'Full left side profile — jawline, nose silhouette',
    pinterestIrl: 'https://in.pinterest.com/stewartry/left-face/?invite_code=949138a2346042309bc459843962c4c2&sender=1065805205473485962',
    pinterestAnime: 'https://in.pinterest.com/wx1kerr/left-faced/?invite_code=3ebd4d5344c94a7abdefdd9c98d978e8&sender=1065805205473485962',
    yawMin: 248, yawMax: 292, pitchMin: -20, pitchMax: 20,
  },
  {
    key: 'quarter_left',
    label: '3/4 Left View', degrees: '315°',
    desc: 'Three-quarter angle to the left — facial structure reference',
    pinterestIrl: 'https://in.pinterest.com/avernon/34-faces/?invite_code=6161e1370caf497b8db355d86ca25dfc&sender=1065805205473485962',
    pinterestAnime: 'https://in.pinterest.com/ltzmeow/anime-characters-34-faces/?invite_code=a23111a75116428b8ef56ce335190c8f&sender=1065805205473485962',
    yawMin: 292, yawMax: 338, pitchMin: -20, pitchMax: 20,
  },
  // Back 3/4 — use back boards
  {
    key: 'back_quarter_right',
    label: 'Back 3/4 Right', degrees: '135°',
    desc: 'Back three-quarter view — skull shape and back of neck',
    pinterestIrl: 'https://pin.it/6Afdc6y7D',
    pinterestAnime: 'https://pin.it/4QfWPRyPU',
    yawMin: 112, yawMax: 157, pitchMin: -20, pitchMax: 20,
  },
  {
    key: 'back_quarter_left',
    label: 'Back 3/4 Left', degrees: '225°',
    desc: 'Back three-quarter view to the left',
    pinterestIrl: 'https://pin.it/6Afdc6y7D',
    pinterestAnime: 'https://pin.it/4QfWPRyPU',
    yawMin: 203, yawMax: 248, pitchMin: -20, pitchMax: 20,
  },
];

function getAngleData(yawDeg, pitchDeg) {
  const yaw = ((yawDeg % 360) + 360) % 360;
  for (const a of ANGLES) {
    if (yaw >= a.yawMin && yaw < a.yawMax) return a;
  }
  return ANGLES[0];
}

// ── INIT THREE.JS ──────────────────────────────────
function initScene() {
  const container = document.getElementById('canvasContainer');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0c10);
  scene.fog = new THREE.Fog(0x0b0c10, 8, 20);

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 100);
  camera.position.set(0, 1.6, 4.5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.4);
  keyLight.position.set(3, 6, 4);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
  fillLight.position.set(-4, 2, -2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x00e5a0, 0.3);
  rimLight.position.set(0, 4, -5);
  scene.add(rimLight);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.target.set(0, 1.4, 0);
  controls.minDistance = 1.5;
  controls.maxDistance = 8;
  controls.update();

  // Resize
  window.addEventListener('resize', () => {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  controls.addEventListener('change', onCameraChange);

  loadModel();
  animate();
}

// ── LOAD MODEL ─────────────────────────────────────
function loadModel() {
  const overlay = createLoadingOverlay();

  const loader = new FBXLoader();
  loader.load(
    'models/head.fbx',
    (fbx) => {
      // Auto-scale and center
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.5 / maxDim;
      fbx.scale.setScalar(scale);

      // Center horizontally, sit on origin
      box.setFromObject(fbx);
      const center = box.getCenter(new THREE.Vector3());
      fbx.position.sub(center);
      fbx.position.y += box.getSize(new THREE.Vector3()).y * 0.5;

      // Smooth materials
      fbx.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => { m.roughness = 0.7; m.metalness = 0.1; });
            } else {
              child.material.roughness = 0.7;
              child.material.metalness = 0.1;
            }
          }
        }
      });

      fbx.rotation.y = Math.PI; // flip to face camera
      scene.add(fbx);
      overlay.remove();
      triggerSearch();
    },
    (xhr) => {
      const pct = (xhr.loaded / (xhr.total || 1)) * 100;
      overlay.setProgress(Math.round(pct));
    },
    (err) => {
      console.warn('FBX load failed, using fallback head:', err);
      overlay.remove();
      loadFallbackHead();
      triggerSearch();
    }
  );
}

function loadFallbackHead() {
  // Simple stylised head using primitives (matches the Figma placeholder style)
  const group = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({ color: 0x8B5E3C, roughness: 0.8, metalness: 0.05 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2255aa, roughness: 0.3, metalness: 0.4 });

  // Skull
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), mat);
  skull.scale.set(1, 1.15, 0.95);
  skull.position.y = 0.1;
  group.add(skull);

  // Face lower
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 24), mat);
  face.scale.set(0.9, 0.8, 1);
  face.position.set(0, -0.2, 0.18);
  group.add(face);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.55, 20), mat);
  neck.position.y = -0.78;
  group.add(neck);

  // Ear tabs (stylised)
  [-1, 1].forEach(side => {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.28, 8, 12), darkMat);
    ear.rotation.z = Math.PI / 2;
    ear.position.set(side * 0.62, 0.08, -0.1);
    group.add(ear);
  });

  // Visor/blindfold
  const visorGeo = new THREE.BoxGeometry(0.9, 0.12, 0.35);
  const visor = new THREE.Mesh(visorGeo, darkMat);
  visor.position.set(0, 0.05, 0.35);
  visor.rotation.x = -0.1;
  group.add(visor);

  // Eyes
  [-1,1].forEach(side => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat);
    eye.position.set(side * 0.18, 0.05, 0.62);
    group.add(eye);
  });

  // Nose dot
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), mat);
  nose.position.set(0, -0.15, 0.62);
  group.add(nose);

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.18, 28), darkMat);
  base.position.y = -1.12;
  group.add(base);

  group.position.y = 1.4;
  scene.add(group);
}

function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'loadingOverlay';
  overlay.innerHTML = `
    <div id="loadingText">LOADING MODEL</div>
    <div id="loadingBar"><div id="loadingBarFill"></div></div>
  `;
  document.getElementById('canvasContainer').appendChild(overlay);

  overlay.setProgress = (pct) => {
    const fill = overlay.querySelector('#loadingBarFill');
    if (fill) fill.style.width = pct + '%';
  };
  overlay.remove = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.parentNode && overlay.parentNode.removeChild(overlay), 600);
  };
  return overlay;
}

// ── ANIMATE ────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ── CAMERA CHANGE → ANGLE DETECTION ───────────────
function onCameraChange() {
  const spherical = new THREE.Spherical().setFromVector3(
    camera.position.clone().sub(controls.target)
  );

  // yaw: horizontal rotation (azimuth) — negated to match model orientation
  let yawDeg = ((-THREE.MathUtils.radToDeg(spherical.theta)) + 180 + 360) % 360;
  // pitch: vertical tilt
  let pitchDeg = 90 - THREE.MathUtils.radToDeg(spherical.phi);

  updateCompass(yawDeg, pitchDeg);

  const angleData = getAngleData(yawDeg, pitchDeg);

  // Update UI
  document.getElementById('angleName').textContent = angleData.label;
  document.getElementById('angleDegrees').textContent = angleData.degrees;
  document.getElementById('angleDesc').textContent = angleData.desc;
  document.getElementById('compassAngleLabel').textContent = angleData.label.split(' ')[0].toUpperCase();

  if (angleData.key !== lastAngleKey) {
    lastAngleKey = angleData.key;
    // Debounce image search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchRefs(angleData), 400);
  }
}

// ── COMPASS DRAWING ────────────────────────────────
function updateCompass(yawDeg, pitchDeg) {
  const canvas = document.getElementById('compassCanvas');
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2, r = 34;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cardinal tick marks
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const inner = i % 2 === 0 ? r - 7 : r - 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Yaw indicator line
  const yawRad = (yawDeg - 90) * Math.PI / 180;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(yawRad) * (r - 4), cy + Math.sin(yawRad) * (r - 4));
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--green').trim() || '#00e5a0';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#00e5a0';
  ctx.fill();

  // Pitch arc
  const pitchNorm = Math.max(-1, Math.min(1, pitchDeg / 60));
  if (Math.abs(pitchDeg) > 5) {
    ctx.beginPath();
    ctx.arc(cx, cy, r - 10, -Math.PI / 2, -Math.PI / 2 + pitchNorm * Math.PI / 2);
    ctx.strokeStyle = 'rgba(0,229,160,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

const PEXELS_KEY = 'VCGnJuEsUVYESjj3cvAPFsYSINI3alfKGu0TjXZoUadgEs2xn9xi9ypE';

const PEXELS_QUERIES = {
  front:              { irl: 'front face portrait',         anime: 'anime front face' },
  quarter_right:      { irl: 'three quarter face portrait', anime: 'anime three quarter face' },
  profile_right:      { irl: 'side profile face right',     anime: 'anime side profile' },
  back:               { irl: 'back of head portrait',       anime: 'anime back head' },
  profile_left:       { irl: 'side profile face left',      anime: 'anime side profile left' },
  quarter_left:       { irl: 'three quarter face portrait', anime: 'anime three quarter face' },
  back_quarter_right: { irl: 'back of head portrait',       anime: 'anime back head' },
  back_quarter_left:  { irl: 'back of head portrait',       anime: 'anime back head' },
};

async function fetchRefs(angleData) {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '<div class="imgSkeleton"></div><div class="imgSkeleton"></div><div class="imgSkeleton"></div><div class="imgSkeleton"></div>';

  const q = PEXELS_QUERIES[angleData.key];
  const query = encodeURIComponent(currentMode === 'irl' ? q.irl : q.anime);

  try {
    const res = await fetch(`/api/pexels?query=${query}`);
    const data = await res.json();
    console.log('pexels data:', data);
    grid.innerHTML = '';
    data.photos.forEach(photo => {
      const img = document.createElement('img');
      img.src = photo.src.medium;
      img.alt = angleData.label;
      img.loading = 'lazy';
      img.onclick = () => window.open(photo.url, '_blank');
      grid.appendChild(img);
    });
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--muted);padding:16px">Failed to load images</p>';
  }
}

function triggerSearch() {
  const angleData = ANGLES[0]; // Default to front
  fetchRefs(angleData);
}

// ── MODE TOGGLE ────────────────────────────────────
document.querySelectorAll('.modeBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modeBtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;

    document.getElementById('modeTag').textContent = currentMode.toUpperCase() + ' MODE';

    if (currentMode === 'anime') {
      document.body.classList.add('anime-mode');
    } else {
      document.body.classList.remove('anime-mode');
    }

    // Re-fetch with new mode
    lastAngleKey = ''; // force refresh
    onCameraChange();
  });
});

// ── HELP MODAL ─────────────────────────────────────
document.getElementById('helpBtn').addEventListener('click', () => {
  document.getElementById('helpModal').classList.add('open');
});
document.getElementById('helpClose').addEventListener('click', () => {
  document.getElementById('helpModal').classList.remove('open');
});
document.getElementById('helpModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

// ── KICK OFF ───────────────────────────────────────
initScene();