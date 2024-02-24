// import getContainerDimensions from './getContainerDimensions';
import {
    getContainerDimensions,
    getStartingParticleBounds,
} from '@utils/sketchHelpers';
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
            const { x_low, x_high, y_low, y_high } =
                getStartingParticleBounds('#headerLogo');
            points = [];
            particles = [];
            for (let i = 0; i < 100 * 2.5; i++) {
                let u = {
                    x: p.random(x_low, x_high),
                    y: p.random(y_low, y_high),
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
                getContainerDimensions('#headerSketch');

            p.createCanvas(containerWidth, containerHeight).parent(
                '#headerSketch'
            );
            refreshParticles();
        };

        p.draw = () => {
            for (let o of particles) {
                if (p.width >= 680) {
                    o.moveright();
                } else {
                    o.move();
                }
                o.display();
            }
        };

        p.windowResized = () => {
            const { containerWidth, containerHeight } =
                getContainerDimensions('#headerSketch');

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
        threshold: 1,
    });
    sketchObserver.observe(document.querySelector('#headerLogo'));
}

let sketchEl;
// if (!sketchEl) {
//     console.log('setting up observer');
//     setupObserver();
// }

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
