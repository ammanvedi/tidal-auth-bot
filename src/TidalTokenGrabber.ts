import { Browser, Page, Response } from "puppeteer";
import * as path from 'path';
import * as fs from 'fs';

const puppeteer = require( 'puppeteer' );

const DEFAULT_CONFIG = {
    outDir: path.join( process.cwd(), 'out' ),
    auth: {
        username: process.env.TIDAL_USERNAME || '',
        password: process.env.TIDAL_PASSWORD || ''
    }
};

export interface TidalAuthConfig {
    username: string,
    password: string
}

export interface TidalTokenConfig {
    outDir: string,
    auth: TidalAuthConfig
}

export interface FavoritesData {
    lastUpdated: number
}

export default class TidalTokenGrabber {

    browser?: Browser;
    page?: Page;

    constructor( protected config: TidalTokenConfig = DEFAULT_CONFIG ) {}

    async createBrowser() {

        try {
            this.browser = await puppeteer.launch();
        } catch ( error ) {
            console.log( 'error launching' );
            return;
        }
        
        if ( !this.browser ) {
            console.log( 'this.browser does not exist' )
            return;
        }

        try {
            this.page = await this.browser.newPage();
            await this.page.setUserAgent( 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36' );
            const ua = await this.page.evaluate('navigator.userAgent');

            console.log( `Page created with user agent ${ ua }` )
        } catch ( error ) {
            console.log( 'error in creating a page', error );
        }
    }

    waitForResponse( path: string ): Promise<any> {

        return new Promise( ( resolve, reject ) => {

            if( !this.page ) {
                return reject();
            }

            this.page.on( 'response', response => {
                if ( response.url().includes( path ) ) {
                    resolve( response );
                }
            } )
        } );
    }

    async clickElement( selector: string, waitForNavigation: boolean = false ) {

        console.log( `Clicking element ${ selector }, will ${ waitForNavigation ? '': 'not' } wait for navigation...` );

        if ( !this.page ) {
            return;
        }

        if ( waitForNavigation ) {
            await Promise.all( [
                this.page.waitForNavigation( { waitUntil: "networkidle0" } ),
                this.page.click( selector ),
              ] );
        } else {
            return this.page.click( selector )
        }
    }

    async focusElementAndAddText( selector: string, text: string ) {

        console.log( `Focusing element ${ selector } and adding text "${ text }"` );

        if ( !this.page ) {
            return;
        }

        await this.page.type( selector, text );
    }

    async waitForMs( ms: number ) {
        if ( !this.page ) {
            return;
        }

        await this.page.waitFor( ms );
    }

    async navigate( page: string ): Promise<any> {

        if ( !this.page ) {
            return Promise.reject( new Error( 'this.page does not exist' ) );
        }

        try {
            await this.page.goto( page );
        } catch ( error ) {
            console.log( 'problem going to a page', error );
        }
    }

    async capture( filename: string ) {
        
        if ( !this.page ) {
            return;
        }

        try {
            await this.page.screenshot( {
                path: path.join( this.config.outDir, filename )
            } )
        } catch ( error ) {
            console.log( 'There was an error in making the screenshot', error );
        }

        console.log( `Screenshot taken ${ filename }...` )
    }

    async destroyBrowser() {

        if ( !this.browser ) {
            return;
        }

        try {
            await this.browser.close();
        } catch ( error ) {
            console.log( 'There was an error when closing the browser', error );
        }
    }

    onFavouritesResult( res: Response ) {
        return res.json()
            .then( ( result: FavoritesData ) => {
                this.destroyBrowser();
                result.lastUpdated = new Date().getTime();
                return result;
            } );
    }

    getFavoritesResponse(): Promise<any> {

        return this.createBrowser()
            .then( () => {
                return Promise.all( [
                    this.openFavourites(),
                    this.waitForResponse( 'favorites/tracks' )
                        .then( res => this.onFavouritesResult( res ) )
                ] );
            } );
    }

    openFavourites() {
        return this.navigate( 'https://listen.tidal.com/' )
            .then( () => this.capture( 'screenshot-home.png' ) )
            .then( () => this.clickElement( '[data-test-id="no-user--login"]', true ) )
            .then( () => this.clickElement( 'button[type="button"].login-facebook', true ) )
            .then( () => this.capture( 'screenshot-facebook.png' ) )
            .then( () => this.focusElementAndAddText( 'input[name="email"]', this.config.auth.username ) )
            .then( () => this.capture( 'screenshot-facebook-email.png' ) )
            .then( () => this.focusElementAndAddText( 'input[name="pass"]', this.config.auth.password ) ) 
            .then( () => this.capture( 'screenshot-facebook-password.png' ) )
            .then( () => this.clickElement( 'button[type="submit"]', true ) )
            .then( () => this.capture( 'signedin.png' ) )
            .then( () => this.waitForMs( 3000 ) )
            .then( () => this.clickElement( '[data-test-id="menu--favorite-tracks"]' ) )
    }
}