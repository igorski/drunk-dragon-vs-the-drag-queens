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
import Inventory from "@/components/inventory/inventory.vue";
import { WORLD_TILES } from "@/model/factories/world-factory";
import ActionsUI from "@/mixins/actions-ui";
import { randomFromList } from "@/utils/random-util";
import { formatPercentage, firstName } from "@/utils/string-util";
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
            return Math.max( 0, CharacterActions.getCharisma( this.player, this.character ));
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
            "removeCharacter",
            "setScreen",
        ]),
        ...mapActions([
            "startBattle",
        ]),
        interact( type ) {
            if ( this.locked ) {
                return;
            }
            // all possible interpolation keys (this is a bit overkill but hey, it works for now)
            const opts = {
                playerName : firstName( this.player.appearance.name ),
                name       : firstName( this.character.appearance.name ),
                direction  : this.directionToIsland
            };
            const answerList = messages[ this.$i18n.locale ].answers;
            let list;
            switch ( type ) {
                case 0:
                    list = answerList[ "hi" ];
                    break;
                case 1:
                    list = answerList[ "whatsGoingOn" ];
                    break;
                case 2:
                    // Queens only help those they like
                    if ( Math.round( this.charisma * 100 ) >= 50 ) {
                        this.answers[ type ] = null;
                        list = answerList[ "needSomeHelp" ];
                        // interaction goal met, remove character
                        this.locked = true;
                        window.setTimeout(() => {
                            this.leave();
                            this.removeCharacter( this.character );
                        }, 5000 );
                    } else {
                        list = answerList[ "iDontKnowYou" ];
                    }
                    break;
            }
            const answerMessage  = this.answers[ type ] || randomFromList( list );
            this.answers[ type ] = answerMessage; // provide the same answer per type per interaction
            this.updateMessage( Object.entries( opts ).reduce(( acc, [ key, value ] ) => {
                acc = acc.replace( `{${key}}`, value, acc );
                return acc;
            }, answerMessage ));
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
