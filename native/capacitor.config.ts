// Set the real registered identifier before generating Xcode files.
const appId=process.env.PADDLELOG_APP_ID||process.env.PADDLELIFE_APP_ID;
if(!appId||!/^([A-Za-z][A-Za-z0-9-]*\.)+[A-Za-z][A-Za-z0-9-]*$/.test(appId))throw new Error('Set PADDLELOG_APP_ID to your registered bundle identifier / Android package name.');
export default {appId,appName:'PaddleLog',webDir:'www',ios:{contentInset:'automatic'},plugins:{SplashScreen:{launchAutoHide:true}}};
