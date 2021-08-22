<template>
    <modal
        :title="character.appearance.name"
        class="interaction-modal"
        @close="close()"
    >
        <component
            :is="interactionComponent"
            class="interaction-ui"
            @message="setMessage( $event )"
            @close="close()"
        />
        <div class="character">
            <div v-if="message"
                 class="speech-bubble"
                 @click="message = null"
             >{{ processedMessage }}</div>
             <div v-if="thought"
                  class="thought-bubble"
                  @click="thought = null"
             >{{ thought }}</div>
             <center>
                 <component
                    class="character--preview"
                    :is="characterComponent"
                    :character="character"
                    :width="characterWidth"
                />
            </center>
        </div>
    </modal>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Modal from "@/components/modal/modal";
import ItemTypes from "@/definitions/item-types";
import { FLOOR_TYPES } from "@/model/factories/building-factory";
import { randomInRangeFloat } from "@/utils/random-util";
import { slurWords } from "@/utils/string-util";

export default {
    components: {
        Modal,
    },
    data: () => ({
        message: "",
        thought: "",
    }),
    computed: {
        ...mapState([
            "dimensions",
        ]),
        ...mapGetters([
            "activeEnvironment",
            "character",
            "player",
        ]),
        characterComponent() {
            // TODO: currently we only interact with queens?
            return () => import("@/renderers/character-queen");
        },
        characterWidth() {
            const ideal = 300; /* see _variables@mobile-width */
            const { width } = this.dimensions;
            return Math.min( ideal, width * .9 );
        },
        processedMessage() {
            return slurWords( this.message, this.intoxication );
        },
        isBarInteraction() {
            return this.activeEnvironment.floorType === FLOOR_TYPES.BAR;
        },
        interactionComponent() {
            // Queens only appear in front of building doors or in bar type floors (for now)
            if ( this.isBarInteraction ) {
                return () => import( "./bar-interaction/bar-interaction" );
            } else {
                return () => import( "./door-interaction/door-interaction" );
            }
        }
    },
    created() {
        const { properties } = this.character;
        this.intoxication = properties.intoxication;
        // door interactions with characters that have a liquor intent, should also slur to reflect their intent
        if ( !this.isBarInteraction && properties.intent.type === ItemTypes.LIQUOR ) {
            this.intoxication = randomInRangeFloat( 0.35, 1 );
        }
    },
    methods: {
        setMessage( value ) {
            this.message = value;
        },
        close() {
            this.$emit( "close" );
        }
    },
};
</script>

<style lang="scss" scoped>
@import "@/styles/_variables";

.interaction-modal {
    @include large() {
        max-width: 515px;
        height: 375px;
    }
    overflow: visible; // speech bubble
    /deep/ .modal__content {
        overflow: visible !important;
    }
}

.interaction-ui, .character {
    display: inline-block;
    position: relative;
    vertical-align: top;
}

.character {
    @include large() {
        position: absolute;
        top: $spacing-large;
        right: -$spacing-medium;
    }
    @include mobile() {
        margin-top: $spacing-large;
        width: 100%; // will center align preview
    }

    &--preview {
        border: 4px solid $color-1;
    }
}

@mixin bubble() {
    position: absolute;
    z-index: 3;
    top: -$spacing-xlarge;
    font-family: sans-serif;
    font-size: 18px;
    line-height: 24px;
    background: #fff;
    text-align: center;
}

.speech-bubble {
    @include bubble();
    width: 300px;
    border-radius: 40px;
    padding: 24px;
    color: #000;

    &:before {
        content: "";
        width: 0;
        height: 0;
        position: absolute;
        border-left: 12px solid transparent;
        border-right: 24px solid #fff;
        border-top: 12px solid #fff;
        border-bottom: 20px solid transparent;
        left: 32px;
        bottom: -24px;
    }
}

.thought-bubble {
    @include bubble();
    z-index: 4;
    display: flex;
    padding: 20px;
    border-radius: 30px;
    min-width: 40px;
    max-width: 220px;
    min-height: 40px;
    align-items: center;
    justify-content: center;

    &:before,
    &:after {
        content: "";
        background-color: #fff;
        border-radius: 50%;
        display: block;
        position: absolute;
        z-index: -1;
    }

    &:before {
        width: 44px;
        height: 44px;
        top: -12px;
        left: 28px;
        box-shadow: -50px 30px 0 -12px #fff;
    }
    &:after {
        bottom: -10px;
        right: 26px;
        width: 30px;
        height: 30px;
        box-shadow: 40px -34px 0 0 #fff,
                    -28px -6px 0 -2px #fff,
                    -24px 17px 0 -6px #fff,
                    -5px 25px 0 -10px #fff;
    }
}
</style>
