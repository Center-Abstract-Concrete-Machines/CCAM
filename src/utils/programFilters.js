import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(utc);
dayjs.extend(timezone);

export function isDateUpcoming(date) {
    const today = dayjs(new Date());
    const eventDate = dayjs.utc(date).tz('America/Chicago', true).endOf('day');
    return today.isSameOrBefore(eventDate, 'date');
}

export function isEventUpcoming(eventData) {
    if (eventData.endDate instanceof Date) {
        return isDateUpcoming(eventData.endDate);
    } else return true; // Such as if endDate is string 'ongoing'
}

export function isAfterPubDate(eventData) {
    const today = dayjs(new Date());
    const pubDate = dayjs.utc(eventData.pubDate).tz('America/Chicago', true);
    return today.isSameOrAfter(pubDate, 'date');
}

export function sortByPubDate(a, b) {
    return b.data.pubDate.getTime() - a.data.pubDate.getTime();
}

export function filterDraftsAndPubDate({ data }) {
    // Don't filter drafts and prePubDate programs in DEV mode
    // DO filter in production
    return import.meta.env.DEV || (!data.draft && isAfterPubDate(data));
}
