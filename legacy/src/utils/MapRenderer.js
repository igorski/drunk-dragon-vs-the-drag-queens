/**
 * Created by igorzinken on 01-03-15.
 */
var World = require( "../model/vo/World" );

module.exports =
{
    /**
     * @public
     *
     * @param {World} aWorld
     * @param {number=} aMagnification optional magnification to grow / shrink
     *        the total map size
     *
     * @return {Image}
     */
    render : function( aWorld, aMagnification )
    {
        // TODO : use magnification (scale up element in CSS)

        if ( typeof aMagnification !== "number" ) aMagnification = 1;

        var aWidth  = aWorld.width;
        var aHeight = aWorld.height;

        cvs.width  = aWidth;
        cvs.height = aHeight;

        var cols = aWorld.width;
        var rows = aWorld.height;
        var tileWidth  = Math.round( aWidth  / cols  );
        var tileHeight = Math.round( aHeight / rows );
        var i, l, x, y;

        // don't render the map, for now floodfill the world with green
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect( 0, 0, aWidth, aHeight );
        // outline
        ctx.strokeStyle = "green";
        ctx.beginPath();
        ctx.moveTo( 0, 0 );
        ctx.lineTo( aWidth, 0 );
        ctx.lineTo( aWidth, aHeight );
        ctx.lineTo( 0, aHeight );
        ctx.lineTo( 0, 0 );
        ctx.stroke();

        // render the terrain

        var SX = 2, SY = 2, tx, ty;

        for ( x = 0, y = 0; y < aHeight; x = ( ++x == aWidth ? ( x % aWidth + ( ++y & 0 ) ) : x ) )
        {
            var index = y * aWidth + x;
            tx = x * SX;
            ty = y * SY;

            var color = "#F00";

            switch ( aWorld.terrain[ index ] )
            {
                case World.Tiles.GRASS:
                    continue;
                    break;

                case World.Tiles.WATER:
                    color = "#0066FF";
                    break;

                case World.Tiles.MOUNTAIN:
                    color = "#AAA";
                    break;

                case World.Tiles.SAND:
                    color = "#FFFF00";
                    break;

                case World.Tiles.TREE:
                    color = "#00FF65";
                    break;
            }
            ctx.fillStyle = color;
            ctx.fillRect( x, y, 1, 1 );
        }

        var dotSize = 3;

        // draw caves
        var cave;

        for ( i = 0, l = aWorld.caves.length; i < l; ++i )
        {
            cave = aWorld.caves[ i ];

            x = cave.x * tileWidth;
            y = cave.y * tileHeight;

            ctx.fillStyle = "rgba(255,0,255,1)";
            ctx.fillRect( x, y, dotSize, dotSize );
        }

        // draw shops
        var shop;

        for ( i = 0, l = aWorld.shops.length; i < l; ++i )
        {
            shop = aWorld.shops[ i ];

            x = shop.x * tileWidth;
            y = shop.y * tileHeight;

            ctx.fillStyle = "white";
            ctx.fillRect( x, y, dotSize, dotSize );
        }

        // draw enemies
        var enemy;

        for ( i = 0, l = aWorld.enemies.length; i < l; ++i )
        {
            enemy = aWorld.enemies[ i ];

            x = enemy.x * tileWidth;
            y = enemy.y * tileHeight;

            ctx.fillStyle = "red";
            ctx.fillRect( x, y, dotSize, dotSize );
        }

        // draw player

        ctx.fillStyle = "white";
        dotSize = 7;
        ctx.fillRect(( aWorld.x * tileWidth ) - dotSize / 2, ( aWorld.y * tileHeight ) - dotSize / 2, dotSize, dotSize );

        var out = new Image();
        out.src = cvs.toDataURL( "image/png" );

        return out;
    }
};

var cvs = document.createElement( "canvas" );
var ctx = cvs.getContext( "2d" );

var props = [ "imageSmoothingEnabled",  "mozImageSmoothingEnabled",
              "oImageSmoothingEnabled", "webkitImageSmoothingEnabled" ];

props.forEach( function( prop )
{
    if ( ctx[ prop ] !== undefined )
        ctx[ prop ] = false;
});
