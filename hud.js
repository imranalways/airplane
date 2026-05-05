export class HUD {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  draw(state) {
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const panelH = Math.round(H * 0.18);
    const panelY = H - panelH;

    ctx.save();
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, panelY, W, panelH);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, panelY); ctx.lineTo(W, panelY); ctx.stroke();

    const cx = W / 2;
    const gaugeY = panelY + panelH * 0.5;
    const gaugeR = panelH * 0.35;

    this._drawDial(cx - W * 0.32, gaugeY, gaugeR, 'ALTITUDE', state.altitude, 0, 100, '#4db8ff', `${Math.round(state.altitude * 100)}ft`);
    this._drawFuelGauge(cx, gaugeY, gaugeR * 1.1, state.fuel);
    this._drawDial(cx + W * 0.32, gaugeY, gaugeR, 'SPEED', state.speed, 2, 10, '#ffe87a', `${Math.round(state.speed * 100)}kn`);

    this._drawScore(W, panelY, state);
    this._drawLives(W, panelY, state.lives);
    this._drawBiome(W, panelY, state.biome);
    this._drawWarnings(W, H, panelY, state);
    this._drawCrosshair(W, H, panelH);
    this._drawCompass(cx, panelY + 14, W * 0.15, state.heading);

    ctx.restore();
  }

  _drawDial(x, y, r, label, val, min, max, color, text) {
    const { ctx } = this;
    const t = (val - min) / (max - min);
    const startAng = Math.PI * 0.75, endAng = Math.PI * 2.25;
    const ang = startAng + t * (endAng - startAng);

    ctx.beginPath();
    ctx.arc(x, y, r, startAng, endAng);
    ctx.strokeStyle = '#222'; ctx.lineWidth = r * 0.18; ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, r, startAng, ang);
    ctx.strokeStyle = color; ctx.lineWidth = r * 0.18; ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();

    const nx = x + Math.cos(ang) * r * 0.7, ny = y + Math.sin(ang) * r * 0.7;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(r * 0.38)}px 'Courier New'`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + r * 0.05);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${Math.round(r * 0.28)}px 'Courier New'`;
    ctx.fillText(label, x, y + r + 12);
  }

  _drawFuelGauge(x, y, r, fuel) {
    const { ctx } = this;
    const color = fuel < 0.25 ? '#ff4444' : fuel < 0.5 ? '#ffaa00' : '#44ff88';

    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = '#222'; ctx.lineWidth = r * 0.18; ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 0.75, Math.PI * 0.75 + fuel * Math.PI * 1.5);
    ctx.strokeStyle = color; ctx.lineWidth = r * 0.18; ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(r * 0.35)}px 'Courier New'`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(fuel * 100)}%`, x, y);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${Math.round(r * 0.26)}px 'Courier New'`;
    ctx.fillText('FUEL', x, y + r + 12);
  }

  _drawScore(W, panelY, state) {
    const { ctx } = this;
    ctx.fillStyle = '#ffe87a';
    ctx.font = `bold ${Math.round(W * 0.022)}px 'Courier New'`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(`SCORE: ${state.score}`, 20, panelY + 12);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${Math.round(W * 0.015)}px 'Courier New'`;
    ctx.fillText(`BEST: ${state.highScore}`, 20, panelY + 12 + W * 0.026);
    if (state.streak > 1) {
      ctx.fillStyle = '#ff9a00';
      ctx.font = `bold ${Math.round(W * 0.016)}px 'Courier New'`;
      ctx.fillText(`x${state.streak} STREAK`, 20, panelY + 12 + W * 0.05);
    }
  }

  _drawLives(W, panelY, lives) {
    const { ctx } = this;
    for (let i = 0; i < 3; i++) {
      const hx = W - 30 - i * 28, hy = panelY + 18;
      ctx.fillStyle = i < lives ? '#ff4444' : '#333';
      ctx.beginPath();
      ctx.arc(hx - 5, hy, 7, Math.PI, 0);
      ctx.arc(hx + 5, hy, 7, Math.PI, 0);
      ctx.lineTo(hx + 12, hy + 6);
      ctx.lineTo(hx, hy + 16);
      ctx.lineTo(hx - 12, hy + 6);
      ctx.closePath(); ctx.fill();
    }
  }

  _drawBiome(W, panelY, biome) {
    const { ctx } = this;
    const colors = { city: '#4db8ff', countryside: '#44ff88', rural: '#88cc44' };
    ctx.fillStyle = colors[biome] || '#fff';
    ctx.font = `${Math.round(W * 0.014)}px 'Courier New'`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText(biome.toUpperCase(), W - 20, panelY + 50);
  }

  _drawCompass(x, y, w, heading) {
    const { ctx } = this;
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - w / 2, y, w, 20);
    ctx.fillStyle = '#666';
    ctx.font = `10px 'Courier New'`;
    ctx.textAlign = 'center';
    dirs.forEach((d, i) => {
      const dx = x + (((i / dirs.length) - heading / (Math.PI * 2) + 0.5) % 1 - 0.5) * w;
      if (dx > x - w / 2 && dx < x + w / 2) {
        ctx.fillStyle = d === 'N' ? '#ff4444' : '#666';
        ctx.fillText(d, dx, y + 14);
      }
    });
    ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 20); ctx.stroke();
  }

  _drawWarnings(W, H, panelY, state) {
    const { ctx } = this;
    if (state.fuel < 0.25 && Math.floor(Date.now() / 400) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,60,60,0.15)';
      ctx.fillRect(0, 0, W, panelY);
      ctx.fillStyle = '#ff4444';
      ctx.font = `bold ${Math.round(W * 0.02)}px 'Courier New'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('⚠ LOW FUEL', W / 2, 16);
    }
    if (state.altitude < 0.05 || state.altitude > 0.95) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = `bold ${Math.round(W * 0.018)}px 'Courier New'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(state.altitude < 0.05 ? '⚠ PULL UP' : '⚠ MAX ALTITUDE', W / 2, 44);
    }
    if (state.invincible > 0 && Math.floor(Date.now() / 150) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,100,100,0.08)';
      ctx.fillRect(0, 0, W, panelY);
    }
  }

  _drawCrosshair(W, H, panelH) {
    const { ctx } = this;
    const cx = W / 2, cy = (H - panelH) / 2;
    const s = Math.min(W, H) * 0.025;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy); ctx.lineTo(cx - s * 0.3, cy);
    ctx.moveTo(cx + s * 0.3, cy); ctx.lineTo(cx + s, cy);
    ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy - s * 0.3);
    ctx.moveTo(cx, cy + s * 0.3); ctx.lineTo(cx, cy + s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();
  }
}
