export default class Particle {
    constructor(x, y, spdRange, colors, noiseScale) {
        this.pos = p.createVector(x, y);
        this.dir = p.createVector(0, 0);
        this.speed = p.random(spdRange[0], spdRange[1]);
        this.col1 = p.color(p.random(colors));
        this.col2 = p.color(p.random(colors));
        this.r = spdRange[1] + spdRange[0] - this.speed * 0.1;
        this.alpha = 255;
    }
    move() {
        this.noise =
            500 *
            p.map(
                p.noise(this.pos.x * noiseScale, this.pos.y * noiseScale),
                0.2,
                0.8,
                -1,
                1
            );
        this.dir = p.createVector(p.cos(this.noise), p.sin(this.noise));
        this.dir.mult(this.speed);
        this.pos.add(this.dir);
    }

    display() {
        let col = p.lerpColor(this.col1, this.col2, this.noise);
        col.setAlpha(40);
        p.stroke(col);
        p.strokeWeight(this.r);
        p.point(this.pos.x, this.pos.y);
    }
}
