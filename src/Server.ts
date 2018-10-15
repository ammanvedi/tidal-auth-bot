import TidalTokenGrabber from './TidalTokenGrabber';
import memoryCache, { SimpleMemoryCache } from './MemoryCache';
import { Express } from 'express';
import * as http from 'http';

const express = require( 'express' );

export interface TidalServerConfig {
    favoritesFetchInterval: number,
    port: string | number
};

const DEFAULT_CONFIG: TidalServerConfig = {
    favoritesFetchInterval: 60 * 5 * 1000,
    port: 3000
};

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Cache-Control': `public, max-age=${ 60 * 60 * 5 }` // 5 hours cache
};

export default class TidalServer {

    ttg: TidalTokenGrabber = new TidalTokenGrabber();
    cache: SimpleMemoryCache = memoryCache;
    server: Express = express();
    listener?: http.Server;

    constructor( protected config: TidalServerConfig = DEFAULT_CONFIG ) {
        this.beginScheduledJobs();
        this.setupServer();
    };

    setupServer() {

        this.server.get( '/ping', ( req, res ) => {
            res.set( {
                ...DEFAULT_HEADERS
            } );

            res.status( 200 );
            res.send('');
            res.end();
        } );

        this.server.get( '/favorites', ( req, res ) => {


            const favoritesData = this.cache.getKey( 'favorites' );

            if ( !favoritesData ) {
                res.status( 404 );
                res.send('');
                res.end();
                return;
            }

            res.status( 200 );
            res.send( favoritesData );
            res.end();
        } );

        this.listener = this.server.listen( this.config.port );
    }

    fetchFavorites() {
        this.ttg.getFavoritesResponse()
        .then( ( values: Array<any> )  => {
            const favoritesJSON: object = values[ 1 ];
            this.cache.setKey( 'favorites', favoritesJSON );
        } )
        .catch( error => {
            console.log( 'Error in fetching favs', error );
        } )
    }

    beginScheduledJobs() {

        setTimeout( () => {
            this.fetchFavorites();
        }, this.config.favoritesFetchInterval );

        this.fetchFavorites();
    }

    stop() {
        if ( !this.listener ) {
            return;
        }

        this.listener.close();
    }

}