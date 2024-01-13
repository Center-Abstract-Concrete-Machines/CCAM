function getContainerDimensions() {
  const container = document.querySelector("#sketch");
  const dimensions = container.getBoundingClientRect();
  return {
    containerWidth: dimensions.width,
    containerHeight: dimensions.height,
  };
}

function setup() {
  const { containerWidth, containerHeight } = getContainerDimensions();
  createCanvas(containerWidth, containerHeight).parent("#sketch");
  textCol2 = color("#98CE00");
  fontGen();
  image(textMask, 0, 0);
}

function draw() {
  noFill();
  image(textMask, 0, 0);
  for (i = 0; i < particles.length; i++) {
    particles[i].move();
    particles[i].display();
  }
}

function windowResized() {
  const { containerWidth, containerHeight } = getContainerDimensions();
  resizeCanvas(containerWidth, containerHeight);
}
