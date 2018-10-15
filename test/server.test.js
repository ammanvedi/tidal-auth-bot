const Server = require( '../dist/Server' ).default;
const fetch = require( 'node-fetch' );
const fs = require( 'fs' );

jest.setTimeout( 80000 );

try {
    fs.mkdirSync( './out' );
} catch ( err ) {
    console.log( 'directory already exists' );
}

describe( 'Tidal Server', () => {

    const ts = new Server( {
        favoritesFetchInterval: 600000,
        port: 3000
    } );

    it( 'Sets up the server', done => {
        fetch( 'http://localhost:3000/ping' )
            .then( response => {
                expect( response.status ).toBe( 200 );
                done();
            } );
    } );

    it( 'Sets correct CORS headers', done => {
        fetch( 'http://localhost:3000/ping' )
            .then( response => {
                expect( response.headers.get( 'access-control-allow-origin' ) ).toBe( '*' )
                expect( response.headers.get( 'access-control-allow-methods' ) ).toBe( 'GET' )
                expect( response.status ).toBe( 200 );
                done();
            } );
    } );

    it( 'Sets correct cache headers', done => {
        fetch( 'http://localhost:3000/ping' )
            .then( response => {
                expect( response.headers.get( 'cache-control' ) ).toBe( 'public, max-age=18000' )
                expect( response.status ).toBe( 200 );
                done();
            } );
    } );

    it( 'Responds with a 404 when there is no data', done => {
        fetch( 'http://localhost:3000/favorites' )
            .then( response => {
                expect( response.status ).toBe( 404 );
                done();
            } );
    } );

    it( 'Responds correctly when it does have data', done => {

        setTimeout( () => {
            fetch( 'http://localhost:3000/favorites' )
                .then( response => {
                    const json = response.json();
                    expect( typeof json ).toBe( 'object' );
                    expect( response.status ).toBe( 200 );
                    done();
                } );
        }, 50000 );
    } );

    afterAll( () => {
        ts.stop();
    } );

} );
