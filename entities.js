export class EntityManager {
  constructor() {
    this.coins = [];
    this.fuels = [];
    this.obstacles = [];
    this.particles = [];
    this.coinTimer = 0;
    this.fuelTimer = 0;
    this.obstTimer = 0;
    this.coinInterval = 90;
    this.obstInterval = 180;
    this.fuelInterval = 400;
  }

  _rand(min, max) { return min + Math.random() * (max - min); }

  spawnCoin(altitude) {
    const spread = 3;
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      this.coins.push({
        x: this._rand(-spread, spread),
        y: this._rand(-1.5, 1.5),
        z: 1.0,
        r: 0.08,
        collected: false,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  spawnFuel() {
    this.fuels.push({
      x: this._rand(-2, 2),
      y: this._rand(-1, 1),
      z: 1.0,
      collected: false
    });
  }

  spawnObstacle(biome) {
    const types = biome === 'city'
      ? ['balloon','bird','plane']
      : biome === 'countryside'
      ? ['bird','bird','balloon']
      : ['bird','bird','bird'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.obstacles.push({
      x: this._rand(-2.5, 2.5),
      y: this._rand(-1.2, 1.2),
      z: 1.0,
      type,
      hit: false,
      vy: (Math.random() - 0.5) * 0.004
    });
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random();
      this.particles.push({
        x, y, vx: Math.cos(ang) * (1 + Math.random()),
        vy: Math.sin(ang) * (1 + Math.random()),
        life: 1, color, r: 3 + Math.random() * 4
      });
    }
  }

  update(dt, speed, biome, altitude) {
    const spd = speed * dt;

    this.coinTimer++;
    this.fuelTimer++;
    this.obstTimer++;

    if (this.coinTimer > this.coinInterval) { this.coinTimer = 0; this.spawnCoin(altitude); }
    if (this.fuelTimer > this.fuelInterval) { this.fuelTimer = 0; this.spawnFuel(); }
    if (this.obstTimer > this.obstInterval) { this.obstTimer = 0; this.spawnObstacle(biome); }

    const moveZ = spd * 0.05;
    this.coins.forEach(c => { c.z -= moveZ; c.wobble += 0.05; });
    this.fuels.forEach(f => f.z -= moveZ);
    this.obstacles.forEach(o => { o.z -= moveZ * 1.2; o.y += o.vy; });
    this.particles.forEach(p => { p.x += p.vx * dt * 60 * 0.5; p.y += p.vy * dt * 60 * 0.5; p.life -= dt * 1.5; });

    this.coins = this.coins.filter(c => c.z > -0.1 && !c.collected);
    this.fuels = this.fuels.filter(f => f.z > -0.1 && !f.collected);
    this.obstacles = this.obstacles.filter(o => o.z > -0.1 && !o.hit);
    this.particles = this.particles.filter(p => p.life > 0);
  }

  checkCollisions(cx, cy, invincible) {
    let coins = 0, fuel = false, hit = false;

    this.coins.forEach(c => {
      if (c.collected || c.z > 0.15) return;
      const dx = c.x - cx, dy = c.y - cy;
      if (Math.hypot(dx, dy) < 0.4) { c.collected = true; coins++; }
    });

    this.fuels.forEach(f => {
      if (f.collected || f.z > 0.15) return;
      const dx = f.x - cx, dy = f.y - cy;
      if (Math.hypot(dx, dy) < 0.5) { f.collected = true; fuel = true; }
    });

    if (!invincible) {
      this.obstacles.forEach(o => {
        if (o.hit || o.z > 0.15) return;
        const dx = o.x - cx, dy = o.y - cy;
        if (Math.hypot(dx, dy) < 0.35) { o.hit = true; hit = true; }
      });
    }

    return { coins, fuel, hit };
  }

  reset() {
    this.coins = []; this.fuels = []; this.obstacles = []; this.particles = [];
    this.coinTimer = 0; this.fuelTimer = 0; this.obstTimer = 0;
  }
}
