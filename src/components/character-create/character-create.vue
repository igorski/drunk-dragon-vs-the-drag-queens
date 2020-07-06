<template>
    <div>
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
            <input type="range" min="0" max="2" v-model.number="appearance.eyes" />
            <input type="range" min="0" max="3" v-model.number="appearance.mouth" />
            <input type="range" min="0" max="6" v-model.number="appearance.hair" />
            <input type="range" min="0" max="4" v-model.number="appearance.jewelry" />
            <button v-t="'randomize'"
                    type="button"
                    title="$t('randomize')"
                    @click="randomize"
            ></button>
        </template>
        <button
            v-t="'done'"
            type="button"
            title="$t('save')"
            :disabled="!isValid"
            @click="saveCharacter"
        ></button>
        <character :character="character" />
    </div>
</template>

<script>
import CharacterFactory from '@/model/factories/character-factory';
import InventoryFactory from '@/model/factories/inventory-factory';
import Character from '@/components/character/character-female';
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
        },
        saveCharacter() {
            this.$emit( 'input', this.character );
        }
    }
};
</script>

<style lang="scss" scoped>

</style>
