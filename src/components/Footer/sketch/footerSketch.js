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
            for (let i = 0; i < p.width * 2.5; i++) {
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

// Use Intersection Observer API to load sketch once it is visible
function callback(entries, observer) {
    entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
            await import('/src/utils/p5wrapper.js');
            sketchEl = setupSketch();
            observer.disconnect();
        }
    });
}

function setupObserver() {
    const sketchObserver = new IntersectionObserver(callback, {
        threshold: 0.3,
    });
    sketchObserver.observe(document.querySelector('#sketch'));
}

let sketchEl;

// This is all to prevent memory leaks when using page transitions
document.addEventListener('astro:page-load', () => {
    if (!sketchEl) {
        setupObserver();
    }
});

document.addEventListener('astro:before-swap', () => {
    if (sketchEl) {
        sketchEl.remove();
        sketchEl = null;
    }
});
