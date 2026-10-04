"""Apply the reviewed amateur snapshot after the professional rule updater. No user data is changed."""
import json
from pathlib import Path
p=Path('public/competition-data.json')
d=json.loads(p.read_text())
amateur=json.loads(r'''
{
  "id": "upa-amateur",
  "label": "UPA Amateur",
  "organization": "UPA",
  "competitionLevel": "amateur",
  "version": "UPA-A Rulebook v0.9 (August 2026), \u00a73.2.2 + scope-reviewed specifications v26.6",
  "effectiveAt": null,
  "endsAt": null,
  "lastVerified": "2026-10-02",
  "reviewDays": 30,
  "coverage": "recordedConfiguration",
  "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
  "rules": [
    {
      "id": "3.2.2 approval",
      "type": "approval",
      "summary": "General rules permit current USAP-listed paddles and encourage UPA-A approved paddles. Professional approval requirements remain separate.",
      "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
      "lastVerified": "2026-10-02",
      "organizations": [
        "UPA-A",
        "USAP"
      ]
    },
    {
      "id": "3.1.2",
      "type": "limit",
      "summary": "Overall paddle length includes the edge guard and butt cap.",
      "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/07/UPA-A-Paddle-Specifications-and-Testing-Requirements-V26.6-7.28.26.pdf",
      "lastVerified": "2026-10-02",
      "field": "length",
      "maximum": 17,
      "unit": "in",
      "code": "PADDLE_TOO_LONG",
      "supportingSources": [
        "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
        "https://www.ppatour.com/about/player-handbook/"
      ]
    },
    {
      "id": "3.1.1",
      "type": "limit",
      "summary": "Overall length plus width must fit this limit.",
      "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/07/UPA-A-Paddle-Specifications-and-Testing-Requirements-V26.6-7.28.26.pdf",
      "lastVerified": "2026-10-02",
      "field": "combined",
      "maximum": 24,
      "unit": "in",
      "code": "COMBINED_DIMENSIONS_EXCEEDED",
      "supportingSources": [
        "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
        "https://www.ppatour.com/about/player-handbook/"
      ]
    },
    {
      "id": "3.1.4",
      "type": "limit",
      "summary": "Total configured weight includes grips and all modifications.",
      "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/07/UPA-A-Paddle-Specifications-and-Testing-Requirements-V26.6-7.28.26.pdf",
      "lastVerified": "2026-10-02",
      "field": "staticWeight",
      "maximum": 10,
      "unit": "oz",
      "code": "WEIGHT_LIMIT_EXCEEDED",
      "applicability": "requiresConfirmation",
      "applicabilitySourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
      "applicabilityNote": "General rule 3.2.2 references these specifications, but their preface states professional-event scope. Confirm application to this amateur division with the organizer."
    },
    {
      "id": "3.1.3",
      "type": "range",
      "summary": "Hitting-area thickness must be greater than 6 mm and less than 24 mm; section 1.1 summarizes a maximum of 24 mm. Exactly 24 mm requires governing-body clarification. Variation across the face must not exceed 1 mm.",
      "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/07/UPA-A-Paddle-Specifications-and-Testing-Requirements-V26.6-7.28.26.pdf",
      "lastVerified": "2026-10-02",
      "field": "thickness",
      "minimum": 6,
      "maximum": 24,
      "unit": "mm",
      "code": "THICKNESS_NONCOMPLIANT",
      "applicability": "requiresConfirmation",
      "applicabilitySourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
      "applicabilityNote": "General rule 3.2.2 references these specifications, but their preface states professional-event scope. Confirm application to this amateur division with the organizer."
    },
    {
      "id": "3.4.2 / 3.1.6",
      "type": "skin",
      "summary": "Except for grips, removable components are prohibited. Replaceable paddle skins are not among the permitted customizations.",
      "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/07/UPA-A-Paddle-Specifications-and-Testing-Requirements-V26.6-7.28.26.pdf",
      "lastVerified": "2026-10-02",
      "policy": "prohibited",
      "crossBrand": "unknown",
      "applicability": "requiresConfirmation",
      "applicabilitySourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
      "applicabilityNote": "General rule 3.2.2 references these specifications, but their preface states professional-event scope. Confirm application to this amateur division with the organizer."
    },
    {
      "id": "3.1.5 / 3.4.1",
      "type": "weightPlacement",
      "summary": "Perimeter weighting must use flat weighted tape. Handle or butt-cap weights must be securely fixed. Moveable or adjustable components are prohibited.",
      "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/07/UPA-A-Paddle-Specifications-and-Testing-Requirements-V26.6-7.28.26.pdf",
      "lastVerified": "2026-10-02",
      "policy": "upaa",
      "applicability": "requiresConfirmation",
      "applicabilitySourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
      "applicabilityNote": "General rule 3.2.2 references these specifications, but their preface states professional-event scope. Confirm application to this amateur division with the organizer."
    },
    {
      "id": "3.4.3",
      "type": "accessories",
      "summary": "Edge tape, edge guards, overgrips, grip inserts, replacement butt caps, and butt-cap weights are permitted, subject to the other equipment requirements.",
      "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/07/UPA-A-Paddle-Specifications-and-Testing-Requirements-V26.6-7.28.26.pdf",
      "lastVerified": "2026-10-02",
      "supportingSources": [
        "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
        "https://www.ppatour.com/about/player-handbook/"
      ]
    },
    {
      "id": "3.2.2 condition and inspection",
      "type": "inspection",
      "summary": "Paddles remain subject to inspection and continued compliance review. Delamination, holes, cracks, rough textures, and surface-breaking indentations are not permitted. An approved model does not establish the current condition of this physical unit.",
      "sourceUrl": "https://upaa.unitedpickleball.com/wp-content/uploads/2026/08/V0.9-8.24.26-UPA-A-Rulebook-.pdf",
      "lastVerified": "2026-10-02"
    }
  ],
  "coverageNote": "Amateur model approval, shared dimension limits, recorded accessories, and surface-condition inspection are covered. Professional specification applicability remains unresolved where it changes an amateur result. Such cases request verification instead of issuing a prohibition.",
  "conflicts": []
}
''')
for index, rule in enumerate(d['rulesets']):
    if rule['id']=='upa-amateur':
        d['rulesets'][index]=amateur
        break
else:
    raise SystemExit('Existing amateur ruleset missing; aborting')
p.write_text(json.dumps(d,indent=2)+'\n')
