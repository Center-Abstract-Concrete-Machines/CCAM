export function isEventUpcoming(eventData) {
    if (eventData.endDate instanceof Date) {
        return Date.now() < eventData.endDate.getTime();
    } else return true; // Such as if endDate is string 'ongoing'
}

export function isAfterPubDate(eventData) {
    return eventData.pubDate < Date.now();
}

export function sortByPubDate(array) {
    return array.sort(
        (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
    );
}
