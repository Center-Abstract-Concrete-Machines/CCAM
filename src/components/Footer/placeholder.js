// nevermind don't use this
import { sketch } from 'p5js-wrapper';

function getContainerDimensions() {
    const container = document.querySelector('#sketch');
    const dimensions = container.getBoundingClientRect();
    return {
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
    };
}

sketch.setup = () => {
    const { containerWidth, containerHeight } = getContainerDimensions();
    createCanvas(containerWidth, containerHeight).parent('#sketch');
};

sketch.draw = () => {
    if (mouseIsPressed) {
        fill(0);
    } else {
        fill(255);
    }
    ellipse(mouseX, mouseY, 80, 80);
};

sketch.windowResized = () => {
    const { containerWidth, containerHeight } = getContainerDimensions();
    resizeCanvas(containerWidth, containerHeight);
};
