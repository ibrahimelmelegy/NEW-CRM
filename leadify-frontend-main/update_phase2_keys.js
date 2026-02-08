const fs = require('fs');
const path = require('path');

const arPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\ar.json');
const enPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\en.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Helper to ensure nested objects exist
const ensurePath = (obj, pathStr) => {
  const parts = pathStr.split('.');
  let current = obj;
  for (const part of parts) {
    if (!current[part]) current[part] = {};
    current = current[part];
  }
};

// --- AUTHENTICATION (Forget/Reset Password) ---
ensurePath(ar, 'auth');
ensurePath(en, 'auth');

ar.auth.resetTitle = 'إعادة تعيين كلمة المرور';
en.auth.resetTitle = 'Reset Password';

ar.auth.forgetTitle = 'نسيت كلمة المرور؟';
en.auth.forgetTitle = 'Forgot Password?';

ar.auth.forgetSubtitle = 'أدخل بريدك الإلكتروني وسنرسل لك تعليمات لإعادة تعيين كلمة المرور.';
en.auth.forgetSubtitle = "Enter your email address and we'll send you instructions to reset your password.";

ar.auth.backToLogin = 'العودة لتسجيل الدخول';
en.auth.backToLogin = 'Back to Login';

ar.auth.sendResetLink = 'إرسال رابط إعادة التعيين';
en.auth.sendResetLink = 'Send Reset Link';

ar.auth.newPassword = 'كلمة المرور الجديدة';
en.auth.newPassword = 'New Password';

ar.auth.confirmPassword = 'تأكيد كلمة المرور';
en.auth.confirmPassword = 'Confirm Password';

ar.auth.resetSuccess = 'تم تغيير كلمة المرور بنجاح';
en.auth.resetSuccess = 'Password changed successfully';

// --- OPERATIONS (Vehicle) ---
ensurePath(ar, 'operations.vehicle.form');
ensurePath(en, 'operations.vehicle.form');

ar.operations.vehicle.form.name = 'اسم المركبة';
en.operations.vehicle.form.name = 'Vehicle Name';

ar.operations.vehicle.form.plateNumber = 'رقم اللوحة';
en.operations.vehicle.form.plateNumber = 'Plate Number';

ar.operations.vehicle.form.type = 'النوع';
en.operations.vehicle.form.type = 'Type';

ar.operations.vehicle.form.status = 'الحالة';
en.operations.vehicle.form.status = 'Status';

ar.operations.vehicle.form.enterName = 'أدخل اسم المركبة';
en.operations.vehicle.form.enterName = 'Enter Vehicle Name';

ar.operations.vehicle.form.enterPlate = 'أدخل رقم اللوحة';
en.operations.vehicle.form.enterPlate = 'Enter Plate Number';

// --- OPERATIONS (Service) ---
ensurePath(ar, 'operations.service.form');
ensurePath(en, 'operations.service.form');

ar.operations.service.form.name = 'اسم الخدمة';
en.operations.service.form.name = 'Service Name';

ar.operations.service.form.description = 'الوصف';
en.operations.service.form.description = 'Description';

ar.operations.service.form.cost = 'التكلفة';
en.operations.service.form.cost = 'Cost';

ar.operations.service.form.enterName = 'أدخل اسم الخدمة';
en.operations.service.form.enterName = 'Enter Service Name';

ar.operations.service.form.enterCost = 'أدخل التكلفة';
en.operations.service.form.enterCost = 'Enter Cost';

// --- PROCUREMENT (Purchase Orders List) ---
ensurePath(ar, 'procurement.purchaseOrders');
ensurePath(en, 'procurement.purchaseOrders');

ar.procurement.purchaseOrders.title = 'أوامر الشراء';
en.procurement.purchaseOrders.title = 'Purchase Orders';

ar.procurement.purchaseOrders.create = 'إنشاء جديد';
en.procurement.purchaseOrders.create = 'Create New';

ar.procurement.purchaseOrders.vendor = 'المورد';
en.procurement.purchaseOrders.vendor = 'Vendor';

ar.procurement.purchaseOrders.amount = 'المبلغ';
en.procurement.purchaseOrders.amount = 'Amount';

ar.procurement.purchaseOrders.date = 'التاريخ';
en.procurement.purchaseOrders.date = 'Date';

ar.procurement.purchaseOrders.status = 'الحالة';
en.procurement.purchaseOrders.status = 'Status';

fs.writeFileSync(arPath, JSON.stringify(ar, null, 4), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 4), 'utf8');

console.log('Phase 2 keys added to ar.json and en.json');
