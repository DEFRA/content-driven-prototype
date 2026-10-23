---
type: check-answers
rows:
  - key: Name
    value: '{{ account.fullName }}'
  - key: Email address
    value: '{{ account.email or "Not given" }}'
  - key: Renew for
    value: '{{ renewalLength }}'
    change: renewal-length
    changeHidden: how long to renew for
actions:
  - text: Renew licence
    kind: submit
---

# Check your answers
