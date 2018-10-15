"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TidalTokenGrabber_1 = __importDefault(require("./TidalTokenGrabber"));
const MemoryCache_1 = __importDefault(require("./MemoryCache"));
const express = require('express');
;
const DEFAULT_CONFIG = {
    favoritesFetchInterval: 60 * 5 * 1000,
    port: 3000
};
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Cache-Control': `public, max-age=${60 * 60 * 5}` // 5 hours cache
};
class TidalServer {
    constructor(config = DEFAULT_CONFIG) {
        this.config = config;
        this.ttg = new TidalTokenGrabber_1.default();
        this.cache = MemoryCache_1.default;
        this.server = express();
        this.beginScheduledJobs();
        this.setupServer();
    }
    ;
    setupServer() {
        this.server.get('/ping', (req, res) => {
            res.set(Object.assign({}, DEFAULT_HEADERS));
            res.status(200);
            res.send('');
            res.end();
        });
        this.server.get('/favorites', (req, res) => {
            const favoritesData = this.cache.getKey('favorites');
            if (!favoritesData) {
                res.status(404);
                res.send('');
                res.end();
                return;
            }
            res.status(200);
            res.send(favoritesData);
            res.end();
        });
        this.listener = this.server.listen(this.config.port);
    }
    fetchFavorites() {
        this.ttg.getFavoritesResponse()
            .then((values) => {
            const favoritesJSON = values[1];
            this.cache.setKey('favorites', favoritesJSON);
        })
            .catch(error => {
            console.log('Error in fetching favs', error);
        });
    }
    beginScheduledJobs() {
        setTimeout(() => {
            this.fetchFavorites();
        }, this.config.favoritesFetchInterval);
        this.fetchFavorites();
    }
    stop() {
        if (!this.listener) {
            return;
        }
        this.listener.close();
    }
}
exports.default = TidalServer;
