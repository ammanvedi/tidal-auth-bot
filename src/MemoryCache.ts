export type SimpleCache = {
    [ key: string ]: any
}

export class SimpleMemoryCache {

    cache: SimpleCache = {};

    constructor() {}

    static cloneObject( value: any ) {
        return JSON.parse( JSON.stringify( value ) );
    };

    getKey( key: string ): any {
        return this.cache[ key ];
    };

    setKey( key: string, value: any ): void {
        this.cache[ key ] = SimpleMemoryCache.cloneObject( value );
    };
}

export default new SimpleMemoryCache();