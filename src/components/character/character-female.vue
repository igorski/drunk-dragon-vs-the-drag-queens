<template>
    <div class="female" :style="`transform:scale(${scale})`">
        <div class="female__body">
            <svg width="100%" height="100%" viewBox="-41 15 486.11499999999995 579.53">
                <path class="female__body__skin" :fill="skin" d="M41.162,592.5h403.133c-17-91-44-119-44-119c-18-21-45-24-45-24c-6-0.074-31.5-14-31.5-14
                	c-14.5-12-40.5-28-40.5-28c-15.575-8.342-38.909-20.928-48.092-25.884c-7.167-17.464-5.703-43.871-5.703-43.871
                	c0.666-11.423,10.001-39.495,10.001-39.495S248.5,278.402,252,277.451l3.771,2.008c6.938,6.958,12.396-10.932,12.396-10.932
                	l2.756-7.327c1.841-2.904,3.911-5.366,3.911-5.366l0.917-0.833c0.917-0.833,2.75-2.5,6.416-5.833
                	c7.333-6.667,15.334-22.334,15.334-22.334c10-23.001,2.666-30.909,2.666-30.909c-0.917-1.489-1.812-2.656-2.679-3.559l-0.085-3.215
                	C318.156,77.272,218.5,29.5,218.5,29.5c-39-24-86.5-10-86.5-10C90.5,35,73.246,60.019,73.246,60.019
                	C69.235,66.299,63.006,76.5,63.006,76.5S55,92.5,50,111.5c0,0-7.5,12.5-9.5,27.5c0,0-0.721,4.548-0.326,11.49
                	c0,0,0.438,7.235-0.118,13.623L37.5,183.487l-3,7.539c0,0-4.5,13.974-2.5,26.474c0,0,1,19.004,2.5,25.002l2,13.749
                	c0,0,2.5,18.199,8.5,31.724l5,11.275c0,0,6.513,13.25,12.006,19.75l7.427,8.5c0,0,5.567,9,14.317,11c0,0,1.116,10.001-6.9,20.667
                	c0,0-3.514,3.334-9.099,6c0,0-29.608,9.334-36.263,12s-6.655,2.666-6.655,2.666s-10,0.668-19.333,32.001c0,0-10.667,46-22,73.333
                	c0,0-7.333,23.334-11.333,36.667l-11.333,22c0,0-2.667,6-2.667,13.333s0,7.333,0,7.333s-0.667,13.5,0,13.5l63.4,14.373l-0.021,0.127
                	h0.582l14.707,3.334C38.151,594.736,39.613,593.619,41.162,592.5z"
                />
            </svg>
        </div>
        <img :src="shadows" class="female__shadows" />
        <img :src="mouth" class="female__mouth" />
        <img :src="eyes" class="female__eyes" />
        <img :src="hair" class="female__hair" />
        <img :src="jewelry" class="female__jewelry" />
    </div>
</template>

<script>
import { getBaseURL } from '@/config';

const ASSET_PATH = `${getBaseURL()}assets/characters/female/`;

const fileSuffix = idx => {
    const filenum = idx + 1;
    return filenum < 10 ? `0${filenum}` : filenum;
};

export default {
    props: {
        character: {
            type: Object,
            required: true,
        },
        width: {
            type: Number,
            required: true,
        },
    },
    computed: {
        scale() {
            return this.width / 1280;
        },
        appearance() {
            return this.character.appearance;
        },
        skin() {
            return this.appearance.skin;
        },
        shadows() {
            return `${ASSET_PATH}shadows.png`;
        },
        hair() {
            return `${ASSET_PATH}hair_${fileSuffix(this.appearance.hair)}.png`;
        },
        jewelry() {
            return `${ASSET_PATH}jewelry_${fileSuffix(this.appearance.jewelry)}.png`;
        },
        eyes() {
            return `${ASSET_PATH}eyes_${fileSuffix(this.appearance.eyes)}.png`;
        },
        mouth() {
            return `${ASSET_PATH}mouth_${fileSuffix(this.appearance.mouth)}.png`;
        },
    },
};
</script>

<style lang="scss" scoped>
    @import "@/styles/_mixins.scss";

    .female {
        position: relative;
        background-color: purple;
        width: 1280px;
        height: 1296px;
        transform-origin: 0 0;
        @include noSelect();
        @include noEvents();

        &__body {
            position: absolute;
            width: 817px;
            height: 974px;
            left: 277px;
            top: 322px;

            &__skin {
                transition: fill .4s ease;
            }
        }

        &__shadows {
            position: absolute;
            width: 1280px;
            height: 756px;
            left: 0;
            top: 540px;
        }

        &__hair {
            position: absolute;
            width: 1280px;
            height: 1084px;
            left: 0;
            top: 0;
        }

        &__jewelry {
            position: absolute;
            width: 575px;
            height: 369px;
            left: 321px;
            top: 660px;
        }

        &__eyes {
            position: absolute;
            width: 341px;
            height: 140px;
            left: 409px;
            top: 491px;
        }

        &__mouth {
            position: absolute;
            width: 181px;
            height: 100px;
            left: 447px;
            top: 716px;
        }
    }
</style>
