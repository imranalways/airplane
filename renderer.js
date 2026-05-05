export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.clouds = [];
    this.stars = Array.from({length: 80}, () => ({
      x: Math.random(), y: Math.random() * 0.5,
      r: Math.random() * 1.5 + 0.5, twinkle: Math.random() * Math.PI * 2
    }));
    this.frame = 0;
    this._initClouds();
  }

  _initClouds() {
    for (let i = 0; i < 12; i++) {
      this.clouds.push({
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 2,
        z: Math.random(),
        w: 0.4 + Math.random() * 0.8,
        h: 0.1 + Math.random() * 0.2,
        speed: 0.003 + Math.random() * 0.004
      });
    }
  }

  project(x, y, z, W, H, panelH) {
    const fov = 1.2;
    const cx = W / 2, cy = (H - panelH) / 2;
    const scale = fov / (fov + z);
    return {
      sx: cx + x * scale * W * 0.5,
      sy: cy + y * scale * (H - panelH) * 0.5,
      scale
    };
  }

  drawSky(terrain, camPitch, W, H, panelH) {
    const { ctx } = this;
    const skyH = H - panelH;
    const horizonY = skyH * 0.5 + camPitch * skyH * 0.3;

    const sky1 = terrain.getColor('sky1');
    const sky2 = terrain.getColor('sky2');

    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, sky1);
    skyGrad.addColorStop(1, sky2);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY);

    if (terrain.biome === 'city') {
      this.stars.forEach(s => {
        s.twinkle += 0.04;
        const alpha = 0.4 + Math.sin(s.twinkle) * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * horizonY, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, skyH);
    groundGrad.addColorStop(0, terrain.getColor('ground'));
    groundGrad.addColorStop(1, this._darken(terrain.getColor('ground'), 0.5));
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, W, skyH - horizonY);

    return horizonY;
  }

  _darken(color, factor) {
    const m = color.match(/\d+/g);
    if (!m) return color;
    return `rgb(${Math.round(m[0]*factor)},${Math.round(m[1]*factor)},${Math.round(m[2]*factor)})`;
  }

  drawTerrain(terrain, camPitch, camRoll, W, H, panelH) {
    const { ctx } = this;
    const skyH = H - panelH;
    const horizonY = skyH * 0.5 + camPitch * skyH * 0.3;
    const rows = 28;
    const roadW = 0.12;

    for (let i = rows; i >= 1; i--) {
      const t = i / rows;
      const z = t * t * 6;
      const scale = 1 / (1 + z * 0.8);
      const y1 = horizonY + (i / rows) * (skyH - horizonY);
      const y2 = horizonY + ((i + 1) / rows) * (skyH - horizonY);
      const xOff = Math.sin(camRoll) * (1 - t) * W * 0.1;

      const alpha = Math.min(1, t * 1.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = terrain.getColor('ground');
      ctx.fillRect(xOff, y1, W, y2 - y1);

      const roadLeft = W / 2 - roadW * W * scale + xOff;
      const roadRight = W / 2 + roadW * W * scale + xOff;
      ctx.fillStyle = terrain.getColor('road');
      ctx.fillRect(roadLeft, y1, roadRight - roadLeft, y2 - y1 + 1);

      if (i % 3 === 0 && terrain.biome !== 'rural') {
        const dashW = (roadRight - roadLeft) * 0.04;
        const dCX = (roadLeft + roadRight) / 2;
        ctx.fillStyle = terrain.getColor('stripe');
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillRect(dCX - dashW / 2, y1, dashW, y2 - y1);
      }

      ctx.globalAlpha = 1;
    }

    this._drawLandmarks(terrain, camPitch, camRoll, W, H, panelH, horizonY);
    this._drawClouds(terrain, camPitch, camRoll, W, H, panelH);

    const fogGrad = ctx.createLinearGradient(0, horizonY - 30, 0, horizonY + 30);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(0.5, terrain.getColor('fog') + '88');
    fogGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, horizonY - 30, W, 60);
  }

  _drawLandmarks(terrain, camPitch, camRoll, W, H, panelH, horizonY) {
    const { ctx } = this;
    const skyH = H - panelH;
    const cx = W / 2;

    terrain.landmarks.forEach(lm => {
      const t = Math.max(0.01, lm.progress);
      const scale = 1 / (1 + (1 - t) * 5);
      const screenY = horizonY + (1 - t) * (skyH - horizonY) * 0.95;
      const screenX = cx + lm.side * (cx * 0.7 + lm.data.offset) * (1 - (1 - t) * 0.8);
      const h = lm.data.h * scale * (H / 600);
      const w = lm.data.w * scale * (W / 800);

      if (screenY - h > skyH || scale < 0.05) return;

      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 3);

      switch (lm.type) {
        case 'skyscraper': this._drawSkyscraper(screenX, screenY, w, h, lm.data); break;
        case 'tower': this._drawTower(screenX, screenY, w * 0.5, h * 1.3, lm.data); break;
        case 'barn': this._drawBarn(screenX, screenY, w * 1.2, h * 0.6, lm.data); break;
        case 'windmill': this._drawWindmill(screenX, screenY, w * 0.6, h, lm.data); break;
        case 'hill': this._drawHill(screenX, screenY, w * 2, h * 0.5, lm.data); break;
        case 'farm': this._drawFarm(screenX, screenY, w * 1.5, h * 0.5, lm.data); break;
        case 'tree': this._drawTree(screenX, screenY, w * 0.7, h * 0.8, lm.data); break;
        case 'mountain': this._drawMountain(screenX, screenY, w * 2.5, h * 1.2, lm.data); break;
        case 'treeline': this._drawTreeline(screenX, screenY, w * 3, h * 0.6, lm.data); break;
        default: break;
      }

      ctx.restore();
    });
  }

  _drawSkyscraper(x, y, w, h, d) {
    const { ctx } = this;
    ctx.fillStyle = d.color;
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = 'rgba(255,220,100,0.3)';
    const rows = Math.max(2, Math.round(h / 12));
    const cols = Math.max(1, Math.round(w / 10));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.3) {
          ctx.fillRect(x - w / 2 + c * (w / cols) + 2, y - h + r * (h / rows) + 2, w / cols - 4, h / rows - 4);
        }
      }
    }
    ctx.fillStyle = '#f44';
    ctx.beginPath(); ctx.arc(x, y - h - 6, 3, 0, Math.PI * 2); ctx.fill();
  }

  _drawTower(x, y, w, h, d) {
    const { ctx } = this;
    ctx.fillStyle = '#555';
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = '#333';
    ctx.fillRect(x - w * 0.1, y - h * 1.3, w * 0.2, h * 0.3);
    ctx.fillStyle = '#f44';
    ctx.beginPath(); ctx.arc(x, y - h * 1.3 - 5, 4, 0, Math.PI * 2); ctx.fill();
  }

  _drawBarn(x, y, w, h, d) {
    const { ctx } = this;
    ctx.fillStyle = '#8B2500';
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = '#5a1500';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h);
    ctx.lineTo(x, y - h - h * 0.5);
    ctx.lineTo(x + w / 2, y - h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - w * 0.15, y - h * 0.5, w * 0.3, h * 0.4);
  }

  _drawWindmill(x, y, w, h, d) {
    const { ctx } = this;
    ctx.fillStyle = '#ccc';
    ctx.fillRect(x - w * 0.15, y - h, w * 0.3, h);
    const ang = (Date.now() / 1000) % (Math.PI * 2);
    ctx.strokeStyle = '#999'; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const a = ang + i * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + Math.cos(a) * h * 0.35, y - h + Math.sin(a) * h * 0.35);
      ctx.stroke();
    }
  }

  _drawHill(x, y, w, h, d) {
    const { ctx } = this;
    ctx.fillStyle = '#3a6b30';
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h, 0, Math.PI, 0);
    ctx.fill();
  }

  _drawFarm(x, y, w, h, d) {
    const { ctx } = this;
    ctx.fillStyle = '#5a8a30';
    ctx.fillRect(x - w / 2, y - h * 0.3, w, h * 0.3);
    ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const fx = x - w / 2 + i * w / 3;
      ctx.beginPath(); ctx.moveTo(fx, y - h * 0.3); ctx.lineTo(fx, y); ctx.stroke();
    }
  }

  _drawTree(x, y, w, h, d) {
    const { ctx } = this;
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(x - w * 0.08, y - h * 0.35, w * 0.16, h * 0.35);
    ctx.fillStyle = '#2a6a20';
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.65, w * 0.4, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawMountain(x, y, w, h, d) {
    const { ctx } = this;
    ctx.fillStyle = '#4a5a3a';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x, y - h);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.12, y - h * 0.7);
    ctx.lineTo(x, y - h);
    ctx.lineTo(x + w * 0.12, y - h * 0.7);
    ctx.closePath(); ctx.fill();
  }

  _drawTreeline(x, y, w, h, d) {
    const { ctx } = this;
    for (let i = 0; i < 6; i++) {
      const tx = x - w / 2 + i * w / 5 + Math.sin(i * 1.7) * w * 0.06;
      const th = h * (0.7 + Math.sin(i * 2.3) * 0.3);
      ctx.fillStyle = '#1a4a10';
      ctx.beginPath();
      ctx.moveTo(tx - w * 0.08, y);
      ctx.lineTo(tx, y - th);
      ctx.lineTo(tx + w * 0.08, y);
      ctx.closePath(); ctx.fill();
    }
  }

  _drawClouds(terrain, camPitch, camRoll, W, H, panelH) {
    const { ctx } = this;
    const skyH = H - panelH;
    const cx = W / 2, cy = skyH / 2;

    this.clouds.forEach(c => {
      c.z -= c.speed;
      if (c.z < 0) { c.z = 1; c.x = (Math.random() - 0.5) * 6; c.y = (Math.random() - 0.5) * 1.5; }
      const { sx, sy, scale } = this.project(c.x, c.y + camPitch, c.z, W, skyH, 0);
      if (sy > skyH * 0.5) return;
      const cw = c.w * scale * W * 0.5, ch = c.h * scale * skyH * 0.5;
      ctx.globalAlpha = Math.min(0.7, (1 - c.z) * 1.5) * 0.6;
      ctx.fillStyle = terrain.biome === 'city' ? 'rgba(180,200,220,0.8)' : 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.ellipse(sx, sy, cw, ch, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx - cw * 0.4, sy + ch * 0.2, cw * 0.6, ch * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + cw * 0.4, sy + ch * 0.2, cw * 0.5, ch * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  drawEntities(entities, camX, camY, W, H, panelH) {
    const { ctx } = this;
    const skyH = H - panelH;

    entities.coins.forEach(c => {
      if (c.collected) return;
      const { sx, sy, scale } = this.project(c.x - camX, c.y - camY + Math.sin(c.wobble) * 0.05, c.z, W, skyH, 0);
      if (sy > skyH || sy < 0 || scale < 0.05) return;
      const r = Math.max(4, Math.round(c.r * scale * W * 2));
      const grad = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, 1, sx, sy, r);
      grad.addColorStop(0, '#ffe87a'); grad.addColorStop(1, '#c67c00');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c67c00';
      ctx.font = `bold ${Math.max(8, r)}px Courier New`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', sx, sy);
    });

    entities.fuels.forEach(f => {
      if (f.collected) return;
      const { sx, sy, scale } = this.project(f.x - camX, f.y - camY, f.z, W, skyH, 0);
      if (sy > skyH || sy < 0 || scale < 0.05) return;
      const r = Math.max(6, Math.round(0.1 * scale * W));
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(sx - r * 0.4, sy - r, r * 0.8, r * 2);
      ctx.fillRect(sx - r, sy - r * 0.4, r * 2, r * 0.8);
      ctx.strokeStyle = '#00cc55'; ctx.lineWidth = 2;
      ctx.strokeRect(sx - r * 0.4, sy - r, r * 0.8, r * 2);
      ctx.strokeRect(sx - r, sy - r * 0.4, r * 2, r * 0.8);
    });

    entities.obstacles.forEach(o => {
      if (o.hit) return;
      const { sx, sy, scale } = this.project(o.x - camX, o.y - camY, o.z, W, skyH, 0);
      if (sy > skyH || sy < 0 || scale < 0.05) return;
      const s = Math.max(8, Math.round(0.15 * scale * W));
      if (o.type === 'bird') this._drawBirdEntity(sx, sy, s);
      else if (o.type === 'balloon') this._drawBalloon(sx, sy, s);
      else this._drawSmallPlane(sx, sy, s);
    });

    entities.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x * W * 0.1 + W / 2, p.y * skyH * 0.1 + skyH / 2, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  _drawBirdEntity(x, y, s) {
    const { ctx } = this;
    ctx.strokeStyle = '#e24b4a'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.4, x, y);
    ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.4, x + s, y);
    ctx.stroke();
  }

  _drawBalloon(x, y, s) {
    const { ctx } = this;
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath(); ctx.ellipse(x, y - s, s * 0.6, s * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cc4400'; ctx.lineWidth = 1;
    ctx.strokeRect(x - s * 0.2, y, s * 0.4, s * 0.4);
    ctx.beginPath(); ctx.moveTo(x - s * 0.2, y); ctx.lineTo(x - s * 0.5, y - s * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * 0.2, y); ctx.lineTo(x + s * 0.5, y - s * 0.2); ctx.stroke();
  }

  _drawSmallPlane(x, y, s) {
    const { ctx } = this;
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - s * 0.5, y - s * 0.5, s, s * 0.15);
  }

  drawCockpit(W, H, panelH, shake) {
    const { ctx } = this;
    const skyH = H - panelH;
    const sx = shake.x, sy = shake.y;

    ctx.strokeStyle = '#1a1a22';
    ctx.lineWidth = Math.round(W * 0.07);
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(W + sx, sy);
    ctx.moveTo(sx, skyH + sy); ctx.lineTo(W + sx, skyH + sy);
    ctx.moveTo(sx, sy); ctx.lineTo(sx, skyH + sy);
    ctx.moveTo(W + sx, sy); ctx.lineTo(W + sx, skyH + sy);
    ctx.stroke();

    ctx.strokeStyle = '#252535';
    ctx.lineWidth = Math.round(W * 0.025);
    const crossX = W / 2, topY = sy + W * 0.035, botY = skyH - W * 0.035;
    ctx.beginPath();
    ctx.moveTo(crossX + sx, topY); ctx.lineTo(crossX + sx, botY);
    ctx.moveTo(sx + W * 0.035, skyH / 2 + sy); ctx.lineTo(W - W * 0.035 + sx, skyH / 2 + sy);
    ctx.stroke();

    const rv = ctx.createLinearGradient(0, 0, W * 0.08, 0);
    rv.addColorStop(0, 'rgba(10,10,20,0.85)'); rv.addColorStop(1, 'transparent');
    ctx.fillStyle = rv; ctx.fillRect(0, 0, W * 0.08, skyH);
    const rv2 = ctx.createLinearGradient(W, 0, W * 0.92, 0);
    rv2.addColorStop(0, 'rgba(10,10,20,0.85)'); rv2.addColorStop(1, 'transparent');
    ctx.fillStyle = rv2; ctx.fillRect(W * 0.92, 0, W * 0.08, skyH);
    const rt = ctx.createLinearGradient(0, 0, 0, skyH * 0.1);
    rt.addColorStop(0, 'rgba(10,10,20,0.7)'); rt.addColorStop(1, 'transparent');
    ctx.fillStyle = rt; ctx.fillRect(0, 0, W, skyH * 0.1);
  }
}
