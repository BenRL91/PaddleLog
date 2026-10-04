/* Device-local appearance; deliberately separate from account/library data. */
(() => {
  const key='paddlelog.appearance.v1', root=document.documentElement;
  const media=typeof matchMedia==='function'?matchMedia('(prefers-color-scheme: light)'):null;
  const normalize=value=>({mode:['dark','light','system'].includes(value?.mode)?value.mode:'dark',accent:['rally', 'ocean', 'forest', 'violet', 'pink', 'teal', 'orange', 'gold', 'indigo', 'slate'].includes(value?.accent)?value.accent:'rally'});
  let preference;try{preference=normalize(JSON.parse(localStorage.getItem(key)));}catch{preference=normalize(null);}
  function apply(){const light=preference.mode==='light'||(preference.mode==='system'&&media?.matches);root.dataset.appearance=light?'light':'dark';root.dataset.accent=preference.accent;root.style.colorScheme=light?'light':'dark';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#f5f6f8':'#09090b');}
  function sync(){const mode=document.getElementById('appearanceMode'),accent=document.getElementById('appearanceAccent');if(mode)mode.value=preference.mode;if(accent)accent.value=preference.accent;}
  function init(){sync();for(const id of ['appearanceMode','appearanceAccent'])document.getElementById(id)?.addEventListener('change',()=>{preference=normalize({mode:document.getElementById('appearanceMode').value,accent:document.getElementById('appearanceAccent').value});apply();const status=document.getElementById('appearanceStatus');try{localStorage.setItem(key,JSON.stringify(preference));status.textContent='Appearance saved on this device.';}catch{status.textContent='Applied for now. This browser could not save your preference.';}});}
  apply();media?.addEventListener?.('change',apply);
  window.addEventListener('storage',e=>{if(e.key!==key)return;try{preference=normalize(JSON.parse(e.newValue));}catch{preference=normalize(null);}apply();sync();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
