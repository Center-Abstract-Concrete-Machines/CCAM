import { useRef, useEffect } from 'preact/hooks';

export default function turkey() {
    const turkey = useRef(null);
    const turkeyContainer = useRef(null);
    let gobble;
    useEffect(() => {
        gobble = new Sprite({
            src: '/assets/turkey/turkey-sprite.m4a',
            sprite: {
                a: [0, 1000],
                b: [1000, 1000],
                c: [2000, 1100],
            },
        });
        turkeyAdjust();
        window.addEventListener('resize', turkeyAdjust);
        return () => window.removeEventListener('resize', turkeyAdjust);
    }, []);

    function turkeyAdjust() {
        const pixelsPerSecond = 30;
        const width = turkeyContainer.current.clientWidth;
        const seconds = width / pixelsPerSecond + 's';
        document.documentElement.style.setProperty(
            '--animation-duration',
            seconds
        );
    }

    function gobblegobble() {
        const sprites = ['a', 'b', 'c'];
        const randomSprite =
            sprites[Math.floor(Math.random() * sprites.length)];
        gobble.play(randomSprite);
    }

    return (
        <div class="turkey-container" ref={turkeyContainer}>
            <div class="turkey" ref={turkey} onClick={gobblegobble}></div>
        </div>
    );
}

class Sprite {
    constructor(settingsObj) {
        this.src = settingsObj.src;
        this.samples = settingsObj.sprite;

        this.init();
    }

    async init() {
        // Set up web audio
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        // Load file
        this.audioBuffer = await this.getFile();
    }
    async getFile() {
        // Request file
        const response = await fetch(this.src);
        if (!response.ok) {
            console.log(`${response.url} ${response.statusText}`);
            throw new Error(`${response.url} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        // console.log(audioBuffer);
        return audioBuffer;
    }

    play(sampleName) {
        const startTime = this.samples[sampleName][0] / 1000;
        const duration = this.samples[sampleName][1] / 1000;
        const sampleSource = this.ctx.createBufferSource();
        sampleSource.buffer = this.audioBuffer;
        sampleSource.connect(this.ctx.destination);
        sampleSource.start(this.ctx.currentTime, startTime, duration);
    }
}
