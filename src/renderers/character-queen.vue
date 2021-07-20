<template>
    <div class="queen" :style="scaledCharacterSize">
        <div class="queen__body" :style="scaledBodySize">
            <svg width="100%" height="100%" viewBox="-41 15 486.11499999999995 579.53">
                <path class="queen__body__skin" :fill="skin" d="M41.162,592.5h403.133c-17-91-44-119-44-119c-18-21-45-24-45-24c-6-0.074-31.5-14-31.5-14
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
        <img v-for="(part, index) in scaledBodyParts"
             :key="index"
             :src="part.src"
             :style="part.style"
             class="queen__body-part"
        />
    </div>
</template>

<script>
import { QUEEN_ASSET_PATH, QUEEN_DIMENSIONS, fileSuffix } from "@/definitions/character-types";

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
            return `${QUEEN_ASSET_PATH}shadows.png`;
        },
        nose() {
            return `${QUEEN_ASSET_PATH}nose_${fileSuffix(this.appearance.nose)}.png`;
        },
        hair() {
            return `${QUEEN_ASSET_PATH}hair_${fileSuffix(this.appearance.hair)}.png`;
        },
        eyes() {
            return `${QUEEN_ASSET_PATH}eyes_${fileSuffix(this.appearance.eyes)}.png`;
        },
        mouth() {
            return `${QUEEN_ASSET_PATH}mouth_${fileSuffix(this.appearance.mouth)}.png`;
        },
        clothes() {
            return `${QUEEN_ASSET_PATH}clothes_${fileSuffix(this.appearance.clothes)}.png`;
        },
        jewelry() {
            return `${QUEEN_ASSET_PATH}jewelry_${fileSuffix(this.appearance.jewelry)}.png`;
        },
        scaledCharacterSize() {
            const { width, height } = QUEEN_DIMENSIONS.bounds;
            return {
                width: `${width * this.scale}px`,
                height: `${height * this.scale}px`
            };
        },
        scaledBodySize() {
            const { top, left, width, height } = QUEEN_DIMENSIONS.body;
            return {
                top: `${top * this.scale}px`,
                left: `${left * this.scale}px`,
                width: `${width * this.scale}px`,
                height: `${height * this.scale}px`,
            };
        },
        scaledBodyParts() {
            const { parts } = QUEEN_DIMENSIONS;
            return Object.keys( parts ).reduce(( acc, key ) => {
                const { top, left, width, height } = parts[ key ];
                acc[ key ] = {
                    src: this[key],
                    style: {
                        top: `${top * this.scale}px`,
                        left: `${left * this.scale}px`,
                        width: `${width * this.scale}px`,
                        height: `${height * this.scale}px`
                    }
                };
                return acc;
            }, {});
        },
    },
};
</script>

<style lang="scss" scoped>
@import "@/styles/_colors.scss";
@import "@/styles/_mixins.scss";

.queen {
    position: relative;
    @include noSelect();
    @include noEvents();
    border-radius: 50%;
    background-color: $color-2;
    overflow: hidden;

    &__body {
        position: absolute;

        &__skin {
            transition: fill .4s ease;
        }

        &-part {
            position: absolute;
        }
    }
}
</style>
