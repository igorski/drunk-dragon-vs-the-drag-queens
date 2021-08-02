<template>
    <modal :title="$t('status')" @close="$emit('close')">
        <div class="status-content">
            <div class="status-content__time">
                <span>{{ date }} {{ time }}</span>
            </div>
            <div class="status-content__map status-content--inline">
                <img ref="map" class="map-image" />
                <p>{{ $t( "visitedPercent", { percentVisited }) }}</p>
            </div>
            <div class="status-content__inventory status-content--inline">
                <inventory :player="player" />
            </div>
            <div class="status-content__character">
                <component
                    :is="characterComponent"
                    :character="player"
                    :width="characterWidth"
                />
                <h3 class=content__character-name>{{ player.appearance.name }}</h3>
                <div class="status-content__stats status-content--inline">
                    <div class="status-content--inline">
                        <h4 v-t="'hp'"></h4>
                        <span>{{ player.hp }} {{ "/" }} {{ player.maxHp }}</span>
                    </div>
                    <div class="status-content--inline">
                        <h4 v-t="'xp'"></h4>
                        <span>{{ player.xp }}</span>
                    </div>
                    <div class="status-content--inline">
                        <h4 v-t="'level'"></h4>
                        <span>{{ player.level }}</span>
                    </div>
                    <span class="status-content--block">
                        {{ $t("xpNeededToLevelUp", { xp: xpNeededToLevelUp }) }}
                    </span>
                </div>
            </div>
        </div>
    </modal>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Modal from "@/components/modal/modal";
import Inventory from "@/components/inventory/inventory";
import { xpNeededForLevel } from "@/definitions/constants";
import { BUILDING_TYPE } from "@/model/factories/building-factory";
import { timestampToFormattedDate, timestampToTimeString } from "@/utils/time-util";
import renderWorld from "@/renderers/overground-map-renderer";
import renderBuilding from "@/renderers/building-map-renderer";
import messages from "./messages.json";

export default {
    i18n: { messages },
    components: {
        Modal,
        Inventory,
    },
    data: () => ({
        percentVisited: 0,
    }),
    computed: {
        ...mapState([
            "dimensions",
        ]),
        ...mapGetters([
            "activeEnvironment",
            "gameTime",
            "player",
        ]),
        characterComponent() {
            return () => import("@/renderers/character-queen");
        },
        characterWidth() {
            const ideal = 300; /* see _variables@mobile-width */
            const { width } = this.dimensions;
            return Math.min( ideal, width * .9 );
        },
        date() {
            return timestampToFormattedDate( this.gameTime );
        },
        time() {
            return timestampToTimeString( this.gameTime );
        },
        xpNeededToLevelUp() {
            return xpNeededForLevel( this.player.level ) - this.player.xp;
        },
    },
    mounted() {
        // let modal paint before rendering map
        setTimeout(() => {
            let renderFn;
            switch ( this.activeEnvironment.type ) {
                default:
                    renderFn = renderWorld;
                    break;
                case BUILDING_TYPE:
                    renderFn = renderBuilding;
                    break;
            }
            const { src, rendered } = renderFn( this.activeEnvironment, 210 );
            if ( this.$refs?.map ) {
                this.$refs.map.src = src;
            }
            const { terrain, visitedTerrain } = this.activeEnvironment;
            const pct = ( rendered / terrain.length ) * 100;
            this.percentVisited = pct === 100 ? 100 : pct.toFixed( 2 );

        }, 10 );
    },
};
</script>

<style lang="scss" scoped>
@import "@/styles/_variables";

.status-content {
    vertical-align: top;

    &__time {
        display: block;
        border-bottom: 1px dashed $color-1;
        padding-bottom: $spacing-small;
        margin-bottom: $spacing-medium;
    }
    &__inventory {
        display: block;
    }

    &__map {
        margin-right: $spacing-medium;

        @include mobile() {
            width: 100%;
        }
    }

    &--inline {
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
    }

    &--block {
        display: block !important;
    }
}

.map-image {
    width: 100%;

    @include large() {
        width: 210px;
    }
}

.inventory-item {
    display: block;
}

@include large() {
    .status-content__character {
        position: absolute !important;
        right: $spacing-large;
        top: $spacing-small;
    }
    .status-content__character-name {
        position: absolute;
        bottom: $spacing-medium;
    }
}
</style>
