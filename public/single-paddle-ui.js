import {markProAction} from './pro-actions.js';
export function adaptCollection(doc,paddles){
 const root=doc.getElementById('viewPaddles'),single=paddles.length===1;if(!root)return single;
 root.classList.toggle('single-paddle-library',single);
 const heading=root.querySelector('.collection-heading h2');if(heading)heading.textContent=single?'My paddle':'Your collection';
 const tab=doc.getElementById('collection-tab-paddles');if(tab)tab.textContent=single?'My paddle':'Collection';
 const insights=doc.getElementById('collectionInsights');if(insights)markProAction(insights,'lifecycleAnalytics',single?'Paddle insights':'Collection insights');
 const reorder=doc.getElementById('togglePaddleReorder');if(reorder){reorder.hidden=paddles.length<2;if(paddles.length<2&&reorder.getAttribute('aria-pressed')==='true')reorder.click();}
 return single;
}
export function adaptHomeHeading(doc,paddles,p,paddleName,picker){
 const heading=doc.querySelector('#mainPaddleCard .home-name-picker'),single=p&&paddles.filter(p=>p.status==='active').length===1;
 picker.hidden=!!single;
 if(single){heading.textContent=paddleName(p);doc.querySelector('.main-role').append(picker);}
 else (heading??doc.querySelector('.main-role')).append(picker);
}
