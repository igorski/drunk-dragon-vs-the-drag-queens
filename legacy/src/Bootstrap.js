var Commands      = require( "./config/Commands" );
var Views         = require( "./config/Views" );
var Models        = require( "./config/Models" );
var Notifications = require( "./definitions/Notifications" );
var MVC           = require( "zmvc" ).MVC;

// prepare all Actors

Commands.init();
Models.init();
Views.init();

// run the startup command

MVC.broadcast( Notifications.System.STARTUP );

