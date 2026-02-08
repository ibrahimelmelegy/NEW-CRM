const fs = require('fs');
const path = require('path');

const arPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\ar.json');
const enPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\en.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Add Role Keys
if (!ar.role) ar.role = {};
if (!ar.role.form) ar.role.form = {};
ar.role.form.name = 'اسم الدور';
ar.role.form.enterName = 'أدخل اسم الدور';
ar.role.form.description = 'الوصف';
ar.role.form.enterDescription = 'أدخل الوصف';
ar.role.form.optional = '(اختياري)';
ar.role.form.descriptionHint = 'يجب أن تكون الملاحظات حرفين على الأقل';

if (!en.role) en.role = {};
if (!en.role.form) en.role.form = {};
en.role.form.name = 'Role Name';
en.role.form.enterName = 'Enter Role Name';
en.role.form.description = 'Description';
en.role.form.enterDescription = 'Enter Description';
en.role.form.optional = '(Optional)';
en.role.form.descriptionHint = 'Notes must be at least 2 characters';

fs.writeFileSync(arPath, JSON.stringify(ar, null, 4), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 4), 'utf8');

console.log('Role keys added to ar.json and en.json');
