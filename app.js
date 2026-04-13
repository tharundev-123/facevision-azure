/* ============================================================
   FaceVision — app.js
   Azure Face API integration + UI logic
   ============================================================ */

// ── State ────────────────────────────────────────────────────
const state = {
  endpoint: '',
  apiKey: '',
  model: 'detection_03',
  imageBlob: null,
  imageUrl: '',
  connected: false,
  lastResults: null,
};

// ── DOM Refs ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const endpointInput   = $('azureEndpoint');
const keyInput        = $('azureKey');
const modelSelect     = $('detectionModel');
const saveBtn         = $('saveCredentials');
const detectBtn       = $('detectBtn');
const toggleKeyBtn    = $('toggleKey');
const fileInput       = $('fileInput');
const browseBtn       = $('browseBtn');
const uploadZone      = $('uploadZone');
const imageUrlInput   = $('imageUrl');
const connectionStatus= $('connectionStatus');
const connectionFeedback= $('connectionFeedback');
const resultsSection  = $('results');
const facesPanel      = $('facesPanel');
const emptyState      = $('emptyState');
const resultCanvas    = $('resultCanvas');
const canvasOverlay   = $('canvasOverlay');
const jsonOutput      = $('jsonOutput');
const copyJsonBtn     = $('copyJson');
const statFaces       = $('statFaces').querySelector('.stat-num');
const statTime        = $('statTime');
const statModel       = $('statModel');
const btnLoader       = $('btnLoader');
const toastEl         = $('toast');
const showLandmarks   = $('showLandmarks');

// ── Persisted credentials ────────────────────────────────────
(function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem('faceVisionCreds') || '{}');
    if (saved.endpoint) endpointInput.value = saved.endpoint;
    if (saved.key)      keyInput.value      = saved.key;
    if (saved.model)    modelSelect.value   = saved.model;
    if (saved.endpoint && saved.key) markConnected();
  } catch { /* ignore */ }
})();

// ── Toggle API key visibility ────────────────────────────────
toggleKeyBtn.addEventListener('click', () => {
  const isPass = keyInput.type === 'password';
  keyInput.type = isPass ? 'text' : 'password';
  toggleKeyBtn.querySelector('svg').style.opacity = isPass ? '0.5' : '1';
});

// ── Save + Validate Credentials ──────────────────────────────
saveBtn.addEventListener('click', async () => {
  const ep  = endpointInput.value.trim();
  const key = keyInput.value.trim();
  const model = modelSelect.value;

  if (!ep || !key) {
    showFeedback('Please fill in both endpoint and API key.', 'error');
    return;
  }

  const cleanEp = ep.replace(/^https?:\/\//, '').replace(/\/$/, '');

  saveBtn.classList.add('loading');
  saveBtn.disabled = true;

  try {
    // Validate by calling the face list API (lightweight probe)
    const probeUrl = `https://${cleanEp}/face/v1.0/facelists`;
    const res = await fetch(probeUrl, {
      method: 'GET',
      headers: { 'Ocp-Apim-Subscription-Key': key }
    });

    if (res.status === 200 || res.status === 404 || res.status === 403) {
      // 200 = success, 404 = resource not found (but credentials valid), 403 = key wrong
      if (res.status === 403) throw new Error('Invalid API key — check your subscription key.');
    }

    if (!res.ok && res.status !== 200 && res.status !== 404) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
    }

    state.endpoint  = cleanEp;
    state.apiKey    = key;
    state.model     = model;

    localStorage.setItem('faceVisionCreds', JSON.stringify({ endpoint: cleanEp, key, model }));
    markConnected();
    showFeedback('✓ Connected successfully', 'success');
    showToast('Azure credentials saved!', 'success');

  } catch (err) {
    markDisconnected();
    showFeedback(`✗ ${err.message}`, 'error');
    showToast(err.message, 'error');
  } finally {
    saveBtn.classList.remove('loading');
    saveBtn.disabled = false;
  }
});

function markConnected() {
  state.connected = true;
  connectionStatus.className = 'header-status connected';
  connectionStatus.querySelector('.status-text').textContent = 'Connected';
  enableDetect();
}
function markDisconnected() {
  state.connected = false;
  connectionStatus.className = 'header-status error';
  connectionStatus.querySelector('.status-text').textContent = 'Auth Failed';
}
function showFeedback(msg, type) {
  connectionFeedback.textContent = msg;
  connectionFeedback.className = `connection-feedback ${type}`;
}

// ── File Upload ──────────────────────────────────────────────
browseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
uploadZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) { showToast('Please upload an image file.', 'error'); return; }
  state.imageBlob = file;
  state.imageUrl  = '';
  imageUrlInput.value = '';
  uploadZone.querySelector('.upload-title').textContent = `✓ ${file.name}`;
  uploadZone.querySelector('.upload-sub').textContent   = formatBytes(file.size);
  uploadZone.style.borderColor = 'var(--green)';
  enableDetect();
}

function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1024/1024).toFixed(1)} MB`;
}

imageUrlInput.addEventListener('input', () => {
  if (imageUrlInput.value.trim()) {
    state.imageUrl  = imageUrlInput.value.trim();
    state.imageBlob = null;
    enableDetect();
  }
});

function enableDetect() {
  const hasImage = state.imageBlob || state.imageUrl;
  detectBtn.disabled = !(state.connected && hasImage);
}

// ── Detect Faces ─────────────────────────────────────────────
detectBtn.addEventListener('click', runDetection);

async function runDetection() {
  detectBtn.classList.add('loading');
  detectBtn.disabled = true;

  const ep    = state.endpoint || endpointInput.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const key   = state.apiKey   || keyInput.value.trim();
  const model = state.model    || modelSelect.value;

  const attrs = [...$$('.attr-check:checked')].map(c => c.value);

  const apiUrl = `https://${ep}/face/v1.0/detect?detectionModel=${model}&recognitionModel=recognition_04&returnFaceId=false&returnFaceLandmarks=false&returnFaceAttributes=${attrs.join(',')}`;

  const t0 = Date.now();

  try {
    let response;

    if (state.imageBlob) {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/octet-stream',
        },
        body: state.imageBlob,
      });
    } else {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: state.imageUrl }),
      });
    }

    const elapsed = Date.now() - t0;
    const data    = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(msg);
    }

    state.lastResults = data;
    renderResults(data, elapsed, model);
    showToast(`Detected ${data.length} face${data.length !== 1 ? 's' : ''}`, 'success');

  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    jsonOutput.textContent = `// Error:\n${JSON.stringify({ error: err.message }, null, 2)}`;
  } finally {
    detectBtn.classList.remove('loading');
    detectBtn.disabled = false;
  }
}

// ── Render Results ────────────────────────────────────────────
async function renderResults(faces, ms, model) {
  // Reveal section
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Summary stats
  statFaces.textContent = faces.length;
  statTime.textContent  = `${ms}ms`;
  statModel.textContent = model.replace('detection_', 'v');

  // JSON output
  jsonOutput.textContent = JSON.stringify(faces, null, 2);

  // Draw canvas
  await drawCanvas(faces);

  // Face cards
  facesPanel.innerHTML = '';
  if (faces.length === 0) {
    facesPanel.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>No faces detected in this image.</p>
      </div>`;
    return;
  }

  faces.forEach((face, i) => {
    const card = buildFaceCard(face, i);
    facesPanel.appendChild(card);
  });
}

// ── Canvas drawing ────────────────────────────────────────────
async function drawCanvas(faces) {
  const draw = showLandmarks.checked;
  canvasOverlay.classList.add('hidden');

  let imgSrc;
  if (state.imageBlob) {
    imgSrc = URL.createObjectURL(state.imageBlob);
  } else {
    imgSrc = state.imageUrl;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('Could not load image for canvas preview'));
    img.src = imgSrc;
  }).catch(err => console.warn(err));

  if (!img.complete || !img.naturalWidth) return;

  resultCanvas.width  = img.naturalWidth;
  resultCanvas.height = img.naturalHeight;
  const ctx = resultCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  if (!draw) return;

  const colors = ['#00d4ff','#00ffaa','#ffd166','#ff4a6b','#a78bfa','#fb923c'];

  faces.forEach((face, i) => {
    const { left, top, width, height } = face.faceRectangle;
    const col = colors[i % colors.length];

    // Box
    ctx.strokeStyle = col;
    ctx.lineWidth   = Math.max(2, img.naturalWidth * 0.003);
    ctx.strokeRect(left, top, width, height);

    // Corner accents
    const cLen = Math.min(width, height) * 0.18;
    ctx.lineWidth = Math.max(3, img.naturalWidth * 0.005);
    [[left, top], [left + width, top], [left, top + height], [left + width, top + height]].forEach(([x, y]) => {
      const dx = x === left ? 1 : -1;
      const dy = y === top  ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(x, y + dy * cLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * cLen, y);
      ctx.stroke();
    });

    // Label background
    const labelH = Math.max(22, img.naturalHeight * 0.035);
    const labelText = `FACE ${i + 1}`;
    ctx.font = `bold ${labelH * 0.7}px 'Syne', sans-serif`;
    const tw  = ctx.measureText(labelText).width + labelH * 0.8;
    ctx.fillStyle = col;
    ctx.fillRect(left, top - labelH, tw, labelH);

    ctx.fillStyle = '#000';
    ctx.font = `bold ${labelH * 0.68}px 'Syne', sans-serif`;
    ctx.fillText(labelText, left + labelH * 0.4, top - labelH * 0.28);
  });
}

// ── Face Card Builder ─────────────────────────────────────────
function buildFaceCard(face, i) {
  const card = document.createElement('div');
  card.className = 'face-card';
  card.style.animationDelay = `${i * 0.08}s`;

  const r    = face.faceRectangle;
  const attr = face.faceAttributes || {};

  let html = `<div class="face-num">// FACE ${i + 1} — pos: ${r.left},${r.top} — ${r.width}×${r.height}px</div>
  <div class="face-attrs">`;

  if (attr.age !== undefined) {
    html += attrRow('Age', `~${Math.round(attr.age)} years`);
  }
  if (attr.gender) {
    html += attrRow('Gender', capitalize(attr.gender), 'highlight');
  }
  if (attr.smile !== undefined) {
    html += attrRow('Smile', `${(attr.smile * 100).toFixed(0)}%`);
  }
  if (attr.glasses) {
    html += attrRow('Glasses', attr.glasses.replace(/Glasses/, '').trim() || 'None');
  }
  if (attr.blur) {
    html += attrRow('Blur', `${capitalize(attr.blur.blurLevel)} (${attr.blur.value.toFixed(2)})`);
  }
  if (attr.headPose) {
    const hp = attr.headPose;
    html += attrRow('Head Pose', `Yaw ${hp.yaw.toFixed(0)}° / Pitch ${hp.pitch.toFixed(0)}°`);
  }
  if (attr.facialHair) {
    const fh = attr.facialHair;
    const parts = [];
    if (fh.beard    > 0.1) parts.push(`Beard ${(fh.beard*100).toFixed(0)}%`);
    if (fh.moustache> 0.1) parts.push(`Moustache ${(fh.moustache*100).toFixed(0)}%`);
    if (fh.sideburns> 0.1) parts.push(`Sideburns ${(fh.sideburns*100).toFixed(0)}%`);
    html += attrRow('Facial Hair', parts.length ? parts.join(', ') : 'None');
  }

  // Emotions
  if (attr.emotion) {
    const emos = Object.entries(attr.emotion).sort((a,b) => b[1]-a[1]);
    html += `<div class="attr-row" style="margin-top:0.5rem"><span class="attr-key">Emotions</span></div>
    <div class="emotion-bar">`;
    emos.slice(0, 5).forEach(([name, val]) => {
      const pct = (val * 100).toFixed(0);
      html += `
        <div class="emotion-row">
          <span class="emotion-label">${capitalize(name)}</span>
          <div class="emotion-track"><div class="emotion-fill" style="width:${pct}%"></div></div>
          <span class="emotion-pct">${pct}%</span>
        </div>`;
    });
    html += '</div>';
  }

  html += '</div>';
  card.innerHTML = html;
  return card;
}

function attrRow(key, val, cls = '') {
  return `<div class="attr-row"><span class="attr-key">${key}</span><span class="attr-val ${cls}">${val}</span></div>`;
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// ── Copy JSON ─────────────────────────────────────────────────
copyJsonBtn.addEventListener('click', () => {
  const text = jsonOutput.textContent;
  navigator.clipboard.writeText(text).then(() => showToast('JSON copied!', 'success'));
});

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = '') {
  toastEl.textContent = msg;
  toastEl.className   = `toast show ${type}`;
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => { toastEl.className = 'toast'; }, 3200);
}

// ── Nav active state on scroll ────────────────────────────────
const navLinks = $$('.nav-link');
const sections = { dashboard: $('dashboard'), results: $('results') };

window.addEventListener('scroll', () => {
  const y = window.scrollY + 120;
  const inResults = sections.results && !sections.results.classList.contains('hidden')
    && y >= sections.results.offsetTop;

  navLinks.forEach(l => l.classList.remove('active'));
  if (inResults) {
    document.querySelector('a[href="#results"]').classList.add('active');
  } else {
    document.querySelector('a[href="#dashboard"]').classList.add('active');
  }
}, { passive: true });

// ── Initial state ─────────────────────────────────────────────
enableDetect();