---
type: check-answers
rows:
  - heading: Your juggling
  - key: Balls you can juggle
    value: '{{ ballCount }}'
    change: how-many-balls
    changeHidden: how many balls you can juggle
  - key: What you juggle with
    value: '{{ jugglingObjects }}'
    change: juggling-objects
    changeHidden: what you juggle with
  - key: Years juggling
    value: '{{ yearsJuggling | plural "year" }}'
    change: years-juggling
    changeHidden: how many years you have been juggling
  - key: Most impressive trick
    value: '{{ bestTrick }}'
    change: best-trick
    changeHidden: your most impressive trick
  - key: Photo of your trick
    value: '{{ trickPhoto }}'
    change: trick-photo
    changeHidden: photo of your trick
  - heading: Your details
  - key: Full name
    value: '{{ applicantDetails.fullName }}'
    change: your-details
    changeHidden: full name
  - key: Phone number
    value: '{{ applicantDetails.phone or "Not given" }}'
    change: your-details
    changeHidden: phone number
  - key: Email address
    value: '{{ applicantEmail }}'
    change: email-address
    changeHidden: email address
actions:
  - text: Accept and send
    kind: submit
---

# Check your answers before sending your application

By sending this application you confirm that, to the best of your knowledge, the details you are providing are correct.
