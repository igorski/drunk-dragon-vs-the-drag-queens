/**
 * Created by igorzinken on 01-03-15.
 */
var Cave = require( "../model/vo/Cave" );

module.exports =
{
    /**
     * @public
     *
     * @param {Cave} aCave
     * @param {number=} aMagnification optional magnification to grow / shrink
     *        the total map size
     *
     * @return {Image}
     */
    render : function( aCave, aMagnification )
    {
        // TODO : use magnification (scale up element in CSS)

        if ( typeof aMagnification !== "number" ) aMagnification = 1;

        var level   = aCave.levels[ aCave.level ];
        var terrain = level.terrain;
        var aWidth  = level.width;
        var aHeight = level.height;

        cvs.width  = aWidth;
        cvs.height = aHeight;

        var x, y;

        // don't render the map, for now floodfill the world with black
        ctx.fillStyle = 'rgba(0,0,0,1)';
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

        var SX = 2, SY = 2, tx, ty, color, tileWidth, tileHeight;

        for ( x = 0, y = 0; y < aHeight; x = ( ++x == aWidth ? ( x % aWidth + ( ++y & 0 ) ) : x ) )
        {
            var index = y * aWidth + x;
            tx = x * SX;
            ty = y * SY;

            color = "#F00";
            tileWidth = tileHeight = 1;

            switch ( terrain[ index ] )
            {
                case Cave.Tiles.NOTHING:
                    continue;
                    break;

                case Cave.Tiles.GROUND:
                    color = "#0066FF";
                    break;

                case Cave.Tiles.WALL:
                    color = "#AAA";
                    break;

                case Cave.Tiles.TUNNEL:
                    color = "#FF00FF";
                    tileWidth = tileHeight = 3;
                    break;
            }
            ctx.fillStyle = color;
            ctx.fillRect( x - ( Math.floor( tileWidth / 2 )), y - ( Math.floor( tileHeight / 2 )), tileWidth, tileHeight );
        }

        // draw player

        ctx.fillStyle = "white";
        var dotSize = 3;
        ctx.fillRect(( aCave.x * tileWidth ) - dotSize / 2, ( aCave.y * tileHeight ) - dotSize / 2, dotSize, dotSize );

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
