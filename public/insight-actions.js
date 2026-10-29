import {escapeHTML as esc} from './comparison-ui.js';
export function insightEdit(p,label,field){return `<button type="button" class="btn" data-insight-cta data-personalize="${esc(p.id)}" data-field="${esc(field)}">${esc(label)}</button>`;}
export function insightSession(p=null){return `<button type="button" class="btn" data-insight-cta ${p?`data-action="log" data-id="${esc(p.id)}"`:'data-open-past-session'}>Add past session</button>`;}
export function insightMaintenance(p,label='Record maintenance'){return `<button type="button" class="btn" data-insight-cta data-maint="overgrip" data-paddle="${esc(p.id)}">${esc(label)}</button>`;}
