<template>
    <modal :title="$t('hotelCounter')" @close="close()">
        <p v-t="'welcomeToOurHotel'"></p>
        <p>{{ $t( "priceForTonight", { price: hotel.price }) }}</p>
        <div class="actions">
            <button
                v-t="'bookRoom'"
                type="button"
                class="rpg-button"
                @click="book()"
            ></button>
            <button
                v-t="'leave'"
                type="button"
                class="rpg-button"
                @click="close()"
            ></button>
        </div>
    </modal>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import Modal from "@/components/modal/modal.vue";
import messages from "./messages.json";

export default {
    i18n: { messages },
    components: {
        Modal,
    },
    computed: {
        ...mapGetters([
            "hotel",
            "player",
        ]),
    },
    methods: {
        ...mapMutations([
            "openDialog",
        ]),
        ...mapActions([
            "bookHotelRoom"
        ]),
        book() {
            if ( this.player.inventory.cash < this.hotel.price ) {
                this.close();
                this.openDialog({ message: this.$t( "insufficientFunds" ) });
                return;
            }
            this.openDialog({
                type: "confirm",
                title: this.$t( "confirmPurchase" ),
                message: this.$t( "bookRoomForPrice", { price: this.hotel.price }),
                confirm: () => {
                    this.bookHotelRoom( this.hotel );
                }
            });
        },
        close() {
            this.$emit( "close" );
        },
    },
};
</script>
