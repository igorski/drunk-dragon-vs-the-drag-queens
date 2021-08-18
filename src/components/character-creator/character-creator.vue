<template>
    <div class="character-creator">
        <h1 v-t="'createCharacter'"></h1>
        <div class="character-creator__wrapper">
            <character
                class="character-creator__preview"
                :character="character"
                :width="characterWidth"
                :background="false"
            />
            <transition-group name="slide">
                <!-- form 1 : character name -->
                <form v-if="form === 0"
                      key="form-1"
                      class="character-creator__form"
                      @submit.prevent="goToForm(1)"
                >
                    <fieldset class="rpg-fieldset">
                        <div class="input">
                            <label v-t="'name'" for="name"></label>
                            <input
                                ref="nameInput"
                                type="text" name="name"
                                v-model="appearance.name"
                                autocomplete="false"
                            />
                        </div>
                    </fieldset>
                    <div class="button-group">
                        <button
                            v-t="'randomName'"
                            type="button"
                            :title="$t('randomize')"
                            class="rpg-button rpg-button--submit"
                            @click="generateRandomName()"
                        ></button>
                        <button
                            v-t="'thatsMe'"
                            type="submit"
                            :title="$t('save')"
                            class="rpg-button rpg-button--submit"
                            :disabled="!isValid"
                        ></button>
                    </div>
                </form>
                <!-- form 2 character design -->
                <form v-if="form === 1"
                      key="form-2"
                      class="character-creator__form"
                      @submit.prevent="saveCharacter"
                >
                    <fieldset class="rpg-fieldset">
                        <template v-if="character">
                            <div class="input range">
                                <label v-t="'skin'" for="skin"></label>
                                <input type="range" name="skin" min="0" :max="maxValues.skin - 1" v-model="skin" />
                            </div>
                            <div class="input range">
                                <label v-t="'eyes'" for="eyes"></label>
                                <input type="range" min="0" :max="maxValues.eyes - 1" v-model.number="appearance.eyes" />
                            </div>
                            <div class="input range">
                                <label v-t="'mouth'" for="mouth"></label>
                                <input type="range" min="0" :max="maxValues.mouth - 1" v-model.number="appearance.mouth" />
                            </div>
                            <div class="input range">
                                <label v-t="'nose'" for="nose"></label>
                                <input type="range" min="0" :max="maxValues.nose - 1" v-model.number="appearance.nose" />
                            </div>
                            <div class="input range">
                                <label v-t="'hair'" for="hair"></label>
                                <input type="range" min="0" :max="maxValues.hair - 1" v-model.number="appearance.hair" />
                            </div>
                            <div class="input range">
                                <label v-t="'clothes'" for="clothes"></label>
                                <input type="range" min="0" :max="maxValues.clothes - 1" v-model.number="appearance.clothes" />
                            </div>
                            <div class="input range">
                                <label v-t="'jewelry'" for="jewelry"></label>
                                <input type="range" min="0" :max="maxValues.jewelry - 1" v-model.number="appearance.jewelry" />
                            </div>
                        </template>
                        <button v-t="'randomize'"
                                type="button"
                                :title="$t('randomize')"
                                class="rpg-button"
                                @click="randomize"
                        ></button>
                    </fieldset>
                    <button
                        v-t="'looksGood'"
                        type="submit"
                        :title="$t('save')"
                        class="rpg-button rpg-button--submit"
                        :disabled="!isValid"
                    ></button>
                </form>
            </transition-group>
        </div>
    </div>
</template>

<script>
import { mapState } from "vuex";
import PriceTypes from "@/definitions/price-types";
import CharacterFactory, { QUEEN_APPEARANCE, QUEEN_SKIN_COLORS } from "@/model/factories/character-factory";
import InventoryFactory from "@/model/factories/inventory-factory";
import Character from "@/renderers/character-queen";
import { isMobile } from "@/utils/browser-util";
import { generateDragQueenName } from "@/utils/name-generator";
import messages from "./messages.json";

// a little pocket money to begin with
const DEFAULT_CASH = PriceTypes.EXPENSIVE;

const createCharacter = name => CharacterFactory.create({ hp: 5 }, { name }, null, InventoryFactory.create( DEFAULT_CASH ));

export default {
    i18n: { messages },
    components: {
        Character,
    },
    data: () => ({
        form: 0,
        character: createCharacter( "" ),
    }),
    computed: {
        ...mapState([
            "dimensions",
        ]),
        appearance() {
            return this.character.appearance;
        },
        skin: {
            get() {
                return QUEEN_SKIN_COLORS.indexOf( this.appearance.skin );
            },
            set( index ) {
                this.appearance.skin = QUEEN_SKIN_COLORS[ index ];
            },
        },
        maxValues() {
            return QUEEN_APPEARANCE;
        },
        characterWidth() {
            const ideal = 685; /* see _variables@mobile-width */
            const { width } = this.dimensions;
            return Math.min( ideal, width * .9 );
        },
        isValid() {
            return this.character && this.appearance.name;
        },
    },
    mounted() {
        if ( !isMobile()) {
            this.$refs.nameInput.focus();
        }
    },
    methods: {
        randomize() {
            const randomized = CharacterFactory.generateAppearance();

            this.appearance.skin    = randomized.skin;
            this.appearance.eyes    = randomized.eyes;
            this.appearance.hair    = randomized.hair;
            this.appearance.mouth   = randomized.mouth;
            this.appearance.nose    = randomized.nose;
            this.appearance.jewelry = randomized.jewelry;
            this.appearance.clothes = randomized.clothes;
        },
        goToForm( index ) {
            this.form = !this.isValid ? 0 : Math.max( 0, index );
        },
        generateRandomName() {
            this.appearance.name = generateDragQueenName();
        },
        saveCharacter() {
            this.$emit( "input", this.character );
        },
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_layout.scss";
@import "@/styles/forms.scss";
@import "@/styles/animations.scss";

.character-creator {
    @include window();
    width: 100%;
    vertical-align: top;

    @include large() {
        &__wrapper {
            position: relative;
        }
        &__preview {
            position: absolute;
            left: 375px;
            top: -125px;
        }
    }

    @include mobile() {
        fieldset {
            width: 100%;
        }
        &__form {
            display: block;
            width: 90%;
        }
        &__preview {
            display: block;
            margin-top: -50px;
        }
    }

    .button-group {
        margin-left: $spacing-large;

        .rpg-button {
            display: inline-block;
            margin: $spacing-small $spacing-medium 0 0;
        }
    }
}
</style>
