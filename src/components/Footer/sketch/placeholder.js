import { p5 } from '/src/utils/p5wrapper.js';
// import { points } from './points.json';

function getContainerDimensions() {
    const container = document.querySelector('#sketch');
    const dimensions = container.getBoundingClientRect();
    return {
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
    };
}
function setupSketch() {
    new p5((p) => {
        let particles = [];
        let noiseScale = 0.003;
        let points = [];
        const spdRange = [0.5, 2];
        const colors = ['#fffbf1', '#2d2d2a', '#eee5e9'];
        p.preload = () => {
            // points = p.loadJSON('./points.json');
        };

        const refreshParticles = () => {
            points = [];
            particles = [];
            for (let i = 0; i < 3000; i++) {
                let u = {
                    x: p.random(p.width),
                    y: p.random(p.height),
                };
                points.push(u);
            }
            for (let n of points) {
                let o = new Particle(n.x, n.y);
                particles.push(o);
            }
        };

        p.setup = () => {
            const { containerWidth, containerHeight } =
                getContainerDimensions();
            p.createCanvas(containerWidth, containerHeight).parent('#sketch');
            refreshParticles();
        };

        p.draw = () => {
            for (let o of particles) {
                o.move();
                o.display();
            }
        };

        p.windowResized = () => {
            const { containerWidth, containerHeight } =
                getContainerDimensions();
            p.resizeCanvas(containerWidth, containerHeight);
            refreshParticles();
        };
        class Particle {
            constructor(x, y) {
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
                        p.noise(
                            this.pos.x * noiseScale,
                            this.pos.y * noiseScale
                        ),
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
    });
}

// Uncomment below if you disable page transitions
// setupSketch();

// Necessary for page transitions
document.addEventListener('astro:page-load', () => {
    setupSketch();
});
