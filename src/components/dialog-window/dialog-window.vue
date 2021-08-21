/**
* The MIT License (MIT)
*
* Igor Zinken 2016-2021 - https://www.igorski.nl
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
    <div class="dialog-window">
        <h4>{{ title }}</h4>
        <p>{{ message }}</p>
        <div
            class="button-container"
            :class="{ multiple: isConfirm }"
        >
            <button
                v-t="'ok'"
                ref="confirmButton"
                type="button"
                class="rpg-button"
                @click="handleConfirm"
            ></button>
            <button
                v-if="isConfirm"
                v-t="'cancel'"
                ref="cancelButton"
                type="button"
                class="rpg-button"
                @click="handleCancel"
            ></button>
        </div>
    </div>
</template>

<script>
import { mapMutations } from "vuex";
import messages from "./messages.json";

export default {
    i18n: { messages },
    props: {
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true,
            validator: value => /info|confirm|error/.test(value)
        },
        confirmHandler: {
            type: Function,
            default: null,
        },
        cancelHandler: {
            type: Function,
            default: null,
        }
    },
    data: () => ({
        focus: -1,
    }),
    computed: {
        isConfirm() {
            return this.type === "confirm";
        },
    },
    watch: {
        focus( value ) {
            if ( value === 0 ) {
                this.$refs.confirmButton.focus();
            } else if ( value === 1 ) {
                this.$refs.cancelButton.focus();
            }
        },
    },
    created() {
        this._keyHandler = this.handleKeys.bind( this );
        window.addEventListener( "keyup", this._keyHandler );
    },
    destroyed() {
        window.removeEventListener( "keyup", this._keyHandler );
    },
    methods: {
        ...mapMutations([
            "closeDialog",
        ]),
        handleKeys({ keyCode }) {
            switch ( keyCode ) {
                default:
                    return;
                case 9: // tab
                    if ( ++this.focus === 1 ) {
                        this.focus = 0;
                    }
                    break;
                case 27: // escape
                    this.handleCancel();
                    break;
                case 37: // left
                    this.focus = 0;
                    break;
                case 39: // right
                    this.focus = 1;
                    break;
            }
        },
        handleConfirm() {
            this.close();
            if ( typeof this.confirmHandler === "function" ) {
                this.confirmHandler();
            }
        },
        handleCancel() {
            this.close();
            if ( typeof this.cancelHandler === "function" ) {
                this.cancelHandler();
            }
        },
        close() {
            this.closeDialog();
        }
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_variables";
@import "@/styles/_layout";

.dialog-window {
    @include overlay();
    @include noSelect();
    @include boxSize();
    @include center(fixed);

    width: auto;
    height: auto;
    max-width: 550px;
    padding: $spacing-small $spacing-large;
    border-radius: $spacing-small;
    box-shadow: 0 0 25px rgba(0,0,0,.5);

    h4 {
        margin: $spacing-medium 0;
        color: $color-1;
        font-weight: bold;
    }

    @include mobile() {
        border-radius: 0;
        width: 100%;
        height: 100%;

        button {
            display: block;
            width: 100%;
        }
    }
}

.button-container {
    display: flex;

    button {
        display: inline;
        padding: $spacing-medium $spacing-large;
    }

    &.multiple button {
        width: 48%;
    }
}
</style>
