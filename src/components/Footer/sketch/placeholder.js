import { p5 } from '/src/utils/p5wrapper.js';
import getContainerDimensions from './getContainerDimensions';
import Particle from './particle';

export function setupSketch() {
    return new p5((p) => {
        let particles = [];
        let points = [];
        const particleConfig = {
            noiseScale: 0.003,
            spdRange: [0.5, 2],
            colors: ['#fffbf1', '#2d2d2a', '#eee5e9'],
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
                let o = new Particle(p, n.x, n.y, particleConfig);
                particles.push(o);
            }
        };

        p.setup = () => {
            const { containerWidth, containerHeight } =
                getContainerDimensions('#sketch');
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
                getContainerDimensions('#sketch');
            p.resizeCanvas(containerWidth, containerHeight);
            refreshParticles();
        };
    });
}

// This is all to prevent memory leaks when using page transitions

let sketchEl = setupSketch();

document.addEventListener('astro:page-load', () => {
    if (!sketchEl) {
        sketchEl = setupSketch();
    }
});

document.addEventListener('astro:before-swap', () => {
    sketchEl.remove();
    sketchEl = null;
});
