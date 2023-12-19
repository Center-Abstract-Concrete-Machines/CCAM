let pix =
  Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) /
  200;

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.dir = createVector(0, 0);
    this.speed = random(spdRange[0], spdRange[1]);
    this.col1 = color(random(colors));
    this.col2 = color(random(colors));
    this.r = (spdRange[1] + spdRange[0] - this.speed) * pix;
    this.alpha = 255;
  }
  move() {
    this.noise =
      500 *
      map(
        noise(this.pos.x * noiseScale, this.pos.y * noiseScale),
        0.2,
        0.8,
        -1,
        1
      );
    this.dir = createVector(cos(this.noise), sin(this.noise));
    this.dir.mult(this.speed);
    this.pos.add(this.dir);
  }

  display() {
    let col = lerpColor(this.col1, this.col2, this.noise);
    col.setAlpha(40);
    stroke(col);
    strokeWeight(this.r);
    point(this.pos.x, this.pos.y);
  }
}
