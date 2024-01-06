function getContainerDimensions() {
    const container = document.querySelector('#sketch');
    const dimensions = container.getBoundingClientRect();
    return {
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
    };
}

function setup() {
    const { containerWidth, containerHeight } = getContainerDimensions();
    createCanvas(containerWidth, containerHeight).parent('#sketch');
}

function draw() {
    if (mouseIsPressed) {
        fill(0);
    } else {
        fill(255);
    }
    ellipse(mouseX, mouseY, 80, 80);
}

function windowResized() {
    const { containerWidth, containerHeight } = getContainerDimensions();
    resizeCanvas(containerWidth, containerHeight);
}
