const TidalTokenGrabber = require( '../dist/TidalTokenGrabber' ).default;
const fs = require( 'fs' );

try {
    fs.mkdirSync( './out' );
} catch ( err ) {
    console.log( 'directory already exists' );
}

jest.setTimeout( 50000 );



describe( 'Favourites Fetcher', () => {

    let ttg;

    beforeEach( () => {
        ttg = new TidalTokenGrabber();
        return ttg.getFavoritesResponse();
    } )

    it( 'creates favorites JSON file', () => {
        fs.readFileSync( './out/favourites.json', 'utf8' );
    } )
} )