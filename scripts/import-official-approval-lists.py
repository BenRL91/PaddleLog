"""Parse cached public approval pages. Fail closed on missing pages or changed counts.
Usage: python scripts/import-official-approval-lists.py /tmp/usap-pages /tmp/upa-list.html --retrieved-at YYYY-MM-DD --output /tmp/candidate.json
Only writes a candidate; review/apply through refresh-approval-snapshot.mjs.
The snapshot is list membership, not a claim of physical/configuration conformity.
"""
import re,json,html,sys,hashlib,argparse
from pathlib import Path
from datetime import datetime
clean=lambda s:re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',s))).strip()
def norm(s):return re.sub(r'[^a-z0-9]','',str(s or '').lower())
aliases={'selkirksport':'selkirk','sixzero':'sixzero','engagepickleball':'engage','franklinsports':'franklin','honolulupickleballcompany':'honolulu','breadandbutterpickleballcompany':'breadbutter','breadandbutter':'breadbutter','proxrpickleball':'proxr','rpmpickleball':'rpm'}
def brand(s):return aliases.get(norm(s),norm(s))
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('usap_pages');parser.add_argument('upa_page');parser.add_argument('supplemental_pages',nargs='?');parser.add_argument('--retrieved-at',required=True);parser.add_argument('--output',required=True)
args=parser.parse_args();retrieved=datetime.strptime(args.retrieved_at,'%Y-%m-%d').strftime('%Y-%m-%d')
root=Path(args.usap_pages); first=(root/'1.html').read_text()
count=int(re.search(r'Displaying 1 - 25 of ([\d,]+)',first)[1].replace(',','')); pages=(count+24)//25
records=[]; seen=set(); hashes=[]
inputs=[(n,root/f'{n}.html') for n in range(1,pages+1)]
if args.supplemental_pages:inputs += [(int(p.stem),p) for p in Path(args.supplemental_pages).glob('*.html')]
for n,page in inputs:
 text=page.read_text(); hashes.append(hashlib.sha256(text.encode()).hexdigest())
 display=re.search(r'Displaying ([\d,]+) - ([\d,]+) of ([\d,]+)',text)
 assert display and int(display[1].replace(',',''))==(n-1)*25+1 and int(display[3].replace(',',''))==count, f'Pagination changed: {n}'
 blocks=text.split('gv-layout-builder-view--entry gv-grid')[1:]
 assert len(blocks)==min(25,count-(n-1)*25),f'Unexpected page size {n}'
 for b in blocks:
  values=re.findall(r'<div class="gv-grid-value">(.*?)</div>',b,re.S)[:3]
  url=re.search(r'https://equipment.usapickleball.org/paddle-list/entry/(\d+)',values[0]);assert url
  id='usap-'+url[1]
  if id in seen:continue
  seen.add(id)
  annotations=[clean(x) for x in re.findall(r'<span style="color: #d20000;">(.*?)</span>',b,re.S) if clean(x)]
  # Never silently turn an annotated listing into an unconditional approval.
  status='approved' if not annotations else 'needsVerification'
  model=clean(values[1]);mm=re.search(r'(?i)(\d+(?:\.\d+)?)\s*mm\b',model)
  records.append(dict(id=id,organization='USAP',brand=clean(values[0]),model=model,thicknessMm=float(mm[1]) if mm else None,status=status,conditions=annotations,addedDate=(re.search(r'\b\d{2}/\d{2}/\d{4}\b',' '.join(values))[0] if re.search(r'\b\d{2}/\d{2}/\d{4}\b',' '.join(values)) else None),sourceUrl='https://equipment.usapickleball.org/paddle-list/entry/'+url[1]+'/',lastVerified=retrieved,verificationState='verified',verificationBasis='Exact entry in complete paginated official list snapshot; no physical inspection.'))
assert len(records)==count,f'Unique entries {len(records)} do not match published total {count}; do not publish as complete.'
upa=Path(args.upa_page).read_text();rows=re.findall(r'<tr class="paddle-row[^>]*>(.*?)</tr>',upa,re.S)
assert rows
for r in rows:
 cells=re.findall(r'<td[^>]*>(.*?)</td>',r,re.S);assert len(cells)==7
 _,_,b,m,num,mm,dt=map(clean,cells)
 key='|'.join([b,m,num,mm]); added=datetime.strptime(dt,'%b %d, %Y')
 records.append(dict(id='upaa-'+hashlib.sha256(key.encode()).hexdigest()[:16],organization='UPA-A',brand=b,model=m,modelNumber=num,thicknessMm=float(re.search(r'[\d.]+',mm)[0]),status='approved',addedDate=added.strftime('%Y-%m-%d'),certificationExpiryNeedsVerification=True,sourceUrl='https://upaa.unitedpickleball.com/approved-paddles/',lastVerified=retrieved,verificationState='verified',blackoutMetadataVerified=False,conditions=['No MOI clamps allowed.'] if 'No MOI Clamps Allowed' in m else [],verificationBasis='Exact complete official table row, including model number and thickness; appearance still requires verification.'))
# Link only unambiguous exact catalog identities. Never fuzzy-match an approval.
models=json.loads(Path('public/reference-catalog.json').read_text())['models']
for a in records:
 matches=[m for m in models if brand(m['brand'])==brand(a['brand']) and norm(m['model'])==norm(a['model']) and (a['thicknessMm'] is None or m.get('thickness')==a['thicknessMm']) and (not a.get('modelNumber') or not m.get('modelNumber') or norm(a['modelNumber'])==norm(m['modelNumber']))]
 if len(matches)==1:a['catalogIds']=[matches[0]['id']]
snapshot={'retrievedAt':retrieved,'scope':'All displayed official list entries, not all possible skin combinations or physical test results.','lists':[{'organization':'USAP','count':count,'pages':pages,'complete':True,'sourceUrl':'https://equipment.usapickleball.org/paddle-list/','retrievedPageCount':len(inputs),'pageSha256':hashes},{'organization':'UPA-A','count':len(rows),'pages':1,'complete':True,'sourceUrl':'https://upaa.unitedpickleball.com/approved-paddles/','sha256':hashlib.sha256(upa.encode()).hexdigest()}],'records':records}
Path(args.output).write_text(json.dumps(snapshot,indent=2)+'\n')
print({'candidate':args.output,'usap':count,'upaA':len(rows),'catalogMatches':sum(bool(a.get('catalogIds')) for a in records),'annotations':sum(a['status']!='approved' for a in records)})
