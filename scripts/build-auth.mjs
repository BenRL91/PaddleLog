import {build} from 'vite';
await build({configFile:false,publicDir:false,build:{outDir:'public',emptyOutDir:false,lib:{entry:'web/auth.ts',formats:['es'],fileName:()=> 'leeway-auth.js'},minify:true,rollupOptions:{output:{inlineDynamicImports:true}}}});
