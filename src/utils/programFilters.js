export function isEventUpcoming(eventData) {
    if (eventData.endDate instanceof Date) {
        return Date.now() < eventData.endDate.getTime();
    } else return true; // Such as if endDate is string 'ongoing'
}

export function isAfterPubDate(eventData) {
    return eventData.pubDate < Date.now();
}

export function sortByPubDate(a, b) {
    return b.data.pubDate.getTime() - a.data.pubDate.getTime();
}

export function filterDraftsAndPubDate({ data }) {
    // Don't filter drafts and prePubDate programs in DEV mode
    // DO filter in production
    return import.meta.env.DEV || (!data.draft && isAfterPubDate(data));
}
