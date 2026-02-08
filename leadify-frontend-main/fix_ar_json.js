const fs = require('fs');
const path = require('path');

const arPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\ar.json');
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// 1. Move root 'form' to 'deals.form'
if (ar.form && !ar.deals.form) {
  console.log('Moving root "form" to "deals.form"...');
  ar.deals.form = ar.form;
  delete ar.form;
} else if (ar.form && ar.deals.form) {
  console.log('Merging root "form" into "deals.form"...');
  ar.deals.form = { ...ar.deals.form, ...ar.form };
  delete ar.form;
}

// 2. Add missing keys
if (!ar.common.finish) ar.common.finish = 'إنهاء';
if (!ar.common.summary) ar.common.summary = 'ملخص';
if (!ar.common.sar) ar.common.sar = 'ر.س';
if (!ar.common.days) ar.common.days = 'أيام';

if (!ar.forms) ar.forms = {};
ar.forms.dragDrop = 'اسحب وأفلت الملف هنا أو';
ar.forms.fileTypes = 'JPG, JPEG, PNG, PDF, DOCX, EXCEL, PPTX, TXT, CSV';
ar.forms.maxFileSize = 'الحد الأقصى لحجم الملف: {size} ميجابايت';
ar.forms.optional = 'اختياري';

if (!ar.opportunities.steps.negotiation) ar.opportunities.steps.negotiation = 'مفاوضة';
if (!ar.operations.projects.form.shortCodePlaceholder) ar.operations.projects.form.shortCodePlaceholder = 'الكود المختصر';

// 3. Add new keys for pages (Login, Notifications, Procurement)
// Auth / Login
ar.auth.experience = 'تجربة';
ar.auth.fastWorkflow = 'سير عمل سريع'; // Already exists but ensuring
ar.auth.smartAnalytics = 'تحليلات ذكية'; // Already exists

// Notifications
if (!ar.notifications) ar.notifications = {};
ar.notifications.title = 'الإشعارات';
ar.notifications.markAllRead = 'تحديد الكل كمقروء';
ar.notifications.markingUnread = 'تحديد كغير مقروء';
ar.notifications.show = 'عرض';
ar.notifications.entries = 'سجلات';
ar.notifications.noData = 'لا توجد إشعارات بعد';

// Procurement
if (!ar.procurement) ar.procurement = {};
ar.procurement.createTitle = 'إنشاء طلب شراء';
ar.procurement.subtitle = 'طلب مشتريات مدعوم بالذكاء الاصطناعي';
ar.procurement.supplierTerms = 'المورد والشروط';
ar.procurement.vendorSelection = 'اختيار المورد';
ar.procurement.projectAllocation = 'تخصيص المشروع';
ar.procurement.paymentTerms = 'شروط الدفع';
ar.procurement.expectedDelivery = 'التسليم المتوقع';
ar.procurement.referenceNote = 'مرجع / ملاحظة';
ar.procurement.orderItems = 'عناصر الطلب';
ar.procurement.addProduct = 'إضافة منتج';
ar.procurement.itemDetails = 'تفاصيل العنصر';
ar.procurement.quantity = 'الكمية';
ar.procurement.unitPrice = 'سعر الوحدة';
ar.procurement.tax = 'الضريبة %';
ar.procurement.total = 'المجموع';
ar.procurement.subtotal = 'المجموع الفرعي';
ar.procurement.taxAmount = 'قيمة الضريبة';
ar.procurement.grandTotal = 'المجموع الكلي';
ar.procurement.cancel = 'إلغاء';
ar.procurement.issuePO = 'إصدار طلب الشراء';
ar.procurement.aiAutoFill = 'تعبئة تلقائية بالذكاء الاصطناعي';
ar.procurement.aiDesc = 'اسحب وأفلت فاتورة PDF أو عرض سعر هنا. سيقوم النظام باستخراج العناصر والأسعار وتفاصيل المورد تلقائياً.';
ar.procurement.dropFile = 'افلت الملف أو تصفح';
ar.procurement.supported = 'مدعوم: PDF, PNG, JPG';
ar.procurement.instantProcess = 'معالجة فورية';

// Staff Form Keys (New)
ar.staff.form = {
  fullName: 'الاسم الكامل',
  email: 'البريد الإلكتروني',
  phone: 'رقم الهاتف',
  role: 'الدور',
  selectRole: 'اختر الدور',
  status: 'الحالة',
  password: 'كلمة المرور',
  uploadImage: 'تحميل صورة',
  optional: '(اختياري)',
  imageHint: 'JPG, JPEG, PNG, GIF (الحد الأقصى 5 ميجابايت)'
};

// Daily Tasks Form Keys (New)
ar.operations.dailyTasks.form = {
  name: 'الاسم',
  enterName: 'أدخل الاسم',
  priority: 'الأولوية',
  status: 'الحالة',
  user: 'المستخدم',
  client: 'العميل',
  salesRep: 'مندوب المبيعات',
  cost: 'التكلفة',
  enterCost: 'أدخل التكلفة ر.س',
  downPayment: 'الدفعة المقدمة',
  enterDownPayment: 'أدخل الدفعة المقدمة',
  totalPaid: 'إجمالي المدفوع',
  enterTotalPaid: 'أدخل إجمالي المدفوع',
  notes: 'ملاحظات'
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 4), 'utf8');
console.log('ar.json updated successfully.');
