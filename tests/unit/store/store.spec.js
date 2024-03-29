import { describe, it, expect, vi } from "vitest";
import store from "@/store";
const { mutations, actions } = store;

vi.useFakeTimers();
vi.mock( "promised-script-loader", () => ({}));
let mockStorage = vi.fn();
vi.mock( "store/dist/store.modern", () => ({
    default: {
        get : () => mockStorage,
        set : (...args) => mockStorage(...args)
    }
}));
vi.mock( "zcanvas", () => ({
    Loader: {
        onReady: new Promise(resolve => resolve())
    },
    Sprite: vi.fn()
}));

describe( "Vuex store", () => {
    describe( "mutations", () => {
        it( "should be able to set the loading state", () => {
            const state = { loading: false };
            mutations.setLoading( state, true );
            expect( state.loading ).toBe( true );
        });

        it( "should be able to set the window dimensions", () => {
            const state = { dimensions: { width: 0, height: 0 } };
            mutations.setDimensions( state, { width: 640, height: 480 });
            expect( state.dimensions ).toEqual({ width: 640, height: 480 });
        });

        it( "should be able to set the active game screen", () => {
            const state = { screen: 0 };
            mutations.setScreen( state, 1 );
            expect( state.screen ).toEqual( 1 );
        });

        it( "should be able to set autosave", () => {
            const state = { autoSave: false };
            mutations.setAutoSave( state, true );
            expect( state.autoSave ).toBe( true );
        })

        describe( "when opening dialogs", () => {
            const message = "foo";

            it( "should default to showing an information message without action buttons", () => {
                const state = { dialog: null };

                mutations.openDialog( state, { message });
                expect( state.dialog ).toEqual({
                    type: "info",
                    title: "",
                    message,
                    confirm: null,
                    cancel: null
                });
            });

            it( "should allow opening dialogs with additional titles and action buttons", () => {
                const state = { dialog: null };
                const type = "error";
                const title = "bar";
                const confirm = vi.fn();
                const cancel = vi.fn();

                mutations.openDialog( state, { type, message, title, confirm, cancel });
                expect( state.dialog ).toEqual({ type, message, title, confirm, cancel });
            });

            it( "should be able to close an active dialog", () => {
                const state = { dialog: { message }};
                mutations.closeDialog( state );
                expect( state.dialog ).toBeNull();
            });

            it( "should be able to open an error dialog", () => {
                const state = { dialog: null };
                mutations.showError( state, message );
                expect( state.dialog ).toEqual({
                    type: "error",
                    title: "title.error",
                    message,
                });
            });
        });

        describe( "when showing notifications", () => {
            const message = "bar";

            it( "should be able to add a notification into the queue", () => {
                const state = { notifications: [] };
                mutations.showNotification( state, message );
                expect( state.notifications ).toEqual([ message ]);
            });

            it( "should be able to close all open notifications", () => {
                const state = { notifications: [ "foo", "bar" ] };
                mutations.clearNotifications( state );
                expect( state.notifications ).toHaveLength( 0 );
            });
        });
    });

    describe( "actions", () => {
        it( "should be able to toggle the auto save state", () => {
            const commit = vi.fn();
            const dispatch = vi.fn();

            actions.enableAutoSave({ commit, dispatch }, true );
            expect( commit ).toHaveBeenCalledWith( "setAutoSave", true );
            expect( dispatch ).not.toHaveBeenCalled();

            vi.advanceTimersByTime( 180000 );
            expect( dispatch ).toHaveBeenNthCalledWith( 1, "saveGame" );
        });

        it( "should be able to store the user preferences", () => {
            const state   = { autoSave: true };
            const getters = { muted: true };
            mockStorage   = vi.fn();

            actions.saveOptions({ state, getters });

            expect( mockStorage ).toHaveBeenCalledWith( expect.any( String ), { autoSave: true, muted: true });
        });

        it( "should be able to restore the user preferences", () => {
            mockStorage = {
                autoSave : true,
                muted    : true,
            };
            const commit   = vi.fn();
            const dispatch = vi.fn();

            actions.loadOptions({ commit, dispatch });

            expect( commit ).toHaveBeenNthCalledWith( 1, "setMuted", true );
            expect( dispatch ).toHaveBeenNthCalledWith( 1, "enableAutoSave", true );
        });
    });
});
