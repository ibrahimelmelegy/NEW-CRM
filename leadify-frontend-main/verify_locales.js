
const fs = require('fs');
const path = require('path');

const arPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\ar.json');
const enPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\en.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

let errors = [];

// 1. Check Structure
if (ar.form) errors.push("FAIL: 'form' object still exists at root of ar.json");
if (!ar.deals.form) errors.push("FAIL: 'deals.form' object missing in ar.json");

// 2. Check Specific Keys
const checkKeys = (obj, prefix, lang) => {
    ['role.form.name', 'staff.form.fullName', 'procurement.createTitle', 'notifications.title', 'auth.resetTitle', 'operations.vehicle.form.name', 'procurement.purchaseOrders.title'].forEach(key => {
        const parts = key.split('.');
        let val = obj;
        for (const p of parts) {
            val = val ? val[p] : undefined;
        }
        if (!val) errors.push(`FAIL: Key '${key}' missing in ${lang}.json`);
    });
};

checkKeys(ar, '', 'ar');
checkKeys(en, '', 'en');

// 3. Simple parity check (count)
const flattenObj = (ob) => {
    let result = {};
    for (const i in ob) {
        if ((typeof ob[i]) === 'object' && !Array.isArray(ob[i])) {
            const temp = flattenObj(ob[i]);
            for (const j in temp) {
                result[i + '.' + j] = temp[j];
            }
        } else {
            result[i] = ob[i];
        }
    }
    return result;
};

const arFlat = flattenObj(ar);
const enFlat = flattenObj(en);

const arCount = Object.keys(arFlat).length;
const enCount = Object.keys(enFlat).length;

console.log(`AR Keys: ${arCount}`);
console.log(`EN Keys: ${enCount}`);

if (Math.abs(arCount - enCount) > 200) { // arbitrary threshold for now
    errors.push(`WARNING: Significant key count discrepancy (AR: ${arCount}, EN: ${enCount})`);
}

if (errors.length > 0) {
    console.error("Verification Failed:");
    errors.forEach(e => console.error(e));
} else {
    console.log("Verification Passed!");
}
