/**
 * Created by igorzinken on 19-02-15.
 *
 * All the notifications that are transmitted using
 * pubsub-js across the applications actors
 */
module.exports =
{
    Navigation : {
        OPEN_PAGE       : "NN::0",
        OPEN_OVERLAY    : "NN::1",
        CLOSE_OVERLAY   : "NN::2"
    },

    Player : {
        UPDATE_STATUS             : "PN::0",
        EXPERIENCE_POINTS_AWARDED : "PN::1",
        LEVEL_UP                  : "PN::2",
        STOLE_INVENTORY_ITEMS     : "PN::3",
        VALIDATE_PLAYER_MOVE      : "PN::4",
        START_MOVEMENT            : "PN::5",
        STOP_MOVEMENT             : "PN::6",
        SWITCH_DIRECTION          : "PN::7"
    },

    Battle : {
        BATTLE_START            : "BN::0",
        BATTLE_END              : "BN::1",
        ATTACK_OPPONENT         : "BN::2",
        ATTACK_OPPONENT_SUCCESS : "BN::3",
        ATTACK_OPPONENT_FAILURE : "BN::4",
        DEFEND                  : "BN::5",
        USE_ITEM                : "BN::6",
        DEFEND_SUCCESS          : "BN::7",
        OPPONENT_ATTACKS        : "BN::8",
        OPPONENT_ATTACK_SUCCESS : "BN::9",
        OPPONENT_ATTACK_FAILURE : "BN::10",
        CONTINUE_BATTLE         : "BN::11",
        RUN                     : "BN::12",
        RUN_SUCCESS             : "BN::13",
        RUN_FAILURE             : "BN::14"
    },

    Game : {
        GAME_OVER               : "GN::0",
        ENTER_OVERGROUND        : "GN::1",
        ENTER_CAVE              : "GN::2",
        ENTER_CAVE_LEVEL        : "GN::3",
        UPDATE_ENEMIES          : "GN::4",
        RETURN_TO_WORLD         : "GN::5"
    },

    Shop : {
        BUY_ITEM                : "SH::0",
        SELL_ITEM               : "SH::1",
        UPDATE_SHOP             : "SH::2"
    },

    Storage : {
        CREATE_NEW_GAME         : "SN::1",
        SAVE_GAME               : "SN::2",
        RESTORE_GAME            : "SN::3",
        IMPORT_GAME             : "SN::4",
        EXPORT_GAME             : "SN::5"
    },

    System : {
        STARTUP          : "SYS::0",
        SHOW_MESSAGE     : "SYS::1",
        BUSY_STATE_START : "SYS::2",
        BUSY_STATE_END   : "SYS::3"
    },

    Social : {
        SHARE   : "SOC::0"
    },

    UI : {
        SHOW_BATTLE_UI        : "UN::0",
        HIDE_BATTLE_UI        : "UN::1",
        RENDER_WORLD          : "UN::2",
        RENDER_CAVE_LEVEL     : "UN::3",
        STATE_RENDER_START    : "UN::4",
        STATE_RENDER_COMPLETE : "UN::5"
    },

    Audio : {
        PLAY_TRACK  : "AU::0"
    }
};
