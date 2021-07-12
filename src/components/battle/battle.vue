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
        :title="$t('battleAgainstName', { name: opponent.appearance.name })"
        :dismissible="battleWon"
        @close="close()"
    >
        <character-status :character="player" />
        <character-status :character="opponent" />
        <div v-if="battleWon">
            {{ $t('youWon') }}
        </div>
        <div v-else>
            <p v-if="message">{{ message }}</p>
            <model-select
                v-model="attackType"
                :options="attackTypesForPlayer"
                :placeholder="$t('chooseAttackType')"
                :is-disabled="!canAttack"
                class="attack-list"
            />
            <button
                v-t="'attack'"
                type="button"
                :disabled="!canAttack"
                @click="attack()"
            ></button>
            <button
                v-t="'runAway'"
                type="button"
                :disabled="!canAttack"
                @click="run()"
            ></button>
        </div>
    </modal>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import { ModelSelect } from 'vue-search-select';
import AttackTypes     from "@/definitions/attack-types";
import { GAME_OVER }   from "@/definitions/game-states";
import { SCREEN_GAME } from "@/definitions/screens";
import Modal           from "@/components/modal/modal";
import CharacterStatus from "./character-status/character-status";
import messages        from "./messages.json";

import "semantic-ui-css/components/dropdown.min.css";
import "vue-search-select/dist/VueSearchSelect.css";

export default {
    i18n: { messages },
    components: {
        ModelSelect,
        Modal,
        CharacterStatus,
    },
    data: () => ({
        attackType: null,
        battleWon: false,
        timeout: null,
        message: null,
    }),
    computed: {
        ...mapGetters([
            "player",
            "playerTurn",
            "opponent",
        ]),
        canAttack() {
            return this.player.hp > 0 && this.playerTurn;
        },
        attackTypesForPlayer() {
            return [
                { text: this.$t( "slap" ), value: AttackTypes.SLAP },
                { text: this.$t( "kick" ), value: AttackTypes.KICK },
            ];
        },
    },
    watch: {
        player({ hp }) {
            if ( hp === 0 ) {
                this.setGameState( GAME_OVER );
            }
        },
        opponent({ hp }) {
            if ( hp === 0 ) {
                this.battleWon = true;
                window.setTimeout(() => {
                    this.close();
                    // TODO: award points, reset dragon
                }, 3000 );
            } else if ( !this.playerTurn ) {
                this.executeOpponentAttack(); // opponent retaliates
            }
        }
    },
    created() {
        this.attackType = this.attackTypesForPlayer[ 0 ];
        this.setPlayerTurn( true ); // TODO: implement ambush (should be Vuex action on battle creation)
    },
    methods: {
        ...mapMutations([
            "setGameState",
            "setScreen",
            "setPlayerTurn",
            "showNotification",
        ]),
        ...mapActions([
            "attackOpponent",
            "attackPlayer",
            "runFromOpponent"
        ]),
        async attack() {
            const damage = await this.attackOpponent({ type: this.attackType.value });
            // TODO: show damage dealt
        },
        async run() {
            const { name } = this.opponent.appearance;
            if ( await this.runFromOpponent() ) {
                this.showNotification({ message: this.$t( "youEscapedFromBattlingName", { name }) });
            } else {
                this.message = this.$t( "cannotEscapeFromName", { name });
                this.executeOpponentAttack();
            }
        },
        executeOpponentAttack() {
            if ( this.timeout ) {
                return;
            }
            this.timeout = window.setTimeout( async () => {
                const damage = await this.attackPlayer({ type: AttackTypes.BITE });
                this.message = this.$t( "nameDealtDamage", { name: this.opponent.appearance.name, damage });
                window.clearTimeout( this.timeout );
                this.timeout = null;
            }, 2000 );
        },
        close() {
            this.setScreen( SCREEN_GAME );
        },
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_layout.scss";

.attack-list {
    display: inline !important;
}
</style>
