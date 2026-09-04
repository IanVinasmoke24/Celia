/* ===================================
   CELIA APP - JAVASCRIPT PRINCIPAL
   =================================== */

'use strict';

// ── TIEMPO EN BARRA DE ESTADO ──────────────────────────────────────────────
function updateTime() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const el = document.getElementById('status-time');
  if (el) el.textContent = `${h}:${m}`;
}
updateTime();
setInterval(updateTime, 30000);

// ── NAVEGACIÓN DE PANTALLAS ────────────────────────────────────────────────
function switchScreen(screenId) {
  // Desactivar todas las pantallas y botones nav
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  // Activar pantalla target
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    screen.scrollTop = 0;
  }

  // Activar botón nav correspondiente
  const btn = document.querySelector(`[data-screen="${screenId}"]`);
  if (btn) btn.classList.add('active');
}

// ── SIGNOS VITALES EN TIEMPO REAL ──────────────────────────────────────────
const vitalsState = {
  hr:    72,
  bpSys: 118,
  bpDia: 76,
  sugar: 95,
  o2:    97,
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fluctuate(current, min, max, delta) {
  let next = current + randomBetween(-delta, delta);
  return Math.max(min, Math.min(max, next));
}

function updateVitals() {
  vitalsState.hr    = fluctuate(vitalsState.hr,    60, 85,  2);
  vitalsState.bpSys = fluctuate(vitalsState.bpSys, 110, 135, 3);
  vitalsState.bpDia = fluctuate(vitalsState.bpDia, 70,  88,  2);
  vitalsState.sugar = fluctuate(vitalsState.sugar,  85, 120, 3);
  vitalsState.o2    = fluctuate(vitalsState.o2,     94, 99,  1);

  // Actualizar todos los elementos que muestran vitales
  document.querySelectorAll('.vital-hr').forEach(el => { el.textContent = vitalsState.hr; });
  document.querySelectorAll('.vital-bp').forEach(el => { el.textContent = `${vitalsState.bpSys}/${vitalsState.bpDia}`; });
  document.querySelectorAll('.vital-sugar').forEach(el => { el.textContent = vitalsState.sugar; });
  document.querySelectorAll('.vital-o2').forEach(el => { el.textContent = vitalsState.o2; });

  // Actualizar sparklines aleatorias
  updateSparklines();
}

function updateSparklines() {
  document.querySelectorAll('.sparkline svg').forEach(svg => {
    const poly = svg.querySelector('polyline');
    if (!poly) return;
    const w = 120, h = 30, pts = 13;
    const points = Array.from({length: pts}, (_, i) => {
      const x = (i / (pts - 1)) * w;
      const y = randomBetween(5, 25);
      return `${x.toFixed(1)},${y}`;
    }).join(' ');
    poly.setAttribute('points', points);
  });
}

setInterval(updateVitals, 3000);

// ── ANIMACIÓN EKG ──────────────────────────────────────────────────────────
let ekgOffset = 0;
const EKG_BASE = [
  [0,30],[25,30],[35,30],[40,5],[45,55],[50,30],[60,30],
  [85,30],[95,30],[100,8],[105,52],[110,30],[120,30],
  [145,30],[155,30],[160,10],[165,50],[170,30],[180,30],
  [205,30],[215,30],[220,6],[225,54],[230,30],[240,30],
  [265,30],[275,30],[280,8],[285,52],[290,30],[300,30],
  [325,30],[335,30],[340,10],[345,50],[350,30],
];

function animateEKG() {
  const line = document.getElementById('ekg-line');
  const glow = document.getElementById('ekg-glow-line');
  if (!line || !glow) return;

  ekgOffset = (ekgOffset + 1.5) % 60;

  const shifted = EKG_BASE.map(([x, y]) => {
    const noise = (Math.random() - 0.5) * 1.5;
    return `${x},${(y + noise).toFixed(1)}`;
  });

  const pts = shifted.join(' ');
  line.setAttribute('points', pts);
  glow.setAttribute('points', pts);
}

setInterval(animateEKG, 80);

// ── FILTRO DE SERVICIOS ────────────────────────────────────────────────────
function filterServices(category, tabEl) {
  // Actualizar tabs activos
  document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');

  // Filtrar cards
  document.querySelectorAll('.service-card').forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = '';
      card.style.animation = 'fadeIn 0.3s ease';
    } else {
      card.style.display = 'none';
    }
  });
}

// ── PANTALLAS DE SERVICIO (REEMPLAZAN AL MODAL VIEJO) ──────────────────────
let activeSvcScreen = null;
let cart = {};
let cartTotal = 0;
let currentSvcType = null;

function openModal(type) {
  currentSvcType = type;
  document.getElementById('svc-overlay').style.pointerEvents = 'auto';
  const screen = document.getElementById(`svc-${type}`);
  if (screen) {
    screen.classList.add('open');
    activeSvcScreen = screen;
  }
  
  // Reset cart when opening
  cart = {};
  cartTotal = 0;
  calcTotal();
  document.querySelectorAll('.qty-num').forEach(el => el.textContent = '0');
}

function closeSvcScreen() {
  if (activeSvcScreen) {
    activeSvcScreen.classList.remove('open');
    activeSvcScreen = null;
  }
  document.getElementById('svc-overlay').style.pointerEvents = 'none';
  document.getElementById('cart-bar').classList.remove('show');
}

// ── LÓGICA DiDi ──
function selectDest(name) {
  document.getElementById('didi-dest-text').textContent = name;
  document.getElementById('didi-dest-text').classList.remove('muted');
}
function selectCar(type) {
  document.querySelectorAll('.car-type').forEach(el => el.classList.remove('selected'));
  document.getElementById(`car-${type}`).classList.add('selected');
}
function confirmDidi() {
  closeSvcScreen();
  setTimeout(() => showToast('car', 'DiDi Solicitado', 'Tu conductor llega en ~8 min'), 300);
}

function confirmCuidador() {
  closeSvcScreen();
  setTimeout(() => showToast('user', 'Visita Confirmada', 'Ana García llegará el viernes a las 10:00'), 300);
}

// ── LÓGICA DE CARRITO (Super, Comida, Farma) ──
function changeQty(btn, delta) {
  const ctrl = btn.closest('.product-qty-ctrl');
  const name = ctrl.dataset.name;
  const price = parseFloat(ctrl.dataset.price);
  const numSpan = ctrl.querySelector('.qty-num');
  
  let current = cart[name] ? cart[name].qty : 0;
  let next = current + delta;
  if (next < 0) next = 0;
  
  cart[name] = { qty: next, price: price };
  numSpan.textContent = next;
  
  calcTotal();
}

function calcTotal() {
  let count = 0;
  cartTotal = 0;
  for (let key in cart) {
    count += cart[key].qty;
    cartTotal += cart[key].qty * cart[key].price;
  }
  
  const cartBar = document.getElementById('cart-bar');
  if (count > 0) {
    cartBar.classList.add('show');
    document.getElementById('cart-count').textContent = count;
    document.getElementById('cart-total').textContent = `$${cartTotal.toFixed(2)}`;
  } else {
    cartBar.classList.remove('show');
  }
}

function confirmOrder() {
  closeSvcScreen();
  const types = { super: ['cart', 'Pedido Confirmado', 'Walmart entrega en ~45 min'], comida: ['food', 'Comida Ordenada', 'Entrega en ~40 min'], farma: ['pill', 'Medicinas Ordenadas', 'Entrega en ~30 min'] };
  const msg = types[currentSvcType] || ['check', 'Orden confirmada', 'En camino'];
  setTimeout(() => showToast(msg[0], msg[1], msg[2]), 300);
}

function activateCatTab(btn) {
  const tabs = btn.parentElement.querySelectorAll('.cat-tab');
  tabs.forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

function selectSlot(el) {
  document.querySelectorAll('.visit-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}


// ── ICONOS SVG PARA TOAST Y MODALS ────────────────────────────────────────
const SVG_ICONS = {
  check:  `<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  info:   `<svg viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>`,
  warn:   `<svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 20.5 2 20.5 12 2"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  notif:  `<svg viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  car:    `<svg viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="10" width="22" height="8" rx="2"/><path d="M5 10l2-5h10l2 5"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>`,
  cart:   `<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  pill:   `<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>`,
  food:   `<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg>`,
  user:   `<svg viewBox="0 0 24 24" fill="none" stroke="#9333EA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
  phone:  `<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.1 6.1l1.06-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  star:   `<svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

// ── TOAST NOTIFICATION ─────────────────────────────────────────────────────
let toastTimer = null;

function showToast(type, title, sub) {
  const toast = document.getElementById('toast');
  const iconEl = document.getElementById('toast-icon');
  document.getElementById('toast-title').textContent = title || '';
  document.getElementById('toast-sub').textContent   = sub   || '';

  iconEl.innerHTML = SVG_ICONS[type] || SVG_ICONS['info'];

  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 3500);
}

function hideToast() {
  document.getElementById('toast').classList.remove('show');
}


// ── ESTADO DE LLAMADA ──────────────────────────────────────────────────────
let callActive = false;
let callInterval = null;
let callSeconds = 0;

function toggleCall() {
  const btn = document.getElementById('call-btn');
  const label = document.getElementById('call-label');

  if (!callActive) {
    // Iniciar llamada
    callActive = true;
    callSeconds = 0;
    btn.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
    btn.innerHTML = `<svg viewBox="0 0 24 24" stroke-width="2" style="width:32px;height:32px;stroke:white;fill:none;transform:rotate(135deg)"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.1 6.1l1.06-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
    label.textContent = 'En llamada con Celia...';
    label.style.color = 'var(--red-light)';

    showToast('📞', 'Llamada Iniciada', 'Conectando con Celia de Abuelita Rosa...');

    callInterval = setInterval(() => {
      callSeconds++;
      const m = Math.floor(callSeconds / 60).toString().padStart(2, '0');
      const s = (callSeconds % 60).toString().padStart(2, '0');
      label.textContent = `En llamada con Celia · ${m}:${s}`;
    }, 1000);

  } else {
    // Terminar llamada
    callActive = false;
    clearInterval(callInterval);
    btn.style.background = '';
    btn.innerHTML = `<svg viewBox="0 0 24 24" stroke-width="2" style="width:32px;height:32px;stroke:white;fill:none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.1 6.1l1.06-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

    const duration = callSeconds;
    const m = Math.floor(duration / 60);
    const s = duration % 60;
    label.textContent = 'Toca para llamar a la bocina Celia';
    label.style.color = '';
    showToast('📞', 'Llamada Terminada', `Duración: ${m}:${s.toString().padStart(2,'0')} min`);
  }
}

// ── DETALLE DE SIGNO VITAL ─────────────────────────────────────────────────
const vitalDetails = {
  heart: {
    icon: '❤️',
    name: 'Frecuencia Cardíaca',
    value: () => `${vitalsState.hr} BPM`,
    range: 'Normal: 60–100 BPM',
    status: () => vitalsState.hr >= 60 && vitalsState.hr <= 100 ? '✅ Normal' : '⚠️ Revisar',
    tip: 'La frecuencia cardíaca de Rosa está dentro del rango saludable para su edad.',
  },
  bp: {
    icon: '🩺',
    name: 'Presión Arterial',
    value: () => `${vitalsState.bpSys}/${vitalsState.bpDia} mmHg`,
    range: 'Normal: < 130/80 mmHg',
    status: () => vitalsState.bpSys < 130 ? '✅ Normal' : '⚠️ Elevada',
    tip: 'Monitorear con atención si la sistólica supera 140 mmHg.',
  },
  sugar: {
    icon: '🩸',
    name: 'Glucosa en Sangre',
    value: () => `${vitalsState.sugar} mg/dL`,
    range: 'Normal en ayunas: 70–100 mg/dL',
    status: () => vitalsState.sugar <= 100 ? '✅ Normal' : '⚠️ Elevada',
    tip: 'Es importante revisar la glucosa después de cada comida.',
  },
  o2: {
    icon: '💨',
    name: 'Saturación de Oxígeno',
    value: () => `${vitalsState.o2}%`,
    range: 'Normal: 95–100%',
    status: () => vitalsState.o2 >= 95 ? '✅ Normal' : '⚠️ Baja',
    tip: 'Si baja de 92%, contacta a un médico inmediatamente.',
  },
  temp: {
    icon: '🌡️',
    name: 'Temperatura',
    value: () => '36.5°C',
    range: 'Normal: 36.0–37.5°C',
    status: () => '✅ Normal',
    tip: 'Temperatura corporal en rango normal. Sin signos de fiebre.',
  },
  sleep: {
    icon: '😴',
    name: 'Calidad del Sueño',
    value: () => '6.2 horas',
    range: 'Recomendado: 7–9 horas',
    status: () => '⚠️ Bajo lo recomendado',
    tip: 'Rosa durmió menos de lo ideal. Considera revisar su rutina nocturna.',
  },
};

function showVitalDetail(type) {
  const d = vitalDetails[type];
  if (!d) return;

  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <span class="modal-confirm-icon">${d.icon}</span>
    <div class="modal-title">${d.name}</div>
    <div class="modal-sub">${d.tip}</div>
    <div style="margin-bottom:16px;">
      <div class="modal-detail-row">
        <span class="mdr-label">Lectura actual</span>
        <span class="mdr-value">${d.value()}</span>
      </div>
      <div class="modal-detail-row">
        <span class="mdr-label">Rango normal</span>
        <span class="mdr-value">${d.range}</span>
      </div>
      <div class="modal-detail-row">
        <span class="mdr-label">Estado</span>
        <span class="mdr-value">${d.status()}</span>
      </div>
      <div class="modal-detail-row">
        <span class="mdr-label">Dispositivo</span>
        <span class="mdr-value">Bocina Celia · Activa</span>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="closeModal()">Cerrar</button>
      <button class="btn-primary" onclick="closeModal();showToast('📋','Reporte Generado','Enviado a tu correo')">Ver Historial</button>
    </div>
  `;

  document.getElementById('overlay').classList.add('open');
}

// ── CERRAR MODAL CON ESCAPE ────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ── SIMULACIÓN DE ALERTA EN TIEMPO REAL ───────────────────────────────────
// Cada 45 segundos muestra una alerta simulada de Celia
const celiaPhrases = [
  ['🎵', 'Celia activa', 'Rosa pidió: "Pon música de los 60\'s"'],
  ['💊', 'Recordatorio enviado', 'Celia le recordó a Rosa tomar su medicamento'],
  ['🌡️', 'Temperatura medida', 'Rosa tiene 36.4°C — Todo bien'],
  ['💬', 'Rosa habló con Celia', '"Celia, ¿a qué hora viene María?"'],
  ['❤️', 'Signos vitales OK', 'Lectura automática completada — Normal'],
];
let phraseIdx = 0;

setInterval(() => {
  const phrases = [
    ['notif', 'Celia activa', 'Rosa pidió música de los 60s'],
    ['pill',  'Recordatorio enviado', 'Celia recordó el medicamento'],
    ['check', 'Temperatura medida', 'Rosa tiene 36.4°C — Normal'],
    ['notif', 'Rosa habló con Celia', '"¿A qué hora viene María?"'],
    ['check', 'Signos vitales OK', 'Lectura automática completada'],
  ];
  const p = phrases[phraseIdx % phrases.length];
  showToast(p[0], p[1], p[2]);
  phraseIdx++;
}, 45000);

// ── INIT ───────────────────────────────────────────────────────────────────
// Saludo inicial
setTimeout(() => {
  showToast('notif', '¡Bienvenida, María!', 'Rosa está bien — Celia activa');
}, 1200);

// ── FAKE PREMIUM VIDEO CALL ────────────────────────────────────────────────

function startFakePremiumCall() {
  const overlay = document.getElementById('premium-call-overlay');
  if (overlay) {
    document.getElementById('pcall-incoming').style.display = 'flex';
    document.getElementById('pcall-active').style.display = 'none';
    overlay.classList.add('active');
  }
}

async function acceptFakePremiumCall() {
  document.getElementById('pcall-incoming').style.display = 'none';
  document.getElementById('pcall-active').style.display = 'flex';
  
  // Iniciar timer
  callSeconds = 0;
  const timerEl = document.getElementById('pcall-timer');
  timerEl.textContent = '00:00';
  callTimer = setInterval(() => {
    callSeconds++;
    const m = Math.floor(callSeconds / 60).toString().padStart(2, '0');
    const s = (callSeconds % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }, 1000);

  // Intentar abrir cámara
  try {
    callStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const video = document.getElementById('pcall-video');
    if (video) {
      video.srcObject = callStream;
    }
  } catch (err) {
    console.error("No se pudo acceder a la cámara:", err);
    showToast('info', 'Cámara no disponible', 'Verifica los permisos de tu navegador');
  }
}

function endFakePremiumCall() {
  const overlay = document.getElementById('premium-call-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
  
  if (callTimer) {
    clearInterval(callTimer);
    callTimer = null;
  }
  
  if (callStream) {
    callStream.getTracks().forEach(track => track.stop());
    callStream = null;
  }
  
  const video = document.getElementById('pcall-video');
  if (video) video.srcObject = null;
  
  setTimeout(() => showToast('check', 'Llamada Finalizada', 'Plan Premium activo'), 500);
}
