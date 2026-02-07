# Arabic Translation Coverage Analysis

## Executive Summary
The platform is **partially translated**. The main CRM frontend (`leadify-frontend-main`) has the necessary infrastructure and good coverage for main interfaces, but suffers from "implementation gaps" in validation logic and newer/deeper pages. The Proposal system (`React proposal`) is **completely untranslated** (English only).

---

## 1. CRM Frontend checks (`leadify-frontend-main`)

**Status: 🟠 Partially Translated**

### ✅ What is Working
- **Infrastructure**: `nuxt/i18n` is correctly configured in `nuxt.config.ts`.
- **Locale Files**: `ar.json` exists and is actually *larger* than `en.json`, suggesting active maintenance.
- **Main UI**: Authentication pages (`login.vue`) and core layout elements use `$t()` for labels and structural text.

### ❌ Critical Gaps
1.  **Validation Messages (High Impact)**
    - **Issue**: Form validation using `yup` has hardcoded English strings.
    - **Example**: `yup.string().required("Email is required")` inside `login.vue`.
    - **Result**: Even if the interface is Arabic, error messages like "Valid email required" will appear in English.

2.  **Internal Pages (Medium Impact)**
    - **Issue**: Some dashboard pages seem to be completely skipped.
    - **Example**: `pages/settings/audit-logs.vue` is written in Pug with hardcoded text (`h2 Audit Logs`, `p Full transparency...`). It does not use `$t()` at all.
    - **Risk**: Pages created recently or by different developers might lack translations entirely.

3.  **Missing Keys**
    - `deals.errors.fillInvoices`
    - `deals.errors.fillDeliveries`

---

## 2. Proposal System (`React proposal`)

**Status: 🔴 Not Translated (English Only)**

- **Issue**: There is **no internationalization framework** installed (e.g., `react-i18next` or `react-intl`).
- **Evidence**:
    - `App.tsx` contains hardcoded strings: `"Loading..."`, `"Untitled Proposal"`.
    - `package.json` does not list any i18n libraries.
- **Impact**: Any proposal creating, viewing, or editing will be strictly in English.

---

## Recommendations

### Phase 1: Quick Wins (Frontend)
1.  **Refactor Validation**: Update `login.vue` and other forms to use `t()` in Yup schemas.
    ```javascript
    // Before
    .required("Email is required")
    
    // After
    .required(t('validation.email_required'))
    ```
2.  **Fix Audit Logs**: Convert `audit-logs.vue` hardcoded strings to use `$t()`.

### Phase 2: React Proposal Overhaul
1.  Install `react-i18next`.
2.  Extract all hardcoded strings from `src/App.tsx`, `src/proposal/*` components into locale files.
3.  Add a language switcher or sync it with the parent Nuxt app's language state (via URL query param or local storage).

### Phase 3: Audit
1.  Run a full scan for "hardcoded text" in `.vue` files to catch other pages like `audit-logs`.
