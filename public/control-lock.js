// Restore each existing control's original state, including intentional restrictions.
export function lockControls(root,selector='button,input,select,textarea'){
 const previous=new Map([...root.querySelectorAll(selector)].map(control=>[control,control.disabled]));
 for(const control of previous.keys())control.disabled=true;
 return ()=>{for(const [control,disabled] of previous)if(control.isConnected)control.disabled=disabled;};
}
