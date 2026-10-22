/* Migration from the retired application: discard its offline cache and retire this worker. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(/^(rhone-weekend-|vmach-badges-)/i.test(key))await caches.delete(key);await self.registration.unregister();for(const client of await self.clients.matchAll({type:'window'}))await client.navigate(client.url);})()));
