import json
from pathlib import Path
p=Path('public/competition-data.json');d=json.loads(p.read_text());version=next(r['version'] for r in d['rulesets'] if r['id']=='usap')
combos=[]
for id in ['usap-7270','usap-11044']:
 for product in ['RLD-1 sheets','Reload RLD-1 sheets']:
  combos.append(dict(baseApprovalId=id,rulesetId='usap',rulesetVersion=version,manufacturer='Reload',product=product,variant='RLD-1',status='approved',sourceUrl='https://equipment.usapickleball.org/paddle-list/entry/'+id.split('-')[1]+'/',productSourceUrl='https://www.reloadpaddle.com/products/rld-1-sheets',ruleSourceUrl='https://usapickleball.org/docs/rules/USAP-Official-Rulebook.pdf',lastVerified='2026-10-02',verificationState='verified',basis='USAP-listed RLD1 model; manufacturer identifies the OEM RLD-1 replacement sheets for that range; USAP 3.D.6.e permits OEM interchangeable replacement faces.'))
combos.append(dict(baseApprovalId='usap-8785',rulesetId='usap',rulesetVersion=version,manufacturer='PIKKL',product='Sport Skins',variant='SPSKSP13-SP13',status='approved',sourceUrl='https://equipment.usapickleball.org/paddle-list/entry/8785/',productSourceUrl='https://pikkl.com/products/sport-skins',ruleSourceUrl='https://usapickleball.org/docs/rules/USAP-Official-Rulebook.pdf',lastVerified='2026-10-02',verificationState='verified',basis='Exact USAP model number SPSKSP13-SP13; manufacturer identifies OEM Sport replacement skins. Not applicable to other PIKKL models.'))
d['configurationApprovals']=combos
# Explicit governing-body negative record. No inference from an unmatched name.
d['brandRestrictions']=[dict(organization='UPA-A',brand='Soxter',status='notApproved',sourceUrl='https://upaa.unitedpickleball.com/de-listed-paddles/',lastVerified='2026-10-02',summary='UPA-A explicitly states that no Soxter paddles have UPA-A certification.')]
d['modelRestrictions']=[dict(id='usap-facolos-elite-x-delisted',catalogIds=['plref_26aa6f6787a8cc13'],brand='Facolos',model='Pro Series – Elite X',organization='USAP',status='delisted',lastVerified='2026-10-02',sourceUrl='https://equipment.usapickleball.org/compliance/',verificationState='verified')]
p.write_text(json.dumps(d,indent=2)+'\n')
