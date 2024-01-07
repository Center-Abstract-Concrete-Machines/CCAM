export default function Tag({ tag }) {
    const bgColors = new Map([
        ['event', 'bg-Blue'],
        ['workshop', 'bg-Orange'],
        ['study', 'bg-Green'],
    ]);
    return (
        <button
            className={`text-Black whitespace-nowrap px-4 py-2 ${bgColors.get(
                tag.toLowerCase()
            )}`}
        >
            {tag}
        </button>
    );
}
