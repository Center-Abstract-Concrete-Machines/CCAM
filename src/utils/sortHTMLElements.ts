export type SortOrder = 'dateAsc' | 'dateDesc' | 'alphaAsc' | 'alphaDesc';

export function sortEm(
    array: NodeListOf<HTMLDivElement>,
    order: SortOrder
): Array<HTMLDivElement> {
    if (order === 'dateAsc') {
        return Array.from(array).sort(
            (a, b) => parseInt(a.dataset.date) - parseInt(b.dataset.date)
        );
    } else if (order === 'dateDesc') {
        return Array.from(array).sort(
            (a, b) => parseInt(b.dataset.date) - parseInt(a.dataset.date)
        );
    } else if (order === 'alphaAsc') {
        return Array.from(array).sort((a, b) =>
            a.dataset.title.localeCompare(b.dataset.title)
        );
    } else if (order === 'alphaDesc') {
        return Array.from(array).sort((a, b) =>
            b.dataset.title.localeCompare(a.dataset.title)
        );
    }
}

export function doSorts(
    parentContainer: HTMLElement,
    array: NodeListOf<HTMLDivElement>,
    value: SortOrder
) {
    switch (value) {
        case 'dateAsc':
            parentContainer.replaceChildren(...sortEm(array, 'dateAsc'));
            sessionStorage.setItem('sortResources', 'dateAsc');
            break;
        case 'dateDesc':
            parentContainer.replaceChildren(...sortEm(array, 'dateDesc'));
            sessionStorage.setItem('sortResources', 'dateDesc');
            break;
        case 'alphaAsc':
            parentContainer.replaceChildren(...sortEm(array, 'alphaAsc'));
            sessionStorage.setItem('sortResources', 'alphaAsc');
            break;
        case 'alphaDesc':
            parentContainer.replaceChildren(...sortEm(array, 'alphaDesc'));
            sessionStorage.setItem('sortResources', 'alphaDesc');
            break;
    }
}
