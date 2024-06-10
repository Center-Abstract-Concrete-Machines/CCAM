export default function getContainerDimensions(selector) {
    const container = document.querySelector(selector);
    const dimensions = container.getBoundingClientRect();
    return {
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
    };
}
