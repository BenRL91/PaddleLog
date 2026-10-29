import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {mountTutorials,tutorials} from '../public/tutorials.js';
const w=new Window(),d=w.document;
d.body.innerHTML='<section data-tutorial="main"></section><section data-tutorial-library></section>';
mountTutorials(d);
assert.doesNotMatch(tutorials.main.steps.join(' '),/gender doubles|paddle role/);
const contextual=d.querySelector('[data-guide]:not([data-guide-library])');
contextual.open=true;contextual.querySelector('button').click();assert.equal(contextual.hidden,true);
assert.equal(d.querySelector('[data-guide-library]').hidden,false);
mountTutorials(d);assert.equal(d.querySelector('[data-guide]:not([data-guide-library])').hidden,true);
d.querySelector('[data-restore-guides]').click();assert.equal(d.querySelector('[data-guide]:not([data-guide-library])').hidden,false);
assert.match(d.querySelector('[data-guide-status]').textContent,/visible again/);
// New guides remain reachable, and adding guides does not reset dismissed choices.
for(const key of ['collection','paddlePeriods','games','picklePoint','costs','supplies','costOfPlay','reflections','experiments','comparison']){
 assert.ok(tutorials[key].steps.length>=3);
 assert.ok(d.querySelector(`[data-guide-library][data-guide="${key}"]`));
}
assert.match(tutorials.sessions.steps.join(' '),/Play → Sessions/);
assert.match(tutorials.maintenance.tip,/2 hours/);
assert.match(tutorials.maintenance.steps.join(' '),/Delete record/);
assert.match(tutorials.games.tip,/counts it twice/);
assert.match(tutorials.costOfPlay.tip,/entire collection/);
await w.happyDOM.abort();console.log('PASS: optional tip dismissal persists, Settings guides remain available, restore reveals tips, current single-Main guidance.');
