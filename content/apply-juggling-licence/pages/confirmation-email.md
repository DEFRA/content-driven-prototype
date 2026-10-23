---
type: content
layout: email
title: Email sent from the Apply for a juggling licence service
---

:::inset
**To:** {{ applicantEmail or "user@example.com" }}

**Subject:** Juggling licence application received
:::

# Juggling licence application received

Dear {{ applicantDetails.fullName or "applicant" }},

We have received your application for a juggling licence.

## Your reference number: {{ applicationReference }}

We will review your application and contact you within 5 working days.

You can [apply for another licence](./start) at any time.
