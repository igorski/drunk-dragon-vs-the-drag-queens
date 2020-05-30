var Notifications = require( "../definitions/Notifications" );
var MVC           = require( "zmvc" ).MVC;

var Commands = module.exports =
{
    /**
     * supply here all notification messages that should
     * launch a command upon broadcast
     */
    MAPPINGS : [

        { msg: Notifications.System.STARTUP,              cmd: require( "../command/startup/StartupCommand" )},

        { msg: Notifications.Game.ENTER_OVERGROUND,       cmd: require( "../command/game/EnterOvergroundCommand" )},
        { msg: Notifications.Game.ENTER_CAVE,             cmd: require( "../command/game/EnterCaveCommand" )},
        { msg: Notifications.Game.ENTER_CAVE_LEVEL,       cmd: require( "../command/game/EnterCaveLevelCommand" )},
        { msg: Notifications.Game.UPDATE_ENEMIES,         cmd: require( "../command/game/HandleAICommand" )},
        { msg: Notifications.Game.RETURN_TO_WORLD,        cmd: require( "../command/game/ReturnToWorldCommand" )},
        { msg: Notifications.Game.GAME_OVER,              cmd: require( "../command/game/GameOverCommand" )},

        { msg: Notifications.Player.VALIDATE_PLAYER_MOVE, cmd: require( "../command/player/ValidateMoveCommand" )},
        { msg: Notifications.Player.START_MOVEMENT,       cmd: require( "../command/player/StartMoveCommand" )},
        { msg: Notifications.Player.STOP_MOVEMENT,        cmd: require( "../command/player/StopMoveCommand" )},
        { msg: Notifications.Player.SWITCH_DIRECTION,     cmd: require( "../command/player/SwitchDirectionCommand" )},
        { msg: Notifications.Player.LEVEL_UP,             cmd: require( "../command/player/LevelUpCommand" )},

        { msg: Notifications.Shop.BUY_ITEM,               cmd: require( "../command/shop/BuyItemCommand" )},
        { msg: Notifications.Shop.SELL_ITEM,              cmd: require( "../command/shop/SellItemCommand" )},

        { msg: Notifications.Battle.BATTLE_START,         cmd: require( "../command/battle/StartBattleCommand" )},
        { msg: Notifications.Battle.BATTLE_END,           cmd: require( "../command/battle/StopBattleCommand" )},
        { msg: Notifications.Battle.ATTACK_OPPONENT,      cmd: require( "../command/battle/AttackCommand" )},
        { msg: Notifications.Battle.DEFEND,               cmd: require( "../command/battle/DefendCommand" )},
        { msg: Notifications.Battle.USE_ITEM,             cmd: require( "../command/battle/UseItemCommand" )},
        { msg: Notifications.Battle.OPPONENT_ATTACKS,     cmd: require( "../command/battle/OpponentAttacksCommand" )},
        { msg: Notifications.Battle.RUN,                  cmd: require( "../command/battle/RunCommand" )},

        { msg: Notifications.Social.SHARE,                cmd: require( "../command/social/ShareStatusCommand" )},

        { msg: Notifications.UI.RENDER_WORLD,             cmd: require( "../command/render/RenderWorldCommand" )},
        { msg: Notifications.UI.RENDER_CAVE_LEVEL,        cmd: require( "../command/render/RenderCaveLevelCommand" )},

        { msg: Notifications.Audio.PLAY_TRACK,            cmd: require( "../command/audio/PlayTrackCommand" )},

        { msg: Notifications.Storage.CREATE_NEW_GAME,     cmd: require( "../command/storage/CreateGameCommand" )},
        { msg: Notifications.Storage.SAVE_GAME,           cmd: require( "../command/storage/SaveGameCommand" )},
        { msg: Notifications.Storage.RESTORE_GAME,        cmd: require( "../command/storage/RestoreGameCommand" )},
        { msg: Notifications.Storage.IMPORT_GAME,         cmd: require( "../command/storage/ImportGameCommand" )},
        { msg: Notifications.Storage.EXPORT_GAME,         cmd: require( "../command/storage/ExportGameCommand" )}
    ],

    init : function()
    {
        Commands.MAPPINGS.forEach( function( mapping )
        {
            MVC.registerCommand( mapping.msg, mapping.cmd );
        });
    }
};
