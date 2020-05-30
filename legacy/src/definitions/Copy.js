module.exports =
{
    "DEFEND_SUCCESS" : "Blocked enemy attack",
    "RUN_SUCCESS"    : "Ran away from fight",
    "RUN_FAILURE"    : "Could not run away from fight!",
    "ATTACK_FAILURE" : "Attack missed!",
    "XP_AWARDED"     : "Earned {0} experience point(s)",
    "STOLE_COINS"    : "Got {0} coin(s) from opponent",
    "STOLE_ITEM"     : "Stole {0} from opponent",

    "GAME_SAVED"     : "Game status saved.",
    "GAME_RESTORED"  : "Restored saved game successfully.",
    "GAME_CORRUPT"   : "Could not restore saved game, data was corrupted.",
    "GAME_IMPORTED"  : "Saved game successfully imported.",

    "BATTLE" : {
        "ITEM" : "Which item do you wish to use ?"
    },

    "PLAYER" : {
        "HP_UP" : "Increase HP with +5 points to {0}",
        "MP_UP" : "Increase MP with +5 points to {0}"
    },

    "STATUS" : {
        "LEVEL_UP"  : "You have gathered 100 experience points, meaning your level will go up!" +
                      "Your power has been restored. Additionally, you can add either +5 HP or +5 MP",
        "GAME_OVER" : "You dieded. Continue from the last save point ? If not, a new game is created."
    },

    "GENERAL" : {
        "YES"      : "Yeah!",
        "NO"       : "Nope.",
        "OK"       : "OK.",
        "CLOSE"    : "x",
        "CNG"      : "Create new game",
        "RES"      : "Restore saved game",
        "GAME_URL" : "http://www.igorski.nl/experiment/rpg/"
    },

    "SHOP" : {
        "WELCOME"        : "Welcome to our Shop. What can we help you with?",
        "BUYABLE_ITEMS"  : "Items for sale:",
        "SELLABLE_ITEMS" : "Items to pawn:",
        "SELL"           : "Sell items",
        "EXIT"           : "Exit",
        "CONFIRM_ITEM"   : "Are you sure you wish to buy {0} for $ {1} ?",
        "CONFIRM_SELL"   : "Are you sure you wish to sell {0} for $ {1} ?",
        "CANNOT_AFFORD"  : "You haven't got enough money to purchase this item...",
        "ITEM_PURCHASED" : "Pleasure doing business with you!",
        "ITEM_SOLD"      : "Pleasure doing business with you! A fine addition to our shop."
    },

    "SOCIAL" : {

        "SHARE_TITLE" : "Share your game status with friends?",

        "BUTTONS": {
            "FB" : "Post on Facebook",
            "TW" : "Post on Twitter"
        },

        "LEVEL_UP" : "I have just reached level {0} in RPG after playing for {TIME}"
    },

    // should match ItemTypes-enum index

    "ITEMS" : [
        "weapon",
        "medicine"
    ],

    // should match AttackTypes-enum index

    "WEAPONS" : [
        "fist",
        "knife",
        "sword"
    ],

    // should match MedicineTypes-enum index

    "MEDICINE" : [
        "potion",
        "medikit",
        "full power"
    ],

    "ABOUT " : {
        "WHO" : "RPG is made by:<br /><br /><b>Igor Zinken</b> programming<br /><br /><b>Joost Huijbers</b> design, graphics<br /><br/>" +
                "and benefited greatly from work by <b>Igor Kogan</b> on the terrain generator."
    }
};
