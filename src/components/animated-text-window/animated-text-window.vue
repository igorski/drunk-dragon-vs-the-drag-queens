<template>
    <div
        class="animated-text"
        :style="{
            'width'      : `${width}px`,
            'min-height' : `${height}px`
        }"
        @click="handleClick()"
    >
        <h2
            v-if="title"
            class="title"
        >{{ title }}</h2>
        {{ textSnippet }}
    </div>
</template>

<script>
import { randomInRangeInt } from "@/utils/random-util";

const MIN_TYPE_SPEED = 35;   // ms per character
const MAX_TYPE_SPEED = 75;   // ms per character
const FINAL_DURATION = 3000; // ms timeout after full text is displayed

export default {
    props: {
        text: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: false,
        },
        width: {
            type: Number,
            default: 300,
        },
        height: {
            type: Number,
            default: 200
        }
    },
    data: () => ({
        ticks: 0,
    }),
    computed: {
        textSnippet() {
            return this.text.substr( 0, this.ticks );
        },
        total() {
            return this.text.length;
        },
    },
    watch: {
        text: {
            immediate: true,
            handler( value ) {
                this.clearInterval();
                this.ticks = 0;
                this.handleInterval();
            }
        }
    },
    beforeDestroy() {
        this.clearInterval();
    },
    methods: {
        handleInterval() {
            if ( ++this.ticks >= this.total ) {
                this.displayFullText();
            } else {
                // the interval is actually a series of timeouts as we alternate
                // between character type speed and add occassional pauses
                let timeout = randomInRangeInt( MIN_TYPE_SPEED, MAX_TYPE_SPEED );
                if ( this.text.charAt( this.ticks - 1 ) === "." ) {
                    timeout += 650;
                }
                this.textInterval = window.setTimeout( this.handleInterval.bind( this ), timeout );
            }
        },
        handleClick() {
            if ( this.ticks < this.total ) {
                this.displayFullText();
            } else {
                window.clearTimeout( this.completeTimeout );
                this.$emit( "next" );
            }
        },
        displayFullText() {
            this.clearInterval();
            this.ticks = this.total;
            this.completeTimeout = window.setTimeout(() => {
                this.$emit( "displayed" );
            }, FINAL_DURATION );
        },
        clearInterval() {
            window.clearTimeout( this.textInterval );
        },
    },
};
</script>

<style lang="scss" scoped>
@import "@/styles/_layout.scss";

.animated-text {
    @include boxSize();
    @include noSelect();
    cursor: pointer;
    padding: $spacing-medium $spacing-large $spacing-large;
    display: inline-block;
    border: 3px solid $color-4;
    background-color: $color-1;
    border-top-width: 4px;
    border-radius: 7px;
    color: #FFF;

    @include mobile() {
        @include scrollableWindow();
        width: 100% !important;
    }
}

.title {
    display: block;
    text-align: center;
    margin: 0;
    color: $color-5;
}
</style>
