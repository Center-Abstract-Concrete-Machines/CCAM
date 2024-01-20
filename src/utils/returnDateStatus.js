export function returnDateStatus(endDate) {
    if (endDate === 'ongoing') {
        return 'Ongoing';
    } else if (Date.now() < endDate.getTime()) {
        return 'Upcoming';
    } else {
        return 'Past';
    }
}
