# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Known Security Issues

This document tracks known security vulnerabilities in dependencies that currently have no fixes available.

### Backend Dependencies

#### Critical Severity

1. **@sendinblue/client → request → form-data** (<2.5.4)
   - Issue: Unsafe random function for choosing boundary
   - Status: No fix available
   - Mitigation: The library is used for email services which are internal to the application. Consider migrating to the official SendGrid SDK or Nodemailer without SendInBlue.
   - Advisory: https://github.com/advisories/GHSA-fjxv-7rqg-78g4

#### High Severity

2. **xlsx** (\*)
   - Issue: Prototype Pollution & ReDoS
   - Status: No fix available
   - Mitigation: Only process trusted Excel files. Do not allow user-uploaded xlsx files without validation.
   - Advisory:
     - https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
     - https://github.com/advisories/GHSA-5pgg-2g8v-p4x9

3. **qs** (<6.14.1)
   - Issue: arrayLimit bypass allows DoS via memory exhaustion
   - Status: No fix available (dependency of deprecated `request` package)
   - Mitigation: Migrate away from @sendinblue/client
   - Advisory: https://github.com/advisories/GHSA-6rw7-vpxm-498p

#### Moderate Severity

4. **nodemailer** (<=7.0.10)
   - Issue: Email to unintended domain & DoS via recursive calls
   - Status: Fix available via `npm audit fix --force` (breaking change to v8.0.1)
   - Mitigation: Plan upgrade to nodemailer v8+ in next breaking release
   - Advisory:
     - https://github.com/advisories/GHSA-mm7p-fcc7-pg87
     - https://github.com/advisories/GHSA-rcmh-qjqh-p98v

5. **tough-cookie** (<4.1.3)
   - Issue: Prototype Pollution
   - Status: No fix available (dependency of deprecated `request` package)
   - Mitigation: Migrate away from @sendinblue/client
   - Advisory: https://github.com/advisories/GHSA-72xf-g2v4-qvf3

### Frontend Dependencies

#### Moderate Severity

1. **quill** (<=1.3.7)
   - Issue: Cross-site Scripting (XSS)
   - Status: No fix available
   - Impact: Used via @vueup/vue-quill
   - Mitigation:
     - Always sanitize user input before rendering
     - Use TipTap editor instead of Quill where possible
     - Validate and sanitize all HTML content from quill editors
   - Advisory: https://github.com/advisories/GHSA-4943-9vgg-gr5r

## Security Recommendations

### Immediate Actions

1. **Replace @sendinblue/client**: This package depends on the deprecated `request` library which has multiple vulnerabilities. Consider:
   - Migrating to the official SendGrid SDK: `@sendgrid/mail`
   - Using Nodemailer directly without SendInBlue wrapper
   - Using the official Brevo (SendInBlue renamed) SDK if available

2. **Review xlsx usage**:
   - Only process Excel files from trusted sources
   - Implement file validation and size limits
   - Consider alternative libraries like `exceljs` (already in dependencies)

3. **Upgrade nodemailer**: Plan for breaking change upgrade to v8.x in next major version

4. **Review Quill usage**:
   - Sanitize all content from Quill editors
   - Consider migrating completely to TipTap (already in dependencies)
   - Implement Content Security Policy (CSP) headers

### Long-term Actions

1. **Dependency Audit Schedule**: Run `npm audit` weekly
2. **Update Dependencies**: Keep all dependencies up-to-date monthly
3. **Security Headers**: Ensure helmet is properly configured
4. **Input Validation**: Always validate and sanitize user input
5. **CSP Implementation**: Implement Content Security Policy headers

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to [security@hptech.com](mailto:security@hptech.com).

**Please do not create public GitHub issues for security vulnerabilities.**

### What to include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to expect:

- Acknowledgment within 48 hours
- Assessment within 1 week
- Fix timeline communicated within 2 weeks

## Security Best Practices for Development

1. **Never commit secrets**: Use `.env` files (already in `.gitignore`)
2. **Use strong secrets**: Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
3. **Validate environment variables**: Run `npm run validate:env` before starting
4. **Keep dependencies updated**: Run `npm audit` regularly
5. **Review code changes**: Use PR reviews for all changes
6. **Follow OWASP guidelines**: Check OWASP Top 10 regularly

---

Last Updated: 2026-02-08
