/**
* The MIT License (MIT)
*
* Igor Zinken 2021 - https://www.igorski.nl
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
* the Software, and to permit persons to whom the Software is furnished to do so,
* subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
* FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
* COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
* IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
<template>
    <modal
        :title="title"
        :dismissible="battleWon"
        @close="close()"
    >
        <div class="actions">
            <h3 v-t="'actions'"></h3>
            <div
                class="actions__inline-group"
                @mouseleave="setHoverItem( null )"
            >
                <button
                    v-t="'attack'"
                    type="button"
                    :disabled="!canAttack"
                    class="rpg-ghost-button actions__inline-group--element"
                    @touchstart="setHoverItem( 'attack' )"
                    @mouseenter="setHoverItem( 'attack' )"
                ></button>
                <ul
                    class="actions actions__list-container"
                    v-show="hoverItem === 'attack' && canAttack"
                    @mouseenter="setHoverItem( 'attack' )"
                    @mouseleave="setHoverItem( null )"
                >
                    <li
                        v-for="(attackType, index) in attackTypesForPlayer"
                        :key="`attack_${index}`"
                        @click="attack( attackType.value )"
                    >
                        <button class="rpg-ghost-button">{{ attackType.text }}</button>
                    </li>
                </ul>
            </div>
            <button
                v-t="'runAway'"
                type="button"
                :disabled="!canAttack"
                class="rpg-ghost-button"
                @click="run()"
            ></button>
            <div
                class="actions__inline-group"
                @mouseleave="setHoverItem( null )"
            >
                <button
                    v-t="'useItem'"
                    type="button"
                    :disabled="!canAttack || !player.inventory.items.length"
                    class="rpg-ghost-button actions__inline-group--element"
                    @touchstart="setHoverItem( 'inventory' )"
                    @mouseenter="setHoverItem( 'inventory' )"
                ></button>
                <inventory
                    v-show="hoverItem === 'inventory' && canAttack"
                    :player="player"
                    list-only
                    class="actions actions__list-container"
                    @mouseenter="setHoverItem( 'inventory' )"
                    @select="setPlayerTurn( false )"
                />
            </div>
        </div>
        <div class="battle-group">
            <character-status :character="player" class="character-status" />
            <character-status v-if="opponent" :character="opponent" class="character-status" />
        </div>
        <!-- battle progress update messages -->
        <div v-if="messages.length" class="battle-messages">
            <p
                v-for="(message, index) in messages"
                :key="`msg_${index}`"
            >
                {{ message }}
            </p>
        </div>
    </modal>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import AttackTypes, { ATTACK_DODGED } from "@/definitions/attack-types";
import { QUEEN, DRAGON } from "@/definitions/character-types";
import ItemTypes, { MAGIC_SWORD } from "@/definitions/item-types";
import { SCREEN_GAME }  from "@/definitions/screens";
import Modal            from "@/components/modal/modal.vue";
import Inventory        from "@/components/inventory/inventory.vue";
import ActionsUI        from "@/mixins/actions-ui";
import InventoryActions from "@/model/actions/inventory-actions";
import CharacterStatus  from "./character-status/character-status.vue";
import messages         from "./messages.json";

export default {
    i18n: { messages },
    components: {
        Modal,
        Inventory,
        CharacterStatus,
    },
    mixins: [ ActionsUI ],
    data: () => ({
        timeout: null,
        messages: [],
        playerStats: {
            xp: 0,
            level: 1,
        },
    }),
    computed: {
        ...mapGetters([
            "player",
            "playerTurn",
            "battleWon",
            "opponent",
        ]),
        canAttack() {
            return !this.battleWon && this.player.hp > 0 && this.playerTurn;
        },
        attackTypesForPlayer() {
            const attacks = [
                // the basic types
                { text: this.$t( "slap" ), value: AttackTypes.SLAP },
                { text: this.$t( "kick" ), value: AttackTypes.KICK },
            ];
            const weapons = InventoryActions.getItemsOfType( this.player.inventory, ItemTypes.WEAPON );
            if ( weapons.some(({ name }) => name === MAGIC_SWORD )) {
                attacks.push({ text: this.$t( "swordSlash" ), value: AttackTypes.SWORD });
            }
            return attacks;
        },
    },
    watch: {
        playerTurn( value ) {
            if ( !value ) {
                this.setHoverItem( null ); // player turn unsets after using item
                if ( this.opponent?.hp ) {
                    this.executeOpponentAttack(); // opponent retaliates as long as its alive
                }
            }
        },
        battleWon( value ) {
            if ( !value ) {
                return;
            }
            this.messages = [];
            const { level, xp } = this.player;
            if ( xp > this.playerStats.xp ) {
                this.showNotification( this.$t( "youEarnedXp", { xp: xp - this.playerStats.xp } ));
            }
            if ( level > this.playerStats.level ) {
                this.showNotification( this.$t( "youAdvancedToLevel", { level }) );
            }
            if ( this.isFirstDragonBattle ) {
                this.openDialog({ message: this.$t( "youDefeatedDragon" ) });
            }
            this.close();
        }
    },
    created() {
        this.title = this.$t( "battleAgainstName", { name: this.opponent.appearance.name });
        const { xp, level } = this.player;

        this.playerStats.xp = xp;
        this.playerStats.level = level;

        if ( !this.playerTurn ) {
            this.openDialog({ message: this.$t( "youWereAmbushed" ) });
            this.executeOpponentAttack();
        }

        // first battle against dragon ?
        if ( xp === 0 && this.opponent.type === DRAGON ) {
            this.isFirstDragonBattle = true;
            this.openDialog({
                title: this.$t( "uhoh" ),
                message: this.$t( "firstDragonBattleExpl" )
            });
        }

        // opponent is Queen ?
        if ( this.opponent.type === QUEEN ) {
            this.openDialog({ message: this.$t( "bitchItsOn" )});
        }
    },
    methods: {
        ...mapMutations([
            "openDialog",
            "setScreen",
            "setPlayerTurn",
            "showNotification",
        ]),
        ...mapActions([
            "attackOpponent",
            "attackPlayer",
            "runFromOpponent"
        ]),
        async attack( type ) {
            const { success, prepareResult, damage } = await this.attackOpponent({ type });
            const name = this.opponent?.appearance?.name;
            if ( !success ) {
                this.messages = [ prepareResult === ATTACK_DODGED ? this.$t( "nameDodgedAttack", { name }) : this.$t( "attackMissed" ) ];
                return;
            }
            if ( this.opponent?.hp > 0 ) {
                this.messages = [ this.$t( "youDealtDamageToName", { damage, name }) ];
            }
        },
        async run() {
            const { name } = this.opponent.appearance;
            if ( await this.runFromOpponent() ) {
                this.showNotification( this.$t( "youEscapedFromBattlingName", { name }));
            } else {
                this.messages = [ this.$t( "cannotEscapeFromName", { name }) ];
                this.executeOpponentAttack();
            }
        },
        executeOpponentAttack() {
            if ( this.timeout || this.battleWon ) {
                return;
            }
            this.timeout = window.setTimeout( async () => {
                window.clearTimeout( this.timeout );
                this.timeout = null;

                const { success, prepareResult, damage } = await this.attackPlayer({ type: AttackTypes.BITE });
                const { name } = this.opponent.appearance;
                if ( !success ) {
                    this.messages = [ prepareResult === ATTACK_DODGED ? this.$t( "nameDodgedAttack", { name: this.$t( "you" ) }) : this.$t( "nameMissedAttack", { name } ) ];
                    return;
                }
                this.messages = [ this.$t( "nameDealtDamage", { name, damage }) ];
            }, 2000 );
        },
        close() {
            this.setScreen( SCREEN_GAME );
        },
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/actions";

.attack-list {
    display: inline !important;
}

.battle-group {
    @include large() {
        display: inline-block;
        vertical-align: top;
        margin-left: $spacing-medium;

        .character-status {
            display: block;
            margin-bottom: $spacing-medium;
        }
    }
}

.battle-messages {
    background-color: #000;
    border-radius: $spacing-small;
    padding: $spacing-xsmall $spacing-medium;
    color: #FFF;
}
</style>
