import dayjs from "dayjs";
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

export function isDateUpcoming(date) {
    const today = dayjs(new Date());
    const eventDate = dayjs.utc(date).tz('America/Chicago', true).endOf('day')
    return today.isSameOrBefore(eventDate, 'date');
}

export function isEventUpcoming(eventData) {
    if (eventData.endDate instanceof Date) {
        return isDateUpcoming(eventData.endDate)
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
