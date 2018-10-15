import Server from './Server';

new Server( {
    favoritesFetchInterval: 1000 * 60 * 60 * 5, // 5 hours
    port: 3000
} );