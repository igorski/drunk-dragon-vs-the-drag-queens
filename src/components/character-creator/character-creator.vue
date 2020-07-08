<template>
    <div class="character-creator">
        <h1 v-t="'createCharacter'"></h1>
        <div class="flex flex--columns">
            <form class="character-creator__form"
                  @submit.prevent="saveCharacter"
            >
                <div>
                    <label v-t="'sex'" for="sex"></label>
                    <input type="radio" name="sex" value="M" v-model="sex">
                    <input type="radio" name="sex" value="F" v-model="sex">
                </div>
                <div>
                    <label v-t="'name'" for="name"></label>
                    <input type="text" name="name" v-model="appearance.name" />
                </div>
                <template v-if="character">
                    <div>
                        <label v-t="'skin'" for="skin"></label>
                        <input type="range" name="skin" min="0" :max="maxValues.skin - 1" v-model="skin" />
                    </div>
                    <div>
                        <label v-t="'eyes'" for="eyes"></label>
                        <input type="range" min="0" :max="maxValues.eyes - 1" v-model.number="appearance.eyes" />
                    </div>
                    <div>
                        <label v-t="'mouth'" for="mouth"></label>
                        <input type="range" min="0" :max="maxValues.mouth - 1" v-model.number="appearance.mouth" />
                    </div>
                    <div>
                        <label v-t="'hair'" for="hair"></label>
                        <input type="range" min="0" :max="maxValues.hair - 1" v-model.number="appearance.hair" />
                    </div>
                    <div>
                        <label v-t="'clothes'" for="clothes"></label>
                        <input type="range" min="0" :max="maxValues.clothes - 1" v-model.number="appearance.clothes" />
                    </div>
                    <div>
                        <label v-t="'jewelry'" for="jewelry"></label>
                        <input type="range" min="0" :max="maxValues.jewelry - 1" v-model.number="appearance.jewelry" />
                    </div>
                    <button v-t="'randomize'"
                            type="button"
                            title="$t('randomize')"
                            @click="randomize"
                    ></button>
                </template>
                <button
                    v-t="'done'"
                    type="submit"
                    title="$t('save')"
                    :disabled="!isValid"
                ></button>
            </form>
            <character
                class="character-creator__preview"
                :character="character"
                :width="characterWidth"
            />
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import CharacterFactory, { FEMALE_APPEARANCE, SKIN_COLORS } from '@/model/factories/character-factory';
import InventoryFactory from '@/model/factories/inventory-factory';
import Character from '@/renderers/character-female';
import messages from './messages.json';

const DEFAULT_CASH = 50;

const createCharacter = (sex, name) => CharacterFactory.create({ sex, name }, null, InventoryFactory.create( DEFAULT_CASH ));

export default {
    i18n: { messages },
    components: {
        Character,
    },
    data: () => ({
        character: createCharacter('F', ''),
    }),
    computed: {
        ...mapState([
            'dimensions',
        ]),
        appearance() {
            return this.character.appearance;
        },
        sex: {
            get() {
                return this.appearance.sex;
            },
            set( sex ) {
                this.character = createCharacter( sex, this.appearance.name );
            }
        },
        skin: {
            get() {
                return SKIN_COLORS.indexOf( this.appearance.skin );
            },
            set( index ) {
                this.appearance.skin = SKIN_COLORS[ index ];
            },
        },
        maxValues() {
            // TODO: this is F sex only
            return FEMALE_APPEARANCE;
        },
        characterWidth() {
            return 480; // TODO: calculate
        },
        isValid() {
            return this.character && this.appearance.name;
        },
    },
    watch: {
        name( value ) {
            if ( this.character ) {
                this.appearance.name = value;
            }
        }
    },
    methods: {
        randomize() {
            const randomized = CharacterFactory.generateAppearance( this.appearance.sex );

            this.appearance.skin    = randomized.skin;
            this.appearance.eyes    = randomized.eyes;
            this.appearance.hair    = randomized.hair;
            this.appearance.mouth   = randomized.mouth;
            this.appearance.jewelry = randomized.jewelry;
            this.appearance.clothes = randomized.clothes;
        },
        saveCharacter() {
            this.$emit( 'input', this.character );
        }
    }
};
</script>

<style lang="scss" scoped>
    @import '@/styles/_layout';

    .character-creator {
        @include window();
        width: 100%;

        &__form,
        &__preview {
            flex: 1;
        }
    }
</style>
