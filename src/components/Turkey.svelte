<script lang="ts">
    import { onMount } from 'svelte';
    import { Sprite } from '@utils/sprite';
    let turkey: HTMLDivElement;
    let turkeyContainer: HTMLDivElement;
    let gobble;

    onMount(() => {
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
    });

    function turkeyAdjust() {
        const pixelsPerSecond = 30;
        const width = turkeyContainer.clientWidth;
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
</script>

<div class="turkey-container" bind:this={turkeyContainer}>
    <div class="turkey" bind:this={turkey} on:click={gobblegobble}></div>
</div>

<style>
    :root {
        --turkey-width: 75px;
        --animation-duration: 30s;
    }

    .turkey-container {
        position: relative;
        height: var(--turkey-width);
        overflow: hidden;
        border-bottom: 1px dashed hsl(var(--borders) / 20%);
    }

    .turkey {
        background-image: url('/assets/turkey/turkey.png');
        height: var(--turkey-width);
        width: var(--turkey-width);
        background-position: bottom;
        background-repeat: no-repeat;
        background-size: cover;
        position: absolute;
        bottom: 0;
        left: calc(-1 * var(--turkey-width));
        animation-name: trot;
        animation-duration: var(--animation-duration);
        animation-direction: normal;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
    }

    .turkey:hover {
        cursor: pointer;
    }

    @keyframes trot {
        0% {
            left: calc(-2 * var(--turkey-width));
        }
        100% {
            left: 100%;
        }
    }

    @media (prefers-reduced-motion) {
        .turkey {
            animation: none;
        }
    }
</style>
