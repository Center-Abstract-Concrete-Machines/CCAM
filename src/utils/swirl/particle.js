import {
    random,
    interpolateRgbStrings,
    noise,
    map,
} from '@utils/swirl/sketchHelpers.js';

export default class Particle {
    constructor(context, x, y, particleConfig) {
        this.context = context;
        this.pos = { x, y };
        this.dir = [0, 0];
        this.color1 = random(particleConfig.colors);
        this.color2 = random(particleConfig.colors);
        this.noiseScale = particleConfig.noiseScale;
        this.noiseMultiplier = particleConfig.noiseMultiplier;
        this.speed = random(
            particleConfig.spdRange[0],
            particleConfig.spdRange[1]
        );
    }

    drawPoint(x, y, color) {
        this.context.fillStyle = color;
        this.context.fillRect(x, y, 1, 1);
    }

    move(right = false) {
        this.noise =
            this.noiseMultiplier *
            map(
                noise(
                    this.pos.x * this.noiseScale,
                    this.pos.y * this.noiseScale
                ),
                0.2,
                0.8,
                -1,
                1
            );
        if (right) {
            this.dir = [
                Math.cos(this.noise) * this.speed + 0.25,
                Math.sin(this.noise) * this.speed,
            ];
        } else {
            this.dir = [
                Math.cos(this.noise) * this.speed,
                Math.sin(this.noise) * this.speed,
            ];
        }
        this.pos = {
            x: this.pos.x + this.dir[0],
            y: this.pos.y + this.dir[1],
        };
    }

    display() {
        let col = interpolateRgbStrings(
            this.color1,
            this.color2,
            Math.abs(this.noise / this.noiseMultiplier)
        );
        col = col.slice(0, -1) + ' / 40)'; // add 40% alpha
        this.drawPoint(this.pos.x, this.pos.y, col);
    }
}
