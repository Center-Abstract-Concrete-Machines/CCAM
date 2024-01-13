export function getContainerDimensions() {
    const container = document.querySelector('#sketch');
    const dimensions = container.getBoundingClientRect();
    return {
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
    };
}
