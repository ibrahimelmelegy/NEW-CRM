
const fs = require('fs');
const path = require('path');

const enPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\en.json');
const arPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

function getKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

const enKeys = getKeys(en);
const arKeys = getKeys(ar);

const missingKeys = enKeys.filter(key => !arKeys.includes(key));

console.log('Missing keys in ar.json:');
missingKeys.forEach(key => console.log(key));
