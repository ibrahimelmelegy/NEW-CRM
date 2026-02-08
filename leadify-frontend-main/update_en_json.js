const fs = require('fs');
const path = require('path');

const enPath = path.resolve('e:\\NEW-CRM\\leadify-frontend-main\\locales\\en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// 1. Add missing keys
if (!en.common.finish) en.common.finish = 'Finish';
if (!en.common.summary) en.common.summary = 'Summary';
if (!en.common.sar) en.common.sar = 'SAR';
if (!en.common.days) en.common.days = 'Days';

if (!en.forms) en.forms = {};
en.forms.dragDrop = 'Drag and drop file here or';
en.forms.fileTypes = 'JPG, JPEG, PNG, PDF, DOCX, EXCEL, PPTX, TXT, CSV';
en.forms.maxFileSize = 'Maximum file size: {size}MB';
en.forms.optional = 'optional';

if (!en.opportunities.steps.negotiation) en.opportunities.steps.negotiation = 'Negotiation';
if (!en.operations.projects.form.shortCodePlaceholder) en.operations.projects.form.shortCodePlaceholder = 'Short Code';

// 3. Add new keys for pages (Login, Notifications, Procurement)
// Auth / Login
en.auth.experience = 'Experience';
en.auth.fastWorkflow = 'Fast Workflow';
en.auth.smartAnalytics = 'Smart Analytics';

// Notifications
if (!en.notifications) en.notifications = {};
en.notifications.title = 'Notifications';
en.notifications.markAllRead = 'Mark all as read';
en.notifications.markingUnread = 'Marking notification as unread';
en.notifications.show = 'Show';
en.notifications.entries = 'entries';
en.notifications.noData = 'No notifications yet.';

// Procurement
if (!en.procurement) en.procurement = {};
en.procurement.createTitle = 'Create Purchase Order';
en.procurement.subtitle = 'AI-Assisted Procurement Request';
en.procurement.supplierTerms = 'Supplier & Terms';
en.procurement.vendorSelection = 'Vendor Selection';
en.procurement.projectAllocation = 'Project Allocation';
en.procurement.paymentTerms = 'Payment Terms';
en.procurement.expectedDelivery = 'Expected Delivery';
en.procurement.referenceNote = 'Reference / Note';
en.procurement.orderItems = 'Order Items';
en.procurement.addProduct = 'Add Product';
en.procurement.itemDetails = 'Item Details';
en.procurement.quantity = 'Quantity';
en.procurement.unitPrice = 'Unit Price';
en.procurement.tax = 'Tax %';
en.procurement.total = 'Total';
en.procurement.subtotal = 'Subtotal';
en.procurement.taxAmount = 'Tax Amount';
en.procurement.grandTotal = 'Grand Total';
en.procurement.cancel = 'Cancel';
en.procurement.issuePO = 'Issue PO';
en.procurement.aiAutoFill = 'AI Auto-Fill';
en.procurement.aiDesc = 'Drag & drop a PDF invoice or quotation here. Leadify AI will extract line items, prices, and vendor details automatically.';
en.procurement.dropFile = 'Drop file or Browse';
en.procurement.supported = 'Supported: PDF, PNG, JPG';
en.procurement.instantProcess = 'Instant Process';

// Staff Form Keys (New)
en.staff.form = {
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone Number',
  role: 'Role',
  selectRole: 'Select Role',
  status: 'Status',
  password: 'Password',
  uploadImage: 'Upload Image',
  optional: '(Optional)',
  imageHint: 'JPG, JPEG, PNG, GIF (5 MB Maximum)'
};

// Daily Tasks Form Keys (New)
en.operations.dailyTasks.form = {
  name: 'Name',
  enterName: 'Enter Name',
  priority: 'Priority',
  status: 'Status',
  user: 'User',
  client: 'Client',
  salesRep: 'Sales Representative',
  cost: 'Cost',
  enterCost: 'Enter Cost SAR',
  downPayment: 'Down Payment',
  enterDownPayment: 'Enter Down Payment',
  totalPaid: 'Total Paid',
  enterTotalPaid: 'Enter Total Paid',
  notes: 'Notes'
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 4), 'utf8');
console.log('en.json updated successfully.');
