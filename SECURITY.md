# Security Policy

## Reporting a vulnerability

Report vulnerabilities privately through GitHub Security Advisories:

**[Open a private advisory](https://github.com/zentech-graduation/app-fe/security/advisories/new)**

Do not open a public GitHub issue for security reports.

## What to include

Provide:

- A short description of the issue and why it matters
- The affected page, route, component, or API interaction
- Steps to reproduce
- Any required environment details such as `VITE_API_URL` or auth state
- Screenshots, console output, or network traces if they help
- A suggested fix or mitigation, if you have one

## Scope

Examples of issues that are in scope:

- Authentication or authorization bypass in the frontend flow
- Exposure of secrets, tokens, or sensitive user data in the UI, storage, or network requests
- Unsafe handling of user-controlled content that could lead to XSS
- Broken route protection or privilege checks
- Misconfiguration that sends data to the wrong backend or environment

Examples of issues that are usually out of scope for this repository alone:

- Purely visual defects with no security impact
- Missing product features
- Backend-only vulnerabilities that cannot be influenced or exposed by this frontend
- Vulnerabilities already disclosed publicly in third-party dependencies without a repository-specific exploit path

## Response expectations

- Initial acknowledgment: within 5 business days
- Triage follow-up: after the report is reviewed
- Remediation timeline: shared after severity and impact are understood

## Disclosure

Keep vulnerability details private until a fix is available and coordinated disclosure is agreed.
