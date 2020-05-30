/**
 * Created by igorzinken on 02-05-15.
 */
module.exports =
{
    timestampToString : function( timeStamp )
    {
        var date = new Date( timeStamp );

        // hours part from the timestamp
        var hours = date.getHours();

        // minutes part from the timestamp
        var minutes = addZero( date.getMinutes() );

        // seconds part from the timestamp
        var seconds = addZero( date.getSeconds() );

        // will display time in 10:30:23 format
        return hours + ':' + minutes.substr( minutes.length - 2 ) + ':' + seconds.substr( seconds.length - 2 );
    },

    msToString : function( s )
    {
      var ms = s % 1000;
      s = (s - ms) / 1000;
      var secs = s % 60;
      s = (s - secs) / 60;
      var mins = s % 60;
      var hrs = (s - mins) / 60;

      return addZero( hrs ) + ':' + addZero( mins ) + ':' + addZero( secs );// + '.' + ms;
    }
};

function addZero( input )
{
    input = input.toString();

    if ( input.length < 2 )
        return "0" + input;

    return input;
}