export const BIOMES = ['city', 'countryside', 'rural'];

export const BIOME_COLORS = {
  city: {
    sky1: '#1a1a2e', sky2: '#16213e',
    ground: '#2d2d2d', road: '#1a1a1a', stripe: '#f0c040',
    fog: '#1a1a2e'
  },
  countryside: {
    sky1: '#87CEEB', sky2: '#b0e0ff',
    ground: '#4a7c3f', road: '#8B7355', stripe: '#fff',
    fog: '#c8e8ff'
  },
  rural: {
    sky1: '#2c4a1e', sky2: '#3d6b2a',
    ground: '#1a3d0a', road: '#5a4a30', stripe: '#888',
    fog: '#2c4a1e'
  }
};

export class Terrain {
  constructor() {
    this.biomeIndex = 0;
    this.biomeTimer = 0;
    this.biomeDuration = 90 * 60;
    this.transition = 0;
    this.nextBiome = 1;
    this.offset = 0;
    this.speed = 4;
    this.landmarks = [];
    this.lmTimer = 0;
    this._initLandmarks();
  }

  get biome() { return BIOMES[this.biomeIndex]; }
  get colors() { return BIOME_COLORS[this.biome]; }
  get nextColors() { return BIOME_COLORS[BIOMES[this.nextBiome]]; }

  _initLandmarks() {
    for (let i = 0; i < 12; i++) this._spawnLandmark(Math.random());
  }

  _spawnLandmark(progress = 1) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const b = this.biome;
    let type;
    if (b === 'city') type = ['skyscraper','tower','bridge','sign'][Math.floor(Math.random()*4)];
    else if (b === 'countryside') type = ['barn','windmill','hill','farm'][Math.floor(Math.random()*4)];
    else type = ['tree','mountain','lake','treeline'][Math.floor(Math.random()*4)];
    this.landmarks.push({ type, side, progress, biome: b, data: this._lmData(type) });
  }

  _lmData(type) {
    return {
      w: 40 + Math.random() * 80,
      h: 60 + Math.random() * 160,
      color: ['#334', '#445', '#556', '#223', '#3a5', '#2a4'][Math.floor(Math.random()*6)],
      windows: Math.floor(Math.random() * 8) + 2,
      offset: Math.random() * 80
    };
  }

  update(dt) {
    this.offset += this.speed * dt * 60;
    this.biomeTimer++;
    this.lmTimer++;

    if (this.lmTimer > 80) {
      this.lmTimer = 0;
      this._spawnLandmark();
    }

    this.landmarks.forEach(lm => lm.progress -= this.speed * dt * 0.008);
    this.landmarks = this.landmarks.filter(lm => lm.progress > -0.1);

    if (this.biomeTimer > this.biomeDuration) {
      this.biomeTimer = 0;
      this.transition = 0;
      this.biomeIndex = this.nextBiome;
      this.nextBiome = (this.biomeIndex + 1) % BIOMES.length;
    }

    if (this.biomeTimer > this.biomeDuration * 0.8) {
      this.transition = (this.biomeTimer - this.biomeDuration * 0.8) / (this.biomeDuration * 0.2);
    }
  }

  lerpColor(c1, c2, t) {
    const r1 = parseInt(c1.slice(1,3),16), g1 = parseInt(c1.slice(3,5),16), b1 = parseInt(c1.slice(5,7),16);
    const r2 = parseInt(c2.slice(1,3),16), g2 = parseInt(c2.slice(3,5),16), b2 = parseInt(c2.slice(5,7),16);
    const r = Math.round(r1 + (r2-r1)*t), g = Math.round(g1 + (g2-g1)*t), b = Math.round(b1 + (b2-b1)*t);
    return `rgb(${r},${g},${b})`;
  }

  getColor(key) {
    if (this.transition <= 0) return this.colors[key];
    return this.lerpColor(this.colors[key], this.nextColors[key], this.transition);
  }
}
