import { prefersReduced } from './prefersReducedMotion';
// const colors = ['#747fef', '#a5f91d', '#ffd500'];
const colors = [
    'hsl(216deg 100% 73%)',
    'hsl(216deg 100% 73%)',
    'hsl(83deg 95% 55%)',
    'hsl(83deg 95% 55%)',
    'hsl(25deg 100% 55%)',
    'hsl(235deg 79% 70%)',
    'hsl(235deg 79% 70%)',
    'hsl(50deg 100% 50%)',
    'currentColor',
];
const classes = [
    ['font-sans', 'font-medium'],
    ['font-moonbase', 'mbsq'],
    ['font-moonbase', 'mbrd'],
];
const elements = document.getElementsByClassName('morpher');
let classState = [];
let timers = [];

if (!prefersReduced) {
    document.addEventListener('astro:page-load', () => {
        for (let i = 0; i < elements.length; i++) {
            const timeoutId = setTimeout(
                () => {
                    classify(i);
                },
                1000 + Math.random() * 3000
            );
            timers.push(timeoutId);
        }
    });

    document.addEventListener('astro:before-preparation', () => {
        timers.forEach((id) => clearTimeout(id));
        timers = [];
    });
}

function classify(i) {
    let newClasses = classes[Math.floor(Math.random() * classes.length)];
    let newColor = colors[Math.floor(Math.random() * colors.length)];

    for (let n of newClasses) {
        elements[i].classList.add(n);
    }
    elements[i].style.color = newColor;

    classState[i] = newClasses;
    let duration = 1000 + Math.random() * 20000;
    const timeoutId = setTimeout(() => {
        declassify(i);
    }, duration);
    timers.push(timeoutId);
}

function declassify(i) {
    for (let s of classState[i]) {
        elements[i].classList.remove(s);
    }
    classify(i);
}
