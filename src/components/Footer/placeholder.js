import { p5 } from '/src/utils/p5wrapper.js';

function getContainerDimensions() {
    const container = document.querySelector('#sketch');
    const dimensions = container.getBoundingClientRect();
    return {
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
    };
}
function setupSketch() {
    let sketch1 = new p5((p) => {
        p.setup = () => {
            const { containerWidth, containerHeight } =
                getContainerDimensions();
            p.createCanvas(containerWidth, containerHeight).parent('#sketch');
        };

        p.draw = () => {
            if (p.mouseIsPressed) {
                p.fill(0);
            } else {
                p.fill(255);
            }
            p.ellipse(p.mouseX, p.mouseY, 80, 80);
        };

        p.windowResized = () => {
            const { containerWidth, containerHeight } =
                getContainerDimensions();
            p.resizeCanvas(containerWidth, containerHeight);
        };
    });
}

// Uncomment below if you disable page transitions
// setupSketch();

// Necessary for page transitions
document.addEventListener('astro:page-load', () => {
    setupSketch();
});
