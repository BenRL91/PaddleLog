// Appearance only: choose assets from the same canonical geometry, never change the ball.
(() => {
 const root=document.documentElement;
 function apply(){const mode=root.dataset.appearance==='light'?'light':'dark',theme=root.dataset.accent||'rally',base='/brand/icons/'+theme+'-'+mode;
 const icon=document.querySelector('link[rel="icon"]');if(icon)icon.href=base+'.svg?v=gold-ball1';const touch=document.querySelector('link[rel="apple-touch-icon"]');if(touch)touch.href=base+'.png?v=gold-ball1';
 }
 new MutationObserver(apply).observe(root,{attributes:true,attributeFilter:['data-appearance','data-accent']});apply();
})();
