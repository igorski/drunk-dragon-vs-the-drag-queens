import store from "@/store";
const { mutations, actions } = store;

jest.useFakeTimers();
jest.mock("promised-script-loader", () => ({}));

jest.mock( "zcanvas", () => ({
    loader: {
        onReady: new Promise(resolve => resolve())
    },
    sprite: jest.fn()
}));

describe("Vuex store", () => {
    describe("mutations", () => {
        it("should be able to set the loading state", () => {
            const state = { loading: false };
            mutations.setLoading( state, true );
            expect( state.loading ).toBe( true );
        });

        it("should be able to set the window dimensions", () => {
            const state = { dimensions: { width: 0, height: 0 } };
            mutations.setDimensions( state, { width: 640, height: 480 });
            expect( state.dimensions ).toEqual({ width: 640, height: 480 });
        });

        it("should be able to set the active game screen", () => {
            const state = { screen: 0 };
            mutations.setScreen( state, 1 );
            expect( state.screen ).toEqual( 1 );
        });

        it("should be able to set autosave", () => {
            const state = { autoSave: false };
            mutations.setAutoSave( state, true );
            expect( state.autoSave ).toBe( true );
        })

        describe("when opening dialogs", () => {
            const message = "foo";

            it("should default to showing an information message without action buttons", () => {
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

            it("should allow opening dialogs with additional titles and action buttons", () => {
                const state = { dialog: null };
                const type = "error";
                const title = "bar";
                const confirm = jest.fn();
                const cancel = jest.fn();

                mutations.openDialog( state, { type, message, title, confirm, cancel });
                expect( state.dialog ).toEqual({ type, message, title, confirm, cancel });
            });

            it("should be able to close an active dialog", () => {
                const state = { dialog: { message }};
                mutations.closeDialog( state );
                expect( state.dialog ).toBeNull();
            });

            it("should be able to open an error dialog", () => {
                const state = { dialog: null };
                mutations.showError( state, message );
                expect( state.dialog ).toEqual({
                    type: "error",
                    title: "title.error",
                    message,
                });
            });
        });

        describe("when showing notifications", () => {
            const message = "bar";

            it("should be able to add a notification into the queue", () => {
                const state = { notifications: [] };
                mutations.showNotification( state, message );
                expect( state.notifications ).toEqual([ message ]);
            });

            it("should be able to close all open notifications", () => {
                const state = { notifications: [ "foo", "bar" ] };
                mutations.clearNotifications( state );
                expect( state.notifications ).toHaveLength( 0 );
            });
        });
    });

    describe("actions", () => {
        it("should be able to toggle the auto save state", () => {
            const commit = jest.fn();
            const dispatch = jest.fn();

            actions.enableAutoSave({ commit, dispatch }, true );
            expect( commit ).toHaveBeenCalledWith( "setAutoSave", true );
            expect( dispatch ).toHaveBeenNthCalledWith( 1, "saveOptions" );

            jest.advanceTimersByTime( 180000 );
            expect( dispatch ).toHaveBeenNthCalledWith( 2, "saveGame" );
        });
    });
});
