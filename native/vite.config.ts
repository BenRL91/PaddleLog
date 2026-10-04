import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({build:{outDir:resolve(import.meta.dirname,'www'),emptyOutDir:false,lib:{entry:resolve(import.meta.dirname,'bootstrap.ts'),formats:['es'],fileName:()=> 'bootstrap.js'},rollupOptions:{output:{codeSplitting:false}}}});
