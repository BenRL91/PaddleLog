// Never send Android purchases through the Apple plugin.
export function purchasingPlatform(platform){return platform==='ios'?'apple':platform==='android'?'google':null;}
