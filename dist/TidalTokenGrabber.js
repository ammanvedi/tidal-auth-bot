"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const puppeteer = require('puppeteer');
const DEFAULT_CONFIG = {
    outDir: path.join(process.cwd(), 'out'),
    auth: {
        username: process.env.TIDAL_USERNAME || '',
        password: process.env.TIDAL_PASSWORD || ''
    }
};
class TidalTokenGrabber {
    constructor(config = DEFAULT_CONFIG) {
        this.config = config;
        try {
            fs.mkdirSync('./out');
        }
        catch (err) {
            console.log('directory already exists');
        }
    }
    async createBrowser() {
        try {
            this.browser = await puppeteer.launch();
        }
        catch (error) {
            console.log('error launching', error);
            return;
        }
        if (!this.browser) {
            console.log('this.browser does not exist');
            return;
        }
        try {
            this.page = await this.browser.newPage();
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
            const ua = await this.page.evaluate('navigator.userAgent');
            console.log(`Page created with user agent ${ua}`);
        }
        catch (error) {
            console.log('error in creating a page', error);
        }
    }
    waitForResponse(path) {
        return new Promise((resolve, reject) => {
            if (!this.page) {
                return reject();
            }
            this.page.on('response', response => {
                if (response.url().includes(path)) {
                    resolve(response);
                }
            });
        });
    }
    async clickElement(selector, waitForNavigation = false) {
        console.log(`Clicking element ${selector}, will ${waitForNavigation ? '' : 'not'} wait for navigation...`);
        if (!this.page) {
            return;
        }
        if (waitForNavigation) {
            await Promise.all([
                this.page.waitForNavigation({
                    waitUntil: "networkidle0",
                    timeout: 300000
                }),
                this.page.click(selector),
            ]);
        }
        else {
            return this.page.click(selector);
        }
    }
    async focusElementAndAddText(selector, text) {
        console.log(`Focusing element ${selector} and adding text "${text}"`);
        if (!this.page) {
            return;
        }
        await this.page.type(selector, text);
    }
    async waitForMs(ms) {
        if (!this.page) {
            return;
        }
        await this.page.waitFor(ms);
    }
    async navigate(page) {
        if (!this.page) {
            return Promise.reject(new Error('this.page does not exist'));
        }
        try {
            await this.page.goto(page);
        }
        catch (error) {
            console.log('problem going to a page', error);
        }
    }
    async capture(filename) {
        if (!this.page) {
            return;
        }
        try {
            await this.page.screenshot({
                path: path.join(this.config.outDir, filename)
            });
        }
        catch (error) {
            console.log('There was an error in making the screenshot', error);
        }
        console.log(`Screenshot taken ${filename}...`);
    }
    async destroyBrowser() {
        if (!this.browser) {
            return;
        }
        try {
            await this.browser.close();
        }
        catch (error) {
            console.log('There was an error when closing the browser', error);
        }
    }
    onFavouritesResult(res) {
        return res.json()
            .then((result) => {
            this.destroyBrowser();
            result.lastUpdated = new Date().getTime();
            return result;
        });
    }
    getFavoritesResponse() {
        return this.createBrowser()
            .then(() => {
            return Promise.all([
                this.openFavourites(),
                this.waitForResponse('favorites/tracks')
                    .then(res => this.onFavouritesResult(res))
            ]);
        });
    }
    openFavourites() {
        return this.navigate('https://listen.tidal.com/')
            .then(() => this.capture('screenshot-home.png'))
            .then(() => this.clickElement('[data-test-id="no-user--login"]', true))
            .then(() => this.clickElement('button[type="button"].login-facebook', true))
            .then(() => this.capture('screenshot-facebook.png'))
            .then(() => this.focusElementAndAddText('input[name="email"]', this.config.auth.username))
            .then(() => this.capture('screenshot-facebook-email.png'))
            .then(() => this.focusElementAndAddText('input[name="pass"]', this.config.auth.password))
            .then(() => this.capture('screenshot-facebook-password.png'))
            .then(() => this.clickElement('button[type="submit"]', true))
            .then(() => this.capture('signedin.png'))
            .then(() => this.waitForMs(3000))
            .then(() => this.clickElement('[data-test-id="menu--favorite-tracks"]'));
    }
}
exports.default = TidalTokenGrabber;
