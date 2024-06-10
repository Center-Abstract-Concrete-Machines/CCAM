export function getStartingParticleBounds(selector) {
    const logoLocation = document
        .querySelector(selector)
        .getBoundingClientRect();
    const x_low = logoLocation.left;
    const x_high = logoLocation.left + logoLocation.width;
    const y_low = logoLocation.top;
    const y_high = logoLocation.top + logoLocation.height;
    return { x_low, x_high, y_low, y_high };
}

export function getContainerDimensions(selector) {
    const container = document.querySelector(selector);
    const dimensions = container.getBoundingClientRect();
    return {
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
    };
}

export function random(min = 0, max = 1) {
    if (typeof min === 'number' && typeof max === 'number') {
        return Math.random() * (max - min) + min;
    }
    if (Array.isArray(min)) {
        return min[Math.floor(Math.random() * min.length)];
    }
}

export function interpolateRgbStrings(rgbStr1, rgbStr2, amount) {
    // Ensure amount is within the range [0, 1]
    if (amount < 0) {
        amount = 0;
    } else if (amount > 1) {
        amount = 1;
    }

    // Convert RGB strings to RGB arrays
    function rgbStringToArray(rgbStr) {
        return rgbStr.match(/\d+/g).map(Number);
    }

    const rgb1 = rgbStringToArray(rgbStr1);
    const rgb2 = rgbStringToArray(rgbStr2);

    // Interpolate between the two RGB colors
    const interpolatedRgb = rgb1.map((c1, i) =>
        Math.round((1 - amount) * c1 + amount * rgb2[i])
    );

    // Convert RGB array back to RGB string
    function rgbArrayToString(rgbArray) {
        return `rgb(${rgbArray[0]} ${rgbArray[1]} ${rgbArray[2]})`;
    }

    return rgbArrayToString(interpolatedRgb);
}

// ---- P5 Subset ----
function constrain(n, low, high) {
    return Math.max(Math.min(n, high), low);
}

export function map(n, start1, stop1, start2, stop2, withinBounds) {
    const newval =
        ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
    if (!withinBounds) {
        return newval;
    }
    if (start2 < stop2) {
        return constrain(newval, start2, stop2);
    } else {
        return constrain(newval, stop2, start2);
    }
}

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4; // default to medium smooth
let perlin_amp_falloff = 0.5; // 50% reduction/octave

const scaled_cosine = (i) => 0.5 * (1.0 - Math.cos(i * Math.PI));

let perlin;

export function noise(x, y = 0, z = 0) {
    if (perlin == null) {
        perlin = new Array(PERLIN_SIZE + 1);
        for (let i = 0; i < PERLIN_SIZE + 1; i++) {
            perlin[i] = Math.random();
        }
    }

    if (x < 0) {
        x = -x;
    }
    if (y < 0) {
        y = -y;
    }
    if (z < 0) {
        z = -z;
    }

    let xi = Math.floor(x),
        yi = Math.floor(y),
        zi = Math.floor(z);
    let xf = x - xi;
    let yf = y - yi;
    let zf = z - zi;
    let rxf, ryf;

    let r = 0;
    let ampl = 0.5;

    let n1, n2, n3;

    for (let o = 0; o < perlin_octaves; o++) {
        let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

        rxf = scaled_cosine(xf);
        ryf = scaled_cosine(yf);

        n1 = perlin[of & PERLIN_SIZE];
        n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
        n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
        n1 += ryf * (n2 - n1);

        of += PERLIN_ZWRAP;
        n2 = perlin[of & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
        n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
        n2 += ryf * (n3 - n2);

        n1 += scaled_cosine(zf) * (n2 - n1);

        r += n1 * ampl;
        ampl *= perlin_amp_falloff;
        xi <<= 1;
        xf *= 2;
        yi <<= 1;
        yf *= 2;
        zi <<= 1;
        zf *= 2;

        if (xf >= 1.0) {
            xi++;
            xf--;
        }
        if (yf >= 1.0) {
            yi++;
            yf--;
        }
        if (zf >= 1.0) {
            zi++;
            zf--;
        }
    }
    return r;
}
