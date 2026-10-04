import fs from 'node:fs/promises';
// Ships local assets; never uses a remote server.url as the app itself.
await fs.rm(new URL('./www',import.meta.url),{recursive:true,force:true});
await fs.cp(new URL('../public',import.meta.url),new URL('./www',import.meta.url),{recursive:true});
let html=await fs.readFile(new URL('../app/paddle.html',import.meta.url),'utf8');
html=html.replace(/<script[^>]*src="\/app.js[^\"]*"[^>]*><\/script>/,'<script type="module" src="/bootstrap.js"></script>');
if(!html.includes('src="/bootstrap.js"')||html.includes('/app.js?v='))throw new Error('Native entry replacement failed');
await fs.writeFile(new URL('./www/index.html',import.meta.url),html);
console.log('Shared UI exported. Build bootstrap, configure native auth, then run cap sync.');
