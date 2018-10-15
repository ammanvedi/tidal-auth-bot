const TidalTokenGrabber = require( '../dist/TidalTokenGrabber' ).default;
const fs = require( 'fs' );

try {
    fs.mkdirSync( './out' );
} catch ( err ) {
    console.log( 'directory already exists' );
}

jest.setTimeout( 80000 );

describe( 'Favourites Fetcher', () => {

    let ttg;

    beforeEach( () => {
        ttg = new TidalTokenGrabber();
    } );

    it( 'Returns JSON properly', done => {

        ttg.getFavoritesResponse()
            .then( values => {

                expect( values.length ).toBe( 2 );
                expect( typeof values[ 1 ] ).toBe( 'object' );
                expect( values[ 1 ].items.length > 1 ).toBe( true );
                expect( values[ 1 ].limit ).toBe( 50 ); 
                expect( typeof values[ 1 ].lastUpdated ).toBe( 'number' );
                done();
            } )
    } );
} );