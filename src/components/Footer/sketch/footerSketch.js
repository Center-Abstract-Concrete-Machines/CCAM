import {
    getContainerDimensions,
    getStartingParticleBounds,
} from '@utils/sketchHelpers';
import Particle from './particle';
import { prefersReduced } from '@utils/prefersReducedMotion';

export function setupSketch() {
    return new p5((p) => {
        let particles = [];
        let points = [];
        const particleConfig = {
            noiseScale: 0.003,
            spdRange: [0.5, 2],
            colors: ['#fffbf1', '#2d2d2a', '#eee5e9'],
        };

        // function getStartingParticleBoundsFooter(selector) {
        //     const logoLocation = document
        //         .querySelector(selector)
        //         .getBoundingClientRect();
        //     const x_low = logoLocation.left;
        //     const x_high = logoLocation.left + logoLocation.width;
        //     const y_low =
        //         p.height - 396 + 320 / 2 + 16 + logoLocation.height / 2;
        //     const y_high =
        //         p.height - 396 + 320 / 2 + 16 - logoLocation.height / 2;
        //     return { x_low, x_high, y_low, y_high };
        // }

        const refreshParticles = () => {
            // const { x_low, x_high, y_low, y_high } =
            //     getStartingParticleBoundsFooter('#footerLogo');
            points = [];
            particles = [];
            for (let i = 0; i < p.width * 2; i++) {
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
        threshold: 0.9,
    });
    sketchObserver.observe(document.querySelector('#footerLogo'));
}

let sketchEl;

if (!prefersReduced) {
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
}
