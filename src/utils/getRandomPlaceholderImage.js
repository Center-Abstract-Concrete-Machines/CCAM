export function getRandomPlaceholderImage() {
    const personCardImages = import.meta.glob('src/images/person-cards/*.png');
    const keys = Object.keys(personCardImages);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return personCardImages[randomKey]();
}
