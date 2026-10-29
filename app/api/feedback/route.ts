import {account,failure,AccountError,crossSite} from '@/lib/server/account';
import {storage} from '@/db/store';
import {feedbackInput} from '@/lib/server/feedback';
export async function GET(req:Request){try{const a=await account(false,req);const r=await storage().prepare('SELECT id,kind,message,screen,version,status,resolution,fixed_version AS fixedVersion,created_at AS createdAt FROM feedback_reports WHERE account_id=? ORDER BY created_at DESC LIMIT 50').bind(a.id).all();return Response.json({reports:r.results},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){try{
 if(crossSite(req))throw new AccountError(403,'Cross-site request rejected.');const a=await account(false,req);const raw=await req.text();if(raw.length>12000)throw new AccountError(413,'Report too large.');let d;try{d=feedbackInput(JSON.parse(raw));}catch(e){throw new AccountError(400,e instanceof Error?e.message:'Invalid report.');}
 const db=storage(),now=Date.now();await db.prepare('INSERT OR IGNORE INTO feedback_reports(id,account_id,kind,message,screen,steps,version,context,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(d.id,a.id,d.kind,d.message,d.screen,d.steps,d.version,d.context,now,now).run();
 const row=await db.prepare('SELECT account_id,kind,message,screen,steps,version,context FROM feedback_reports WHERE id=?').bind(d.id).first<Record<string,unknown>>();
 if(!row||row.account_id!==a.id||['kind','message','screen','steps','version','context'].some(k=>row[k]!==d[k as keyof typeof d]))throw new AccountError(409,'This report reference is already used. Start a new report; saved feedback is unchanged.');
 return Response.json({saved:true,id:d.id},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
