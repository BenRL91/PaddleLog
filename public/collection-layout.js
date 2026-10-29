export function createCollectionLayout({doc}){
 const list=doc.getElementById('paddleList');if(!list)return;
 // One compact layout while Gallery is retired; ignore older device preferences.
 list.dataset.layout='list';
 doc.querySelectorAll('.collection-layout-controls').forEach(node=>node.remove());
 return {layout:()=>list.dataset.layout};
}
