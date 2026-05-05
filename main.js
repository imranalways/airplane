import { Controls } from './controls.js';
import { Terrain } from './terrain.js';
import { EntityManager } from './entities.js';
import { Renderer } from './renderer.js';
import { HUD } from './hud.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const controls = new Controls();
const renderer = new Renderer(canvas, ctx);
const hud = new HUD(canvas, ctx);
let terrain, entities;
let gameState = 'menu';
let state = {};
let animId = null;
let lastTime = 0;
let audioCtx = null;
let muted = false;

function initAudio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
}

function playSound(type) {
  if (muted || !audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    if (type === 'coin') {
      o.type = 'sine'; o.frequency.setValueAtTime(880, t);
      o.frequency.linearRampToValueAtTime(1320, t + 0.1);
      g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    } else if (type === 'fuel') {
      o.type = 'square'; o.frequency.setValueAtTime(440, t);
      o.frequency.linearRampToValueAtTime(660, t + 0.15);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.3);
    } else if (type === 'hit') {
      o.type = 'sawtooth'; o.frequency.setValueAtTime(220, t);
      o.frequency.linearRampToValueAtTime(50, t + 0.3);
      g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.start(t); o.stop(t + 0.4);
    } else if (type === 'warn') {
      o.type = 'square'; o.frequency.setValueAtTime(330, t);
      g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t); o.stop(t + 0.15);
    }
  } catch(e) {}
}

function initGame() {
  terrain = new Terrain();
  entities = new EntityManager();
  state = {
    camX: 0, camY: 0,
    camPitch: 0, camRoll: 0,
    altitude: 0.5,
    heading: 0,
    speed: 3,
    fuel: 1.0,
    lives: 3,
    score: 0,
    streak: 0,
    highScore: parseInt(localStorage.getItem('skyRiderHigh') || '0'),
    invincible: 0,
    shake: { x: 0, y: 0, t: 0 },
    frame: 0,
    biome: 'city'
  };
}

function updateGame(dt) {
  if (gameState !== 'playing') return;
  const s = state;
  s.frame++;

  const pitchSpd = 0.6 * dt, rollSpd = 0.5 * dt;
  if (controls.up) { s.camPitch -= pitchSpd; s.altitude = Math.min(1, s.altitude + dt * 0.4); }
  if (controls.down) { s.camPitch += pitchSpd; s.altitude = Math.max(0, s.altitude - dt * 0.4); }
  if (controls.left) { s.camRoll -= rollSpd; s.camX -= dt * 0.3; s.heading -= dt * 0.4; }
  if (controls.right) { s.camRoll += rollSpd; s.camX += dt * 0.3; s.heading += dt * 0.4; }
  if (!controls.left && !controls.right) s.camX *= 0.92;

  s.camPitch *= 0.88;
  s.camRoll *= 0.85;
  s.camX = Math.max(-3, Math.min(3, s.camX));
  s.altitude = Math.max(0, Math.min(1, s.altitude));
  s.camY = (s.altitude - 0.5) * -1.5;

  const boost = controls.boost ? 1.6 : 1;
  const fuelDrain = (0.008 + s.speed * 0.002) * boost * dt;
  s.fuel = Math.max(0, s.fuel - fuelDrain);

  if (s.frame % 1800 === 0) s.speed = Math.min(10, s.speed + 0.3);

  if (s.fuel <= 0) { endGame(); return; }
  if (s.fuel < 0.25 && s.frame % 60 === 0) playSound('warn');

  s.speed = controls.boost ? Math.min(10, s.speed * 1.01) : s.speed;
  terrain.speed = s.speed * (boost > 1 ? 1.5 : 1);
  entities.coinInterval = Math.max(40, 90 - s.score * 0.5);
  entities.obstInterval = Math.max(80, 180 - s.score * 0.3);

  terrain.update(dt);
  s.biome = terrain.biome;
  entities.update(dt, s.speed, s.biome, s.altitude);

  if (s.invincible > 0) s.invincible -= dt * 60;

  const col = entities.checkCollisions(s.camX, s.camY, s.invincible > 0);

  if (col.coins > 0) {
    s.streak++;
    const mult = Math.min(4, 1 + Math.floor(s.streak / 5));
    s.score += col.coins * mult;
    playSound('coin');
  } else if (!controls.up && !controls.down) {
    s.streak = Math.max(0, s.streak - 1);
  }

  if (col.fuel) { s.fuel = Math.min(1, s.fuel + 0.4); playSound('fuel'); }

  if (col.hit) {
    s.lives--;
    s.invincible = 120;
    s.shake.t = 40;
    s.streak = 0;
    playSound('hit');
    if (s.lives <= 0) { endGame(); return; }
  }

  if (s.shake.t > 0) {
    s.shake.t--;
    const intensity = s.shake.t * 0.3;
    s.shake.x = (Math.random() - 0.5) * intensity;
    s.shake.y = (Math.random() - 0.5) * intensity;
  } else { s.shake.x = 0; s.shake.y = 0; }

  if (s.score > s.highScore) { s.highScore = s.score; localStorage.setItem('skyRiderHigh', s.highScore); }
}

function drawGame() {
  const W = canvas.width, H = canvas.height;
  const panelH = Math.round(H * 0.18);
  const s = state;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (s.shake.x || s.shake.y) ctx.translate(s.shake.x, s.shake.y);

  renderer.drawSky(terrain, s.camPitch, W, H, panelH);
  renderer.drawTerrain(terrain, s.camPitch, s.camRoll, W, H, panelH);
  renderer.drawEntities(entities, s.camX, s.camY, W, H, panelH);
  renderer.drawCockpit(W, H, panelH, s.shake);
  ctx.restore();
  hud.draw({ ...s, biome: terrain.biome });
}

function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  updateGame(dt);
  if (gameState === 'playing' || gameState === 'paused') drawGame();
  animId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameState = 'gameover';
  document.getElementById('finalScore').textContent = `SCORE: ${state.score}`;
  document.getElementById('finalHigh').textContent = `BEST: ${state.highScore}`;
  document.getElementById('gameoverOverlay').classList.add('active');
}

document.getElementById('startBtn').addEventListener('click', () => {
  initAudio();
  initGame();
  gameState = 'playing';
  document.getElementById('overlay').classList.remove('active');
  lastTime = performance.now();
  if (animId) cancelAnimationFrame(animId);
  animId = requestAnimationFrame(gameLoop);
});

document.getElementById('resumeBtn').addEventListener('click', () => {
  gameState = 'playing';
  document.getElementById('pauseOverlay').classList.remove('active');
});

document.getElementById('restartBtn').addEventListener('click', () => {
  initGame();
  gameState = 'playing';
  document.getElementById('gameoverOverlay').classList.remove('active');
});

window.addEventListener('keydown', e => {
  if (e.code === 'KeyP') {
    if (gameState === 'playing') {
      gameState = 'paused';
      document.getElementById('pauseOverlay').classList.add('active');
    } else if (gameState === 'paused') {
      gameState = 'playing';
      document.getElementById('pauseOverlay').classList.remove('active');
    }
  }
  if (e.code === 'KeyM') { muted = !muted; }
});

initGame();
animId = requestAnimationFrame(gameLoop);
