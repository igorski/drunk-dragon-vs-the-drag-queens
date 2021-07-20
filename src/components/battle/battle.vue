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
        <character-status :character="player" />
        <character-status v-if="opponent" :character="opponent" />
        <div v-if="battleWon">
            {{ $t('youWon') }}
        </div>
        <div v-else>
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
        <!-- battle progress update messages -->
        <p
            v-for="(message, index) in messages"
            :key="`msg_${index}`"
        >
            {{ message }}
        </p>
    </modal>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import { ModelSelect } from 'vue-search-select';
import AttackTypes     from "@/definitions/attack-types";
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
            return [
                { text: this.$t( "slap" ), value: AttackTypes.SLAP },
                { text: this.$t( "kick" ), value: AttackTypes.KICK },
            ];
        },
    },
    watch: {
        opponent( opponent ) {
            if ( opponent?.hp !== 0 && !this.playerTurn ) {
                this.executeOpponentAttack(); // opponent retaliates
            }
        },
        battleWon( value ) {
            if ( !value ) {
                return;
            }
            this.messages = [];
            const { level, xp } = this.player;
            if ( xp > this.playerStats.xp ) {
                this.messages.push( this.$t( "youEarnedXp", { xp: xp - this.playerStats.xp } ));
            }
            if ( level > this.playerStats.level ) {
                this.messages.push( this.$t( "youAdvancedToLevel", { level }));
            }
            window.setTimeout(() => {
                this.close();
                // TODO: reset dragon
            }, 3000 );
        }
    },
    created() {
        this.title = this.$t( "battleAgainstName", { name: this.opponent.appearance.name });
        this.attackType = this.attackTypesForPlayer[ 0 ];
        const { xp, level } = this.player;
        this.$set( this.playerStats, { xp, level });
        this.setPlayerTurn( true ); // TODO: implement ambush (should be Vuex action on battle creation)
    },
    methods: {
        ...mapMutations([
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
            // TODO: show damage dealt ?
        },
        async run() {
            const { name } = this.opponent.appearance;
            if ( await this.runFromOpponent() ) {
                this.showNotification({ message: this.$t( "youEscapedFromBattlingName", { name }) });
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
                const damage = await this.attackPlayer({ type: AttackTypes.BITE });
                this.messages = [ this.$t( "nameDealtDamage", { name: this.opponent.appearance.name, damage }) ];
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
