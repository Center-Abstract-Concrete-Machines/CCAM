import {
    getContainerDimensions,
    getStartingParticleBounds,
    random,
} from '@utils/swirl/sketchHelpers.js';
import Particle from '@utils/swirl/particle.js';

export function initSketch(sketchOptions) {
    let particles = [];
    const {
        canvasContainerId,
        startingParticleBoundsId,
        numOfParticles,
        particleConfig,
        moveRight,
        isFooter,
        resizeStrategy,
    } = sketchOptions;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const bufferCanvas = document.createElement('canvas');
    const bufferContext = bufferCanvas.getContext('2d');

    const canvasContainer = document.querySelector(canvasContainerId);
    canvasContainer.appendChild(canvas);

    function handleResize() {
        if (resizeStrategy === 'stretch') {
            bufferContext.drawImage(canvas, 0, 0);
            let { containerWidth, containerHeight } =
                getContainerDimensions(canvasContainerId);
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            context.drawImage(
                bufferCanvas,
                0,
                0,
                containerWidth,
                containerHeight
            );
            bufferCanvas.width = containerWidth;
            bufferCanvas.height = containerHeight;
            // refreshParticles();
        } else {
            const imageData = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );
            let { containerWidth, containerHeight } =
                getContainerDimensions(canvasContainerId);
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            context.putImageData(imageData, 0, 0);
        }
    }

    function refreshParticles() {
        particles = [];

        if (isFooter) {
            let { containerWidth, containerHeight } =
                getContainerDimensions(canvasContainerId);
            for (let i = 0; i < containerWidth / 3; i++) {
                const pos = {
                    x: random(containerWidth),
                    y: random(containerHeight),
                };
                particles.push(
                    new Particle(context, pos.x, pos.y, particleConfig)
                );
            }
        } else {
            const { x_low, x_high, y_low, y_high } = getStartingParticleBounds(
                startingParticleBoundsId
            );
            for (let i = 0; i < numOfParticles; i++) {
                const pos = {
                    x: random(x_low, x_high),
                    y: random(y_low, y_high),
                };
                particles.push(
                    new Particle(context, pos.x, pos.y, particleConfig)
                );
            }
        }
    }

    function draw() {
        for (let particle of particles) {
            particle.move(Boolean(moveRight));
            particle.display();
        }
        animationId = requestAnimationFrame(draw);
    }

    let animationId;
    handleResize();
    refreshParticles();
    draw();

    const timeoutId = setTimeout(
        () => {
            cancelAnimationFrame(animationId);
        },
        1000 * 60 * 1 // stop animation after 2 minutes
    );

    window.addEventListener('resize', handleResize);

    function dismantle() {
        clearTimeout(timeoutId); // cancel timeout
        window.removeEventListener('resize', handleResize);
        canvas.remove();
        bufferCanvas.remove();
    }

    return {
        canvas,
        dismantle,
    };
}
