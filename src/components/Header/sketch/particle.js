export default class Particle {
    constructor(p, x, y, particleConfig) {
        this.p = p;
        this.pos = p.createVector(x, y);
        this.dir = p.createVector(0, 0);
        this.speed = p.random(
            particleConfig.spdRange[0],
            particleConfig.spdRange[1]
        );
        this.col1 = p.color(p.random(particleConfig.colors));
        this.col2 = p.color(p.random(particleConfig.colors));
        this.r =
            particleConfig.spdRange[1] +
            particleConfig.spdRange[0] -
            this.speed * 0.1;
        this.alpha = 255;
        this.noiseScale = particleConfig.noiseScale;
    }
    move() {
        this.noise =
            500 *
            this.p.map(
                this.p.noise(
                    this.pos.x * this.noiseScale,
                    this.pos.y * this.noiseScale
                ),
                0.2,
                0.8,
                -1,
                1
            );
        this.dir = this.p.createVector(
            this.p.cos(this.noise),
            this.p.sin(this.noise)
        );
        this.dir.mult(this.speed);
        this.pos.add(this.dir);
    }
    moveright() {
        this.noise =
            500 *
            this.p.map(
                this.p.noise(
                    this.pos.x * this.noiseScale,
                    this.pos.y * this.noiseScale
                ),
                0.2,
                0.8,
                -1,
                1
            );
        this.dir = this.p.createVector(
            this.p.cos(this.noise),
            this.p.sin(this.noise)
        );
        this.dir.mult(this.speed);
        this.dir.add(0.25, 0);
        this.pos.add(this.dir);
    }

    display() {
        let col = this.p.lerpColor(this.col1, this.col2, this.noise);
        col.setAlpha(40);
        this.p.stroke(col);
        this.p.strokeWeight(this.r);
        this.p.point(this.pos.x, this.pos.y);
    }
}
