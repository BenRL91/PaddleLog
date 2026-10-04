import {Capacitor} from '@capacitor/core';
import {purchasingPlatform} from './platform-policy.js';
import {billingConfig} from '../public/billing-config.js';
import {applePurchases,observeAppleTransactions} from './apple-purchases';
import {transactionServer} from './transaction-client';
/** Native shell integration point. Deliberately fails closed until native authentication
 * is configured; a private Sites session is not a public App Store account system. */
import {App} from '@capacitor/app';
import {Network} from '@capacitor/network';
import {Preferences} from '@capacitor/preferences';
import {Haptics,ImpactStyle} from '@capacitor/haptics';
import {Share} from '@capacitor/share';
import {Camera,CameraResultType,CameraSource} from '@capacitor/camera';
import type {AuthAdapter} from '../shared/contracts';
declare global {interface Window {paddleLifeAuth?:AuthAdapter;paddleLifeNative?:unknown;paddleLifePurchaseProvider?:unknown;paddleLifeTransactionVerifier?:unknown}}
const apiOrigin=(import.meta.env as unknown as {VITE_API_ORIGIN?:string}).VITE_API_ORIGIN;
if(!apiOrigin||!apiOrigin.startsWith('https://')||!window.paddleLifeAuth){
 document.body.textContent='Native account integration is not configured. Complete the native authentication setup before distributing this build.';
}else{
 const auth=window.paddleLifeAuth;
 window.paddleLifeNative={
  // Preferences is for non-secret preferences only. Tokens require Keychain on iOS / Keystore on Android.
  preferences:Preferences,
  photo:()=>Camera.getPhoto({quality:85,resultType:CameraResultType.Uri,source:CameraSource.Prompt}),
  haptic:()=>Haptics.impact({style:ImpactStyle.Light}),share:Share.share,
 };
 const originalFetch=window.fetch.bind(window);
 window.fetch=async(input,init={})=>{
  if(typeof input==='string'&&input.startsWith('/api/')){const token=await auth.accessToken();if(!token)return new Response(JSON.stringify({error:'Sign in required'}),{status:401});const headers=new Headers(init.headers);headers.set('Authorization','Bearer '+token);return originalFetch(apiOrigin+input,{...init,headers,credentials:'omit'});}
  return originalFetch(input,init);
 };
 await App.addListener('appStateChange',({isActive})=>{window.dispatchEvent(new Event(isActive?'paddlelife:resume':'pagehide'));});
 await Network.addListener('networkStatusChange',({connected})=>window.dispatchEvent(new Event(connected?'online':'offline')));
 await App.addListener('appUrlOpen',({url})=>{ // Consume only registered, allowlisted auth callbacks in the configured adapter.
  window.dispatchEvent(new CustomEvent('paddlelife:deep-link',{detail:{url}}));
 });
 if(billingConfig.purchasesEnabled&&purchasingPlatform(Capacitor.getPlatform())==='apple'){window.paddleLifePurchaseProvider=applePurchases;window.paddleLifeTransactionVerifier=transactionServer;await observeAppleTransactions(async signed=>{const current=await auth.currentAccount();if(!current)throw new Error('Sign in required');return transactionServer.verifyAndSync(current.id,signed);});}
 const appModule='/app.js';await import(/* @vite-ignore */ appModule);
}
