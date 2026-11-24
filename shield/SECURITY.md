# Security policy

## Reporting a vulnerability in Hyniqe Shield

Please report security problems in Hyniqe Shield itself (for example a way to make the scanner execute code, or a crafted file that crashes or hangs it) privately through GitHub's "Report a vulnerability" button on the repository's Security tab. Please do not open a public issue.

## Reporting a missed attack

If Hyniqe Shield gives "No known risks found" for an add-on that is malicious, open an issue with a minimal, inert sample (no working payloads or real secrets) and we will add a rule and a test.

## Design commitments

- The scanner never executes, imports or installs the files it checks.
- The browser checker runs on your device and does not send content anywhere.
- Secrets found during a scan are masked in every report format.
