<template>
    <div class="actions">
        <h3 v-t="'actions'"></h3>
        <div
            class="actions__inline-group"
            @mouseleave="setHoverItem( null )"
        >
            <button
                v-t="'askQuestion'"
                type="button"
                class="rpg-ghost-button actions__inline-group--element"
                @touchstart="setHoverItem( 'question' )"
                @mouseenter="setHoverItem( 'question' )"
                @mouseleave="setHoverItem( null )"
            ></button>
            <ul
                class="actions actions__list-container"
                v-show="hoverItem === 'question'"
                @mouseenter="setHoverItem( 'question' )"
            >
                <li>
                    <button
                        v-t="'hi'"
                        type="button"
                        class="rpg-ghost-button"
                        @click="interact(0)"
                    ></button>
                </li>
                <li>
                    <button
                        v-t="'whatsGoingOn'"
                        type="button"
                        class="rpg-ghost-button"
                        @click="interact(1)"
                    ></button>
                </li>
                <li>
                    <button
                        v-t="'needSomeHelp'"
                        type="button"
                        class="rpg-ghost-button"
                        @click="interact(2)"
                    ></button>
                </li>
            </ul>
        </div>
        <div
            class="actions__inline-group"
            @mouseleave="setHoverItem( null )"
        >
            <button
                v-t="'analyze'"
                type="button"
                class="rpg-ghost-button actions--inline-group--element"
                @touchstart="setHoverItem( 'analyze' )"
                @mouseenter="setHoverItem( 'analyze' )"
            ></button>
            <div
                class="actions actions__list-container"
                v-show="hoverItem === 'analyze'"
                @mouseenter="setHoverItem( 'analyze' )"
            >
                <div class="character-stats">
                    <h4 v-t="'charisma'"></h4>
                    <span>{{ $t( "charismaPct", { pct: formattedCharisma }) }}</span>
                </div>
                <span v-if="intoxicationState" class="character-stats__block">{{ intoxicationState }}</span>
                <span v-if="boostState" class="character-stats__block">{{ boostState }}</span>
            </div>
        </div>
        <div
            class="actions__inline-group"
            @mouseleave="setHoverItem( null )"
        >
            <button
                v-t="'useItem'"
                type="button"
                :disabled="!player.inventory.items.length"
                class="rpg-ghost-button actions__inline-group--element"
                @touchstart="setHoverItem( 'inventory' )"
                @mouseenter="setHoverItem( 'inventory' )"
            ></button>
            <inventory
                v-show="hoverItem === 'inventory'"
                :player="player"
                list-only
                class="actions actions__list-container"
                @mouseenter="setHoverItem( 'inventory' )"
            />
        </div>
        {{ directionToIsland }}
        <div class="actions__inline-group">
            <button
                v-t="'slap'"
                type="button"
                class="rpg-ghost-button"
                @click="fight()"
            ></button>
        </div>
        <div class="actions__inline-group">
            <button
                v-t="'leave'"
                type="button"
                class="rpg-ghost-button"
                @click="leave()"
            ></button>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import { SCREEN_BATTLE } from "@/definitions/screens";
import CharacterActions from "@/model/actions/character-actions";
import Inventory from "@/components/inventory/inventory";
import { WORLD_TILES } from "@/model/factories/world-factory";
import ActionsUI from "@/mixins/actions-ui";
import { randomFromList } from "@/utils/random-util";
import { formatPercentage } from "@/utils/string-util";
import { indexToCoordinate } from "@/utils/terrain-util";
import messages from "./messages.json";

export default {
    i18n: { messages },
    components: {
        Inventory,
    },
    mixins: [ ActionsUI ],
    data: () => ({
        answers: {}, // only provide the same answer
    }),
    computed: {
        ...mapGetters([
            "building",
            "character",
            "player",
            "world",
        ]),
        /* character properties */
        charisma() {
            return CharacterActions.getCharisma( this.player, this.character );
        },
        formattedCharisma() {
            return formatPercentage( this.charisma );
        },
        intoxicationState() {
            const { intoxication } = this.character.properties;
            if ( intoxication > 0.75 ) {
                return this.$t( "seemsHighlyDrunk" );
            } else if ( intoxication > 0.5 ) {
                return this.$t( "seemsIntoxicated" );
            } else if ( intoxication > 0.25 ) {
                return this.$t( "seemsLittleTipsy" );
            }
            return null;
        },
        boostState() {
            const { boost } = this.character.properties;
            if ( boost > 0.75 ) {
                return this.$t( "seemsHighlyBoosted" );
            } else if ( boost > 0.5 ) {
                return this.$t( "seemsHyper" );
            } else if ( boost > 0.25 ) {
                return this.$t( "seemsSlightlyTense" );
            }
            return null;
        },
        /* help answers */
        directionToIsland() {
            const { x, y }    = this.building; // location of building in world
            const { terrain } = this.world;
            const caveEntranceIndex = terrain.findIndex( tile => tile === WORLD_TILES.CAVE );
            const caveCoords = indexToCoordinate( caveEntranceIndex, this.world );

            let out = "";
            if ( caveCoords.y > y ) {
                out = this.$t( "south" );
            } else if ( caveCoords.y < y ) {
                out = this.$t( "north" );
            }
            if ( caveCoords.x > x ) {
                out = `${out}${this.$t( "east" )}`;
            } else if ( caveCoords.x < x ) {
                out = `${out}${this.$t( "west" )}`;
            }
            return out;
        },
    },
    methods: {
        ...mapMutations([
            "setScreen",
        ]),
        ...mapActions([
            "startBattle",
        ]),
        interact( type ) {
            let list;
            switch ( type ) {
                case 0:
                    list = this.$t( "answers.hi" );
                    break;
                case 1:
                    list = this.$t( "answers.whatsGoingOn" );
                    break;
                case 2:
                    // Queens only help those they like
                    if ( this.charisma > 0.5 ) {
                        list = this.$t( "answers.needSomeHelp", { direction: this.directionToIsland } );
                        // interaction goal met, remove character
                        window.setTimeout(() => {
                            this.leave();
                            this.removeCharacter( this.character );
                        }, 5000 );
                    } else {
                        list = this.$t( "answers.iDontKnowYou" );
                    }
                    break;
            }
            const answerMessage  = this.answers[ type ] || randomFromList( list );
            this.answers[ type ] = answerMessage; // provide the same answer per type per interaction
            this.updateMessage( answerMessage );
        },
        fight() {
            this.startBattle( this.character );
            this.setScreen( SCREEN_BATTLE );
        },
        leave() {
            this.$emit( "close" );
        },
        updateMessage( message ) {
            this.$emit( "message", message );
        }
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/actions";

.character-stats {
    display: inline-block;
    vertical-align: top;
    margin-right: $spacing-medium;

    h4 {
        font-size: 16px;
        display: inline;
        margin-right: $spacing-medium;
    }

    span {
        display: inline;
    }

    &__block {
        display: block;
    }
}
</style>
