import {configuredAppleVerifier} from '@/lib/server/apple-verifier';
import {syncAppleTransaction} from '@/lib/server/apple-sync';
import {failure} from '@/lib/server/account';
import {storage} from '@/db/store';
// Apple signatures authorize this endpoint, not a user cookie. A public ingress is required
// before launch; the current owner-only Sites gate deliberately remains unchanged.
export async function POST(req:Request){try{const setup=await configuredAppleVerifier();const raw=await req.text();if(raw.length>200000)return new Response('Too large',{status:413});const payload=JSON.parse(raw);const notification=await setup.decoder.verifyAndDecodeNotification(payload.signedPayload);if(notification.notificationType==='TEST')return Response.json({received:true});const signed=notification.data?.signedTransactionInfo;if(!signed)return Response.json({received:true});const transaction=await setup.verifier.verify(signed);const a=await storage().prepare("SELECT id FROM leeway_accounts WHERE id=? AND status='active'").bind(transaction.appAccountToken).first<{id:string}>();if(!a)return Response.json({received:true});await syncAppleTransaction(a.id,signed,setup.verifier,setup.configuration);return Response.json({received:true});}catch(e){return failure(e);}}
