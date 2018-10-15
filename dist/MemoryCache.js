"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SimpleMemoryCache {
    constructor() {
        this.cache = {};
    }
    static cloneObject(value) {
        return JSON.parse(JSON.stringify(value));
    }
    ;
    getKey(key) {
        return this.cache[key];
    }
    ;
    setKey(key, value) {
        this.cache[key] = SimpleMemoryCache.cloneObject(value);
    }
    ;
}
exports.SimpleMemoryCache = SimpleMemoryCache;
exports.default = new SimpleMemoryCache();
