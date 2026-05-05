export class Controls {
  constructor() {
    this.keys = {};
    this.muted = false;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    this.keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  get up()    { return !!(this.keys['ArrowUp']    || this.keys['KeyW']); }
  get down()  { return !!(this.keys['ArrowDown']  || this.keys['KeyS']); }
  get left()  { return !!(this.keys['ArrowLeft']  || this.keys['KeyA']); }
  get right() { return !!(this.keys['ArrowRight'] || this.keys['KeyD']); }
  get boost() { return !!(this.keys['Space']); }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
