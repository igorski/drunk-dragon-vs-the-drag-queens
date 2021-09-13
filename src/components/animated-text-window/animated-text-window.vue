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
        words : [], // sentence split into individual words
        index : 0,  // index of last visible word
    }),
    computed: {
        textSnippet() {
            return this.words.slice( 0, this.index ).join( " " );
        },
        total() {
            return this.words.length;
        },
    },
    watch: {
        text: {
            immediate: true,
            handler( value ) {
                this.clearInterval();
                this.words  = value.split( " " );
                this.index  = 0;
                this.handleInterval();
            }
        }
    },
    beforeDestroy() {
        this.clearInterval();
    },
    methods: {
        handleInterval() {
            if ( ++this.index >= this.total ) {
                this.displayFullText();
            } else {
                // the interval is actually a series of timeouts as we alternate
                // between character type speed and add occassional pauses
                const lastWord    = this.words[ this.index - 1 ];
                const currentWord = this.words[ this.index ];
                let timeout = randomInRangeInt( MIN_TYPE_SPEED, MAX_TYPE_SPEED ) * currentWord.length;
                // slightly longer pause on end of sentence
                if ( lastWord?.endsWith( "." )) {
                    timeout += 650;
                    console.warn("exteeeend");
                }
                this.textInterval = window.setTimeout( this.handleInterval.bind( this ), timeout );
            }
        },
        handleClick() {
            if ( this.index < this.total ) {
                this.displayFullText();
            } else {
                window.clearTimeout( this.completeTimeout );
                this.$emit( "next" );
            }
        },
        displayFullText() {
            this.clearInterval();
            this.index = this.total;
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
