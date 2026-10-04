import json
from pathlib import Path
p=Path('public/competition-data.json'); d=json.loads(p.read_text()); incoming=json.loads(Path('data/research/competition-2026-10-02/paddle-approvals.json').read_text()); snapshot=json.loads(Path('data/upa-official-snapshot-2026-10-02.json').read_text())
norm=lambda x:str(x or '').strip().lower()
aliases={'selkirk sport':'selkirk','six zero':'sixzero','engage pickleball':'engage','franklin sports':'franklin','honolulu pickleball company':'honolulu','li ning':'li-ning','proxr pickleball':'proxr','rpm pickleball':'rpm','eleven zero':'elevenzero'}
def brand(x):return aliases.get(norm(x),norm(x))
def same(a,b):return brand(a['brand'])==brand(b['brand']) and norm(a['model'])==norm(b['model']) and norm(a['modelNumber'])==norm(b['modelNumber']) and a['thicknessMm']==b['thicknessMm']
records=[]
for a in incoming['records']:
 matches=[b for b in snapshot['rows'] if a['organization']=='UPA-A' and same(a,b)]
 records.append({**a,'organization':'USAP' if a['organization']=='USA Pickleball' else a['organization'],'status':{'pass':'approved','certified':'approved','removed':'delisted'}[a['status']],'lastVerified':'2026-10-02' if matches else None,'verificationState':'verified' if matches else 'importedClaim','blackoutMetadataVerified':False,'verificationBasis':'Exact brand/model/model-number/thickness match against official list retrieved 2026-10-02; blackout icon not verified.' if matches else a.get('verificationBasis','Imported research; current official record not independently verified.')})

for a in records:
 if a['catalogId']=='plref_cdc4e21142224c64' and a['organization']=='USAP':
  a.update(sourceUrl='https://equipment.usapickleball.org/paddle-list/entry/11441/',lastVerified='2026-10-02',verificationState='verified',verificationBasis='Exact official USAP entry 11441: Selkirk Sport, Project Boomstik Widebody 16mm, Pass, 16mm, InfiniGrit. Reviewed October 2, 2026.')
 if a['organization']=='UPA-A' and 'No MOI Clamps Allowed' in a['model']:a['conditions']=['No MOI clamps allowed, as stated in this official model listing.']
d['approvals']=records;d['publishedAt']='2026-10-02';d['approvalSnapshot']={'importedRecords':len(records),'independentlyMatched':sum(a['verificationState']=='verified' for a in records),'unverifiedClaims':sum(a['verificationState']!='verified' for a in records),'reviewDays':30}
for r in d['rulesets']:
 if r['id'] in ['usap','cnpl','ppa-pro','mlp-pro','upa-amateur']:
  r['lastVerified']='2026-10-02'
  for rule in r['rules']:rule['lastVerified']='2026-10-02'
 if r['id']=='cnpl':r['version']='1.09 (June 22, 2026), §4.1';r['effectiveAt']='2026-06-22'
 if r['id'] in ['ppa-pro','mlp-pro']:
  r['conflicts']=[{'summary':'Imported research reports conflicting professional approval wording between the general rulebook and dedicated certification guidance. Event confirmation is required pending reconciliation.','sourceUrl':'https://upaa.unitedpickleball.com/paddle-testing/2026-upa-a-certification/','lastVerified':'2026-10-02'}]
p.write_text(json.dumps(d,indent=2)+'\n')
print(d['approvalSnapshot'])
