const colors = ['#747fef', '#a5f91d', '#ffd500'];
const classes = [
    ['font-sans', 'font-medium'],
    ['font-moonbase', 'mbsq'],
    ['font-moonbase', 'mbrd'],
];
const elements = document.getElementsByClassName('morpher');
let classState = [];

document.addEventListener('astro:page-load', () => {
    console.log('running morpher');
    for (let i = 0; i < elements.length; i++) {
        classify(i);
    }
});

function classify(i) {
    let newClasses = classes[Math.floor(Math.random() * classes.length)];
    let newColor = colors[Math.floor(Math.random() * colors.length)];

    for (let n of newClasses) {
        elements[i].classList.add(n);
    }
    elements[i].style.color = newColor;

    classState[i] = newClasses;
    let duration = 1000 + Math.random() * 2000;
    setTimeout(() => {
        declassify(i);
    }, duration);
}

function declassify(i) {
    for (let s of classState[i]) {
        elements[i].classList.remove(s);
    }
    classify(i);
}

// TODO: add event listener to unregister setTimeout on navigation away
