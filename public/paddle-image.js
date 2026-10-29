import {findCatalogEntry} from './catalog.js';
export const paddlePlaceholder='/paddle-placeholder.svg';
export function paddleImage(p,rows=[]){
 const row=findCatalogEntry(rows,p.brand,p.model,p.shape,p.thickness,p.modelId);
 const image=row?.referenceRecord?.image;
 const valid=typeof image?.url==='string'&&(/^https:\/\//.test(image.url)||/^\/catalog-images\//.test(image.url));
 const fallback=valid?image.url:paddlePlaceholder;
 return {src:p.photoId?'/api/photos?id='+encodeURIComponent(p.photoId):fallback,fallback,kind:p.photoId?'uploaded':valid?'catalog':'placeholder',alt:p.photoId?'Your paddle photo':valid?(image.alt||'Catalog paddle photo'):'Paddle illustration — product photo not available'};
}
export function recoverPaddleImage(image){
 const next=image.dataset.paddleFallback;
 if(!next)return;
 if(image.getAttribute('src')!==next){image.src=next;image.alt='Default paddle image';}
 else if(next!==paddlePlaceholder){image.dataset.paddleFallback=paddlePlaceholder;image.src=paddlePlaceholder;image.alt='Paddle illustration — product photo not available';}
 else delete image.dataset.paddleFallback;
}
