function setup() {
  let pageHeight = select(".row").size().height + 1000;
  createCanvas(windowWidth, pageHeight).parent("#splash");
  textCol2 = color("#98CE00");

  fontGen();

  let element = document.getElementById("spacer");
  element.style.height = textSize() + "px";
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
  resizeCanvas(windowWidth, windowHeight);
  pix =
    Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    ) / 20;
}
