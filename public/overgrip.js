import {componentWear} from './maintenance.js';
export {wearLevels} from './maintenance.js';
export function overgripWear(paddle,sessions,interval=2){return componentWear(paddle,sessions,'overgrip',{overgripHoursPerLevel:interval});}
