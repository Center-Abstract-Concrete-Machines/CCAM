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
    // console.log('today', today.format());
    // const eventDate = dayjs.utc(date).tz('America/Chicago', true).endOf('day');
    const eventDate = dayjs.utc(date).tz('America/Chicago', true).endOf('day');
    // console.log('eventDate', eventDate.format());
    // console.log('test', today.isSameOrBefore(eventDate));
    return today.isSameOrBefore(eventDate);
}

export function isEventUpcoming(eventData) {
    if (eventData.endDate instanceof Date) {
        return isDateUpcoming(eventData.endDate);
    } else return true; // Such as if endDate is string 'ongoing'
}

export function isAfterPubDate(eventData) {
    const today = dayjs(new Date());
    // console.log('today', today.format());
    const pubDate = dayjs.utc(eventData.pubDate).tz('America/Chicago', true);
    // console.log('pubDate', pubDate.format());
    // console.log('test', today.isSameOrAfter(pubDate, 'day'));
    return today.isSameOrAfter(pubDate);
}

export function sortDescByEndDate(a, b) {
    const aDate = a.data.endDate;
    const bDate = b.data.endDate;
    // console.log('aDate', aDate);
    // console.log('bDate', bDate);
    if (aDate instanceof Date && bDate instanceof Date) {
        // console.log('sorting...');
        return bDate.getTime() - aDate.getTime();
    } else if (typeof aDate === 'string' && typeof bDate === 'string') {
        // console.log('both string');
        return 0;
    } else if (typeof aDate === 'string') {
        // console.log('a string');
        return -1;
    } else if (typeof bDate === 'string') {
        // console.log('b string');
        return 1;
    }
}
export function sortAscByEndDate(a, b) {
    const aDate = a.data.endDate;
    const bDate = b.data.endDate;
    // console.log('aDate', aDate);
    // console.log('bDate', bDate);
    if (aDate instanceof Date && bDate instanceof Date) {
        // console.log('sorting...');
        return aDate.getTime() - bDate.getTime();
    } else if (typeof aDate === 'string' && typeof bDate === 'string') {
        // console.log('both string');
        return 0;
    } else if (typeof aDate === 'string') {
        // console.log('a string');
        return 1;
    } else if (typeof bDate === 'string') {
        // console.log('b string');
        return -1;
    }
}

export function filterDraftsAndPubDate({ data }) {
    // Don't filter drafts and prePubDate programs in DEV mode
    // DO filter in production
    return import.meta.env.DEV || (!data.draft && isAfterPubDate(data));
}
