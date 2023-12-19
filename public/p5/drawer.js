let noiseScale = 0.003;

let particles = [];

const spdRange = [0.5, 2];
let count = 0;

let font; // will hold font
let points; // will hold points of font
let bounds;
let colors = ['#fffbf1', '#2d2d2a', '#eee5e9'];
let textCol2;
let textMask;
let content;
const theText = 'CCAM';

function preload() {
    font = loadFont('p5/Righteous-Regular.ttf');
}

function getPoints(text, sample, thresh) {
    let offset = width / 20;
    let pts = font.textToPoints(text, offset, textSize() - offset, textSize(), {
        sampleFactor: sample,
        simplifyThreshold: thresh,
    });

    return pts;
}

function fontGen() {
    particles = [];
    textSize(maxWidth(theText, width));
    points = getPoints(theText, 0.6, 0);
    points2 = getPoints(theText, 1, 0.7);
    bounds = font.textBounds(theText, 50, textSize() - 50, textSize());
    drawText();
    for (let p of points) {
        let x = Math.floor(p.x);
        let y = Math.floor(p.y);
        let b = new Particle(x, y);
        particles.push(b);
    }
}

function maxWidth(string, width) {
    let dif = width;
    let sz = 20;
    while (dif > 1) {
        textSize(sz);
        let check = textWidth(string);
        dif = width - check;
        sz++;
    }
    return sz;
}

function drawText() {
    textMask = createGraphics(bounds.w + 100, bounds.h * 2);
    textMask.noFill();
    textCol2.setAlpha(80);
    textMask.stroke(textCol2);
    textMask.strokeWeight(pix * 2);

    for (let p = 0; p < points2.length; p++) {
        if (p > 0) {
            textMask.line(
                points2[p].x,
                points2[p].y,
                points2[p - 1].x,
                points2[p - 1].y
            );
        }
    }
}
