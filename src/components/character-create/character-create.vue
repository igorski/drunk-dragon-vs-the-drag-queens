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
        </template>
        <button
            v-t="'done'"
            type="button"
            title="'save'"
            :disabled="!isValid"
            @click="saveCharacter"
        ></button>
        {{ character }}
    </div>
</template>

<script>
import CharacterFactory from '@/model/factories/character-factory';
import InventoryFactory from '@/model/factories/inventory-factory';
import messages from './messages.json';

const DEFAULT_CASH = 50;

const createCharacter = (sex, name) => CharacterFactory.create({ sex, name }, null, InventoryFactory.create( DEFAULT_CASH ));

export default {
    i18n: { messages },
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
        saveCharacter() {
            this.$emit( 'input', this.character );
        }
    }
};
</script>
