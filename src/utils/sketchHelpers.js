export function getContainerDimensions(selector) {
    const container = document.querySelector(selector);
    const dimensions = container.getBoundingClientRect();
    return {
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
    };
}

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
