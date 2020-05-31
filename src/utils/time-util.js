export default
{
    timestampToString( timeStamp ) {
        const date = new Date( timeStamp );

        // hours part from the timestamp
        const hours = date.getHours();

        // minutes part from the timestamp
        const minutes = addZero( date.getMinutes() );

        // seconds part from the timestamp
        const seconds = addZero( date.getSeconds() );

        // will display time in 10:30:23 format
        return hours + ':' + minutes.substr( minutes.length - 2 ) + ':' + seconds.substr( seconds.length - 2 );
    },

    msToString( s ) {
      var ms = s % 1000;
      s = (s - ms) / 1000;
      var secs = s % 60;
      s = (s - secs) / 60;
      var mins = s % 60;
      var hrs = (s - mins) / 60;

      return addZero( hrs ) + ':' + addZero( mins ) + ':' + addZero( secs );// + '.' + ms;
    }
};

function addZero( input ) {
    input = input.toString();

    if ( input.length < 2 )
        return `0${input}`;

    return input;
}
