const fs = require('fs');
const base = 'e:/NEW-CRM/leadify-frontend-main';

const en = JSON.parse(fs.readFileSync(`${base}/locales/en.json`, 'utf8'));
const ar = JSON.parse(fs.readFileSync(`${base}/locales/ar.json`, 'utf8'));

function addKey(section, key, enVal, arVal) {
  if (!en[section]) en[section] = {};
  if (!ar[section]) ar[section] = {};
  if (!en[section][key]) en[section][key] = enVal;
  if (!ar[section][key]) ar[section][key] = arVal;
}

let totalFixed = 0;

function fixFile(relPath, replacements) {
  const fp = `${base}/${relPath}`;
  let content = fs.readFileSync(fp, 'utf8');
  let count = 0;
  for (const [oldStr, newStr] of replacements) {
    if (content.includes(oldStr)) {
      content = content.split(oldStr).join(newStr); // replace all occurrences
      count++;
    }
  }
  if (count > 0) fs.writeFileSync(fp, content);
  console.log(`  ${relPath}: ${count}/${replacements.length}`);
  totalFixed += count;
  return count;
}

// ============================================================
// Common reusable labels - add keys once, reuse across files
// ============================================================

// Common statuses
addKey('common', 'all', 'All', '\u0627\u0644\u0643\u0644');
addKey('common', 'open', 'Open', '\u0645\u0641\u062a\u0648\u062d');
addKey('common', 'closed', 'Closed', '\u0645\u063a\u0644\u0642');
addKey('common', 'pending', 'Pending', '\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631');
addKey('common', 'confirmed', 'Confirmed', '\u0645\u0624\u0643\u062f');
addKey('common', 'cancelled', 'Cancelled', '\u0645\u0644\u063a\u0649');
addKey('common', 'completed', 'Completed', '\u0645\u0643\u062a\u0645\u0644');
addKey('common', 'draft', 'Draft', '\u0645\u0633\u0648\u062f\u0629');
addKey('common', 'archived', 'Archived', '\u0645\u0624\u0631\u0634\u0641');
addKey('common', 'approved', 'Approved', '\u0645\u0648\u0627\u0641\u0642 \u0639\u0644\u064a\u0647');
addKey('common', 'denied', 'Denied', '\u0645\u0631\u0641\u0648\u0636');
addKey('common', 'paused', 'Paused', '\u0645\u0648\u0642\u0648\u0641');
addKey('common', 'shipped', 'Shipped', '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646');
addKey('common', 'delivered', 'Delivered', '\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645');
addKey('common', 'returned', 'Returned', '\u0645\u0631\u062a\u062c\u0639');

// Priority
addKey('common', 'low', 'Low', '\u0645\u0646\u062e\u0641\u0636');
addKey('common', 'normal', 'Normal', '\u0639\u0627\u062f\u064a');
addKey('common', 'high', 'High', '\u0645\u0631\u062a\u0641\u0639');
addKey('common', 'medium', 'Medium', '\u0645\u062a\u0648\u0633\u0637');
addKey('common', 'urgent', 'Urgent', '\u0639\u0627\u062c\u0644');

// Common entity names
addKey('common', 'lead', 'Lead', '\u0639\u0645\u064a\u0644 \u0645\u062d\u062a\u0645\u0644');
addKey('common', 'deal', 'Deal', '\u0635\u0641\u0642\u0629');
addKey('common', 'client', 'Client', '\u0639\u0645\u064a\u0644');
addKey('common', 'opportunity', 'Opportunity', '\u0641\u0631\u0635\u0629');
addKey('common', 'ticket', 'Ticket', '\u062a\u0630\u0643\u0631\u0629');

// Currencies (technical abbreviations stay as-is, but add for labels)
addKey('common', 'currencySAR', 'SAR', 'SAR');
addKey('common', 'currencyUSD', 'USD', 'USD');
addKey('common', 'currencyEUR', 'EUR', 'EUR');
addKey('common', 'currencyGBP', 'GBP', 'GBP');

// Common filter operators
addKey('common', 'equals', 'Equals', '\u064a\u0633\u0627\u0648\u064a');
addKey('common', 'contains', 'Contains', '\u064a\u062d\u062a\u0648\u064a');
addKey('common', 'greaterThan', 'Greater than', '\u0623\u0643\u0628\u0631 \u0645\u0646');
addKey('common', 'lessThan', 'Less than', '\u0623\u0635\u063a\u0631 \u0645\u0646');
addKey('common', 'notEmpty', 'Not empty', '\u063a\u064a\u0631 \u0641\u0627\u0631\u063a');
addKey('common', 'isNull', 'Is Null', '\u0641\u0627\u0631\u063a');
addKey('common', 'isNotNull', 'Is Not Null', '\u063a\u064a\u0631 \u0641\u0627\u0631\u063a');

// Discount types
addKey('common', 'percentage', 'Percentage', '\u0646\u0633\u0628\u0629 \u0645\u0626\u0648\u064a\u0629');
addKey('common', 'fixedAmount', 'Fixed Amount', '\u0645\u0628\u0644\u063a \u062b\u0627\u0628\u062a');

// Sorting
addKey('common', 'ascending', 'Ascending', '\u062a\u0635\u0627\u0639\u062f\u064a');
addKey('common', 'descending', 'Descending', '\u062a\u0646\u0627\u0632\u0644\u064a');

// ============================================================
// Section-specific keys
// ============================================================

// Live Chat
addKey('liveChat', 'statusOpen', 'OPEN', '\u0645\u0641\u062a\u0648\u062d');
addKey('liveChat', 'statusActive', 'ACTIVE', '\u0646\u0634\u0637');
addKey('liveChat', 'statusWaiting', 'WAITING', '\u0628\u0627\u0646\u062a\u0638\u0627\u0631');
addKey('liveChat', 'statusResolved', 'RESOLVED', '\u062a\u0645 \u0627\u0644\u062d\u0644');
addKey('liveChat', 'statusClosed', 'CLOSED', '\u0645\u063a\u0644\u0642');
addKey('liveChat', 'channelWeb', 'Web', '\u0648\u064a\u0628');
addKey('liveChat', 'channelWhatsApp', 'WhatsApp', 'WhatsApp');
addKey('liveChat', 'channelFacebook', 'Facebook', 'Facebook');
addKey('liveChat', 'channelInstagram', 'Instagram', 'Instagram');
addKey('liveChat', 'channelSMS', 'SMS', 'SMS');

// Billing
addKey('billing', 'perUnit', 'Per-Unit', '\u0644\u0643\u0644 \u0648\u062d\u062f\u0629');
addKey('billing', 'tiered', 'Tiered', '\u0645\u062a\u062f\u0631\u062c');
addKey('billing', 'volume', 'Volume', '\u062d\u0633\u0628 \u0627\u0644\u062d\u062c\u0645');

// Booking
addKey('booking', 'noShow', 'No Show', '\u0644\u0645 \u064a\u062d\u0636\u0631');
addKey('booking', 'meeting', 'Meeting', '\u0627\u062c\u062a\u0645\u0627\u0639');
addKey('booking', 'call', 'Call', '\u0645\u0643\u0627\u0644\u0645\u0629');
addKey('booking', 'demo', 'Demo', '\u0639\u0631\u0636 \u062a\u0648\u0636\u064a\u062d\u064a');
addKey('booking', 'consultation', 'Consultation', '\u0627\u0633\u062a\u0634\u0627\u0631\u0629');
addKey('booking', 'followUp', 'Follow-up', '\u0645\u062a\u0627\u0628\u0639\u0629');

// Documents
addKey('documents', 'cash', 'Cash', '\u0646\u0642\u062f\u064a');
addKey('documents', 'credit', 'Credit', '\u0627\u0626\u062a\u0645\u0627\u0646');
addKey('documents', 'bankTransfer', 'Bank Transfer', '\u062a\u062d\u0648\u064a\u0644 \u0628\u0646\u0643\u064a');

// E-signatures
addKey('eSignatures', 'signed', 'Signed', '\u0645\u0648\u0642\u0639');
addKey('eSignatures', 'declined', 'Declined', '\u0645\u0631\u0641\u0648\u0636');
addKey('eSignatures', 'expired', 'Expired', '\u0645\u0646\u062a\u0647\u064a \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629');

// Automations
addKey('automations', 'owner', 'Owner', '\u0627\u0644\u0645\u0627\u0644\u0643');
addKey('automations', 'teamLead', 'Team Lead', '\u0642\u0627\u0626\u062f \u0627\u0644\u0641\u0631\u064a\u0642');
addKey('automations', 'salesManager', 'Sales Manager', '\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a');
addKey('automations', 'allTeam', 'All Team', '\u0643\u0644 \u0627\u0644\u0641\u0631\u064a\u0642');
addKey('automations', 'admin', 'Admin', '\u0645\u062f\u064a\u0631');

// Surveys
addKey('surveys', 'npsSurvey', 'NPS Survey', '\u0627\u0633\u062a\u0628\u064a\u0627\u0646 NPS');
addKey('surveys', 'csatSurvey', 'CSAT Survey', '\u0627\u0633\u062a\u0628\u064a\u0627\u0646 CSAT');
addKey('surveys', 'productFeedback', 'Product Feedback', '\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0645\u0646\u062a\u062c');
addKey('surveys', 'customSurvey', 'Custom Survey', '\u0627\u0633\u062a\u0628\u064a\u0627\u0646 \u0645\u062e\u0635\u0635');
addKey('surveys', 'allClients', 'All Clients', '\u062c\u0645\u064a\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621');
addKey('surveys', 'activeClients', 'Active Clients', '\u0639\u0645\u0644\u0627\u0621 \u0646\u0634\u0637\u0648\u0646');
addKey('surveys', 'churned', 'Churned', '\u0645\u062a\u062e\u0644\u0641\u0648\u0646');
addKey('surveys', 'customSegment', 'Custom Segment', '\u0634\u0631\u064a\u062d\u0629 \u0645\u062e\u0635\u0635\u0629');
addKey('surveys', 'customerSatisfaction', 'Customer Satisfaction', '\u0631\u0636\u0627 \u0627\u0644\u0639\u0645\u0644\u0627\u0621');
addKey('surveys', 'employee', 'Employee', '\u0627\u0644\u0645\u0648\u0638\u0641');
addKey('surveys', 'custom', 'Custom', '\u0645\u062e\u0635\u0635');
addKey('surveys', 'text', 'Text', '\u0646\u0635');
addKey('surveys', 'singleChoice', 'Single Choice', '\u0627\u062e\u062a\u064a\u0627\u0631 \u0648\u0627\u062d\u062f');
addKey('surveys', 'multipleChoice', 'Multiple Choice', '\u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u062a\u0639\u062f\u062f');
addKey('surveys', 'rating', 'Rating', '\u062a\u0642\u064a\u064a\u0645');
addKey('surveys', 'scale', 'Scale (1-10)', '\u0645\u0642\u064a\u0627\u0633 (1-10)');

// Catalog
addKey('catalog', 'electronics', 'Electronics', '\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u062a');
addKey('catalog', 'software', 'Software', '\u0628\u0631\u0645\u062c\u064a\u0627\u062a');
addKey('catalog', 'services', 'Services', '\u062e\u062f\u0645\u0627\u062a');
addKey('catalog', 'hardware', 'Hardware', '\u0623\u062c\u0647\u0632\u0629');
addKey('catalog', 'accessories', 'Accessories', '\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062a');

// Campaigns
addKey('campaigns', 'scheduled', 'Scheduled', '\u0645\u062c\u062f\u0648\u0644');
addKey('campaigns', 'sending', 'Sending', '\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0631\u0633\u0627\u0644');
addKey('campaigns', 'sent', 'Sent', '\u0645\u0631\u0633\u0644');
addKey('campaigns', 'filled', 'Filled', '\u0645\u0645\u0644\u0648\u0621');
addKey('campaigns', 'outlined', 'Outlined', '\u0645\u062d\u064a\u0637');
addKey('campaigns', 'rounded', 'Rounded', '\u0645\u0633\u062a\u062f\u064a\u0631');
addKey('campaigns', 'pill', 'Pill', '\u0643\u0628\u0633\u0648\u0644\u0629');
addKey('campaigns', 'recipientTimezone', "Recipient's Local Timezone", '\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0632\u0645\u0646\u064a\u0629 \u0644\u0644\u0645\u0633\u062a\u0644\u0645');

// Training
addKey('training', 'beginner', 'Beginner', '\u0645\u0628\u062a\u062f\u0626');
addKey('training', 'intermediate', 'Intermediate', '\u0645\u062a\u0648\u0633\u0637');
addKey('training', 'advanced', 'Advanced', '\u0645\u062a\u0642\u062f\u0645');
addKey('training', 'online', 'Online', '\u0639\u0628\u0631 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a');
addKey('training', 'classroom', 'Classroom', '\u0641\u064a \u0627\u0644\u0641\u0635\u0644');
addKey('training', 'workshop', 'Workshop', '\u0648\u0631\u0634\u0629 \u0639\u0645\u0644');
addKey('training', 'certification', 'Certification', '\u0634\u0647\u0627\u062f\u0629');
addKey('training', 'onTheJob', 'On the Job', '\u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0639\u0645\u0644');
addKey('training', 'pdf', 'PDF', 'PDF');
addKey('training', 'video', 'Video', '\u0641\u064a\u062f\u064a\u0648');
addKey('training', 'slides', 'Slides', '\u0634\u0631\u0627\u0626\u062d');
addKey('training', 'document', 'Document', '\u0645\u0633\u062a\u0646\u062f');
addKey('training', 'link', 'Link', '\u0631\u0627\u0628\u0637');

// Social CRM
addKey('socialCrm', 'positive', 'Positive', '\u0625\u064a\u062c\u0627\u0628\u064a');
addKey('socialCrm', 'neutral', 'Neutral', '\u0645\u062d\u0627\u064a\u062f');
addKey('socialCrm', 'negative', 'Negative', '\u0633\u0644\u0628\u064a');

// Sequences
addKey('sequences', 'email', 'Email', '\u0628\u0631\u064a\u062f \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a');
addKey('sequences', 'wait', 'Wait', '\u0627\u0646\u062a\u0638\u0627\u0631');
addKey('sequences', 'task', 'Task', '\u0645\u0647\u0645\u0629');

// Warranty
addKey('warranty', 'filed', 'Filed', '\u0645\u0642\u062f\u0645');
addKey('warranty', 'underReview', 'Under Review', '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629');
addKey('warranty', 'fulfilled', 'Fulfilled', '\u0645\u0646\u0641\u0630');
addKey('warranty', 'typeWarranty', 'Warranty', '\u0636\u0645\u0627\u0646');
addKey('warranty', 'typeMaintenance', 'Maintenance', '\u0635\u064a\u0627\u0646\u0629');
addKey('warranty', 'typeSupportPlan', 'Support Plan', '\u062e\u0637\u0629 \u062f\u0639\u0645');
addKey('warranty', 'typeAMC', 'AMC', 'AMC');

// ABM
addKey('abm', 'channelEmail', 'Email', '\u0628\u0631\u064a\u062f \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a');
addKey('abm', 'channelAds', 'Ads', '\u0625\u0639\u0644\u0627\u0646\u0627\u062a');
addKey('abm', 'channelSocial', 'Social', '\u0627\u062c\u062a\u0645\u0627\u0639\u064a');
addKey('abm', 'channelEvents', 'Events', '\u0641\u0639\u0627\u0644\u064a\u0627\u062a');

// Loyalty
addKey('loyalty', 'ended', 'Ended', '\u0645\u0646\u062a\u0647\u064a');
addKey('loyalty', 'allTiers', 'All Tiers', '\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0633\u062a\u0648\u064a\u0627\u062a');
addKey('loyalty', 'bronze', 'Bronze', '\u0628\u0631\u0648\u0646\u0632\u064a');
addKey('loyalty', 'silver', 'Silver', '\u0641\u0636\u064a');
addKey('loyalty', 'gold', 'Gold', '\u0630\u0647\u0628\u064a');
addKey('loyalty', 'platinum', 'Platinum', '\u0628\u0644\u0627\u062a\u064a\u0646\u064a');
addKey('loyalty', 'earn', 'Earn', '\u0643\u0633\u0628');
addKey('loyalty', 'redeem', 'Redeem', '\u0627\u0633\u062a\u0628\u062f\u0627\u0644');
addKey('loyalty', 'adjust', 'Adjust', '\u062a\u0639\u062f\u064a\u0644');

// Recruitment
addKey('recruitment', 'linkedin', 'LinkedIn', 'LinkedIn');
addKey('recruitment', 'indeed', 'Indeed', 'Indeed');
addKey('recruitment', 'referral', 'Referral', '\u0625\u062d\u0627\u0644\u0629');
addKey('recruitment', 'website', 'Website', '\u0645\u0648\u0642\u0639 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a');
addKey('recruitment', 'jobBoard', 'Job Board', '\u0644\u0648\u062d\u0629 \u0627\u0644\u0648\u0638\u0627\u0626\u0641');
addKey('recruitment', 'other', 'Other', '\u0623\u062e\u0631\u0649');
addKey('recruitment', 'allStages', 'All Stages', '\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0631\u0627\u062d\u0644');
addKey('recruitment', 'allJobs', 'All Jobs', '\u062c\u0645\u064a\u0639 \u0627\u0644\u0648\u0638\u0627\u0626\u0641');
addKey('recruitment', 'fullTime', 'Full-time', '\u062f\u0648\u0627\u0645 \u0643\u0627\u0645\u0644');
addKey('recruitment', 'partTime', 'Part-time', '\u062f\u0648\u0627\u0645 \u062c\u0632\u0626\u064a');
addKey('recruitment', 'contract', 'Contract', '\u0639\u0642\u062f');
addKey('recruitment', 'internship', 'Internship', '\u062a\u062f\u0631\u064a\u0628');

// Form Builder
addKey('formBuilder', 'active', 'Active', '\u0646\u0634\u0637');
addKey('formBuilder', 'inactive', 'Inactive', '\u063a\u064a\u0631 \u0646\u0634\u0637');

// Performance Reviews
addKey('performance', 'quarterly', 'Quarterly', '\u0631\u0628\u0639 \u0633\u0646\u0648\u064a');
addKey('performance', 'annual', 'Annual', '\u0633\u0646\u0648\u064a');
addKey('performance', 'probation', 'Probation', '\u0641\u062a\u0631\u0629 \u062a\u062c\u0631\u064a\u0628\u064a\u0629');
addKey('performance', 'projectBased', 'Project-Based', '\u0642\u0627\u0626\u0645 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u0631\u0648\u0639');
addKey('performance', 'allStatuses', 'All Statuses', '\u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0627\u0644\u0627\u062a');

// Warehouse
addKey('warehouse', 'maintenance', 'Maintenance', '\u0635\u064a\u0627\u0646\u0629');
addKey('warehouse', 'storage', 'Storage', '\u062a\u062e\u0632\u064a\u0646');
addKey('warehouse', 'picking', 'Picking', '\u0627\u0644\u062a\u0642\u0627\u0637');
addKey('warehouse', 'receiving', 'Receiving', '\u0627\u0633\u062a\u0644\u0627\u0645');
addKey('warehouse', 'shippingZone', 'Shipping', '\u0634\u062d\u0646');
addKey('warehouse', 'quarantine', 'Quarantine', '\u062d\u062c\u0631 \u0635\u062d\u064a');

// Shipping
addKey('shipping', 'domestic', 'Domestic', '\u0645\u062d\u0644\u064a');
addKey('shipping', 'international', 'International', '\u062f\u0648\u0644\u064a');
addKey('shipping', 'express', 'Express', '\u0633\u0631\u064a\u0639');
addKey('shipping', 'economy', 'Economy', '\u0627\u0642\u062a\u0635\u0627\u062f\u064a');
addKey('shipping', 'preparing', 'Preparing', '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062c\u0647\u064a\u0632');
addKey('shipping', 'inTransit', 'In Transit', '\u0641\u064a \u0627\u0644\u0637\u0631\u064a\u0642');

// WhatsApp messaging
addKey('whatsapp', 'english', 'English', '\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629');
addKey('whatsapp', 'arabic', 'Arabic', '\u0627\u0644\u0639\u0631\u0628\u064a\u0629');
addKey('whatsapp', 'none', 'None', '\u0644\u0627 \u0634\u064a\u0621');
addKey('whatsapp', 'text', 'Text', '\u0646\u0635');
addKey('whatsapp', 'image', 'Image', '\u0635\u0648\u0631\u0629');
addKey('whatsapp', 'document', 'Document', '\u0645\u0633\u062a\u0646\u062f');
addKey('whatsapp', 'audio', 'Audio', '\u0635\u0648\u062a');
addKey('whatsapp', 'video', 'Video', '\u0641\u064a\u062f\u064a\u0648');

// AI Lead Scoring
addKey('aiLeadScoring', 'gradientBoost', 'Gradient Boost', 'Gradient Boost');
addKey('aiLeadScoring', 'neuralNetwork', 'Neural Network', 'Neural Network');
addKey('aiLeadScoring', 'bayesian', 'Bayesian', 'Bayesian');
addKey('aiLeadScoring', 'logisticRegression', 'Logistic Regression', 'Logistic Regression');
addKey('aiLeadScoring', 'randomForest', 'Random Forest', 'Random Forest');

// SLA
addKey('sla', 'lead', 'Lead', '\u0639\u0645\u064a\u0644 \u0645\u062d\u062a\u0645\u0644');
addKey('sla', 'deal', 'Deal', '\u0635\u0641\u0642\u0629');
addKey('sla', 'client', 'Client', '\u0639\u0645\u064a\u0644');
addKey('sla', 'ticket', 'Ticket', '\u062a\u0630\u0643\u0631\u0629');
addKey('sla', 'opportunity', 'Opportunity', '\u0641\u0631\u0635\u0629');

// Quality Control
addKey('qualityControl', 'manufacturing', 'Manufacturing', '\u062a\u0635\u0646\u064a\u0639');
addKey('qualityControl', 'packaging', 'Packaging', '\u062a\u063a\u0644\u064a\u0641');
addKey('qualityControl', 'safety', 'Safety', '\u0633\u0644\u0627\u0645\u0629');
addKey('qualityControl', 'compliance', 'Compliance', '\u0627\u0645\u062a\u062b\u0627\u0644');
addKey('qualityControl', 'environmental', 'Environmental', '\u0628\u064a\u0626\u064a');
addKey('qualityControl', 'passFail', 'Pass/Fail', '\u0646\u062c\u0627\u062d/\u0631\u0633\u0648\u0628');
addKey('qualityControl', 'passFailNa', 'Pass/Fail/NA', '\u0646\u062c\u0627\u062d/\u0631\u0633\u0648\u0628/\u063a\u064a\u0631 \u0645\u0637\u0628\u0642');
addKey('qualityControl', 'numeric', 'Numeric', '\u0631\u0642\u0645\u064a');

// Lead Scoring
addKey('leadScoring', 'lead', 'Lead', '\u0639\u0645\u064a\u0644 \u0645\u062d\u062a\u0645\u0644');
addKey('leadScoring', 'deal', 'Deal', '\u0635\u0641\u0642\u0629');
addKey('leadScoring', 'client', 'Client', '\u0639\u0645\u064a\u0644');
addKey('leadScoring', 'opportunity', 'Opportunity', '\u0641\u0631\u0635\u0629');

// Resource Planner
addKey('resourcePlanner', 'standard', 'Standard', '\u0642\u064a\u0627\u0633\u064a');
addKey('resourcePlanner', 'helper', 'Helper', '\u0645\u0633\u0627\u0639\u062f');
addKey('resourcePlanner', 'siteEngineer', 'SiteEngineer', '\u0645\u0647\u0646\u062f\u0633 \u0645\u0648\u0642\u0639');
addKey('resourcePlanner', 'engineer', 'Engineer', '\u0645\u0647\u0646\u062f\u0633');

// Email Templates
addKey('emailTemplates', 'sales', 'Sales', '\u0645\u0628\u064a\u0639\u0627\u062a');
addKey('emailTemplates', 'followUp', 'Follow-up', '\u0645\u062a\u0627\u0628\u0639\u0629');
addKey('emailTemplates', 'onboarding', 'Onboarding', '\u062a\u0647\u064a\u0626\u0629');
addKey('emailTemplates', 'invoice', 'Invoice', '\u0641\u0627\u062a\u0648\u0631\u0629');
addKey('emailTemplates', 'support', 'Support', '\u062f\u0639\u0645');
addKey('emailTemplates', 'marketing', 'Marketing', '\u062a\u0633\u0648\u064a\u0642');
addKey('emailTemplates', 'general', 'General', '\u0639\u0627\u0645');

// Email Accounts
addKey('emailAccounts', 'gmail', 'Gmail', 'Gmail');
addKey('emailAccounts', 'outlook', 'Outlook', 'Outlook');
addKey('emailAccounts', 'imap', 'IMAP', 'IMAP');
addKey('emailAccounts', 'smtp', 'SMTP', 'SMTP');

// Duplicates
addKey('duplicates', 'lead', 'Lead', '\u0639\u0645\u064a\u0644 \u0645\u062d\u062a\u0645\u0644');
addKey('duplicates', 'client', 'Client', '\u0639\u0645\u064a\u0644');
addKey('duplicates', 'deal', 'Deal', '\u0635\u0641\u0642\u0629');

// Document Templates
addKey('documentTemplates', 'a4', 'A4', 'A4');
addKey('documentTemplates', 'letter', 'Letter', '\u062e\u0637\u0627\u0628');
addKey('documentTemplates', 'legal', 'Legal', '\u0642\u0627\u0646\u0648\u0646\u064a');

// AB Testing
addKey('abTesting', 'q1Newsletter', 'Q1 Newsletter', '\u0646\u0634\u0631\u0629 \u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u0623\u0648\u0644');
addKey('abTesting', 'productLaunch', 'Product Launch', '\u0625\u0637\u0644\u0627\u0642 \u0645\u0646\u062a\u062c');
addKey('abTesting', 'reEngagement', 'Re-engagement Series', '\u0633\u0644\u0633\u0644\u0629 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0641\u0627\u0639\u0644');

// Data Import
addKey('dataImport', 'skipDuplicates', 'Skip duplicates', '\u062a\u062e\u0637\u064a \u0627\u0644\u0645\u0643\u0631\u0631\u0627\u062a');
addKey('dataImport', 'updateExisting', 'Update existing records', '\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u0648\u062c\u0648\u062f\u0629');
addKey('dataImport', 'createNew', 'Create new records', '\u0625\u0646\u0634\u0627\u0621 \u0633\u062c\u0644\u0627\u062a \u062c\u062f\u064a\u062f\u0629');
addKey('dataImport', 'strict', 'Strict - Skip invalid rows', '\u0635\u0627\u0631\u0645 - \u062a\u062e\u0637\u064a \u0627\u0644\u0635\u0641\u0648\u0641 \u063a\u064a\u0631 \u0627\u0644\u0635\u0627\u0644\u062d\u0629');
addKey('dataImport', 'lenient', 'Lenient - Import all rows', '\u0645\u062a\u0633\u0627\u0647\u0644 - \u0627\u0633\u062a\u064a\u0631\u0627\u062f \u062c\u0645\u064a\u0639 \u0627\u0644\u0635\u0641\u0648\u0641');

// Performance reviews quarters (these are date-specific, use the section)
addKey('performance', 'q1_2026', 'Q1 2026', '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u0623\u0648\u0644 2026');
addKey('performance', 'q2_2026', 'Q2 2026', '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u062b\u0627\u0646\u064a 2026');
addKey('performance', 'q3_2026', 'Q3 2026', '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u062b\u0627\u0644\u062b 2026');
addKey('performance', 'q4_2026', 'Q4 2026', '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u0631\u0627\u0628\u0639 2026');
addKey('performance', 'q4_2025', 'Q4 2025', '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u0631\u0627\u0628\u0639 2025');
addKey('performance', 'q3_2025', 'Q3 2025', '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u062b\u0627\u0644\u062b 2025');
addKey('performance', 'annual_2025', 'Annual 2025', '\u0633\u0646\u0648\u064a 2025');
addKey('performance', 'annual_2026', 'Annual 2026', '\u0633\u0646\u0648\u064a 2026');

// ============================================================
// File replacements
// ============================================================

// 1. communications/live-chat.vue (Pug)
fixFile('pages/communications/live-chat.vue', [
  ['el-option(label="OPEN" value="OPEN")', "el-option(:label=\"$t('liveChat.statusOpen')\" value=\"OPEN\")"],
  ['el-option(label="ACTIVE" value="ACTIVE")', "el-option(:label=\"$t('liveChat.statusActive')\" value=\"ACTIVE\")"],
  ['el-option(label="WAITING" value="WAITING")', "el-option(:label=\"$t('liveChat.statusWaiting')\" value=\"WAITING\")"],
  ['el-option(label="RESOLVED" value="RESOLVED")', "el-option(:label=\"$t('liveChat.statusResolved')\" value=\"RESOLVED\")"],
  ['el-option(label="CLOSED" value="CLOSED")', "el-option(:label=\"$t('liveChat.statusClosed')\" value=\"CLOSED\")"],
  ['el-option(label="Web" value="WEB")', "el-option(:label=\"$t('liveChat.channelWeb')\" value=\"WEB\")"],
  ['el-option(label="WhatsApp" value="WHATSAPP")', "el-option(:label=\"$t('liveChat.channelWhatsApp')\" value=\"WHATSAPP\")"],
  ['el-option(label="Facebook" value="FACEBOOK")', "el-option(:label=\"$t('liveChat.channelFacebook')\" value=\"FACEBOOK\")"],
  ['el-option(label="Instagram" value="INSTAGRAM")', "el-option(:label=\"$t('liveChat.channelInstagram')\" value=\"INSTAGRAM\")"],
  ['el-option(label="SMS" value="SMS")', "el-option(:label=\"$t('liveChat.channelSMS')\" value=\"SMS\")"],
  ['el-option(label="Low" value="LOW")', "el-option(:label=\"$t('common.low')\" value=\"LOW\")"],
  ['el-option(label="Normal" value="NORMAL")', "el-option(:label=\"$t('common.normal')\" value=\"NORMAL\")"],
  ['el-option(label="High" value="HIGH")', "el-option(:label=\"$t('common.high')\" value=\"HIGH\")"],
  ['el-option(label="Urgent" value="URGENT")', "el-option(:label=\"$t('common.urgent')\" value=\"URGENT\")"],
]);

// 2. finance/usage-billing.vue (Pug)
fixFile('pages/finance/usage-billing.vue', [
  ['el-option(label="Per-Unit" value="Per-Unit")', "el-option(:label=\"$t('billing.perUnit')\" value=\"Per-Unit\")"],
  ['el-option(label="Tiered" value="Tiered")', "el-option(:label=\"$t('billing.tiered')\" value=\"Tiered\")"],
  ['el-option(label="Volume" value="Volume")', "el-option(:label=\"$t('billing.volume')\" value=\"Volume\")"],
]);

// 3. communications/booking.vue (Pug)
fixFile('pages/communications/booking.vue', [
  ['el-option(label="All" value="")', "el-option(:label=\"$t('common.all')\" value=\"\")"],
  ['el-option(label="Pending" value="PENDING")', "el-option(:label=\"$t('common.pending')\" value=\"PENDING\")"],
  ['el-option(label="Confirmed" value="CONFIRMED")', "el-option(:label=\"$t('common.confirmed')\" value=\"CONFIRMED\")"],
  ['el-option(label="Cancelled" value="CANCELLED")', "el-option(:label=\"$t('common.cancelled')\" value=\"CANCELLED\")"],
  ['el-option(label="Completed" value="COMPLETED")', "el-option(:label=\"$t('common.completed')\" value=\"COMPLETED\")"],
  ['el-option(label="No Show" value="NO_SHOW")', "el-option(:label=\"$t('booking.noShow')\" value=\"NO_SHOW\")"],
  ['el-option(label="Meeting" value="MEETING")', "el-option(:label=\"$t('booking.meeting')\" value=\"MEETING\")"],
  ['el-option(label="Call" value="CALL")', "el-option(:label=\"$t('booking.call')\" value=\"CALL\")"],
  ['el-option(label="Demo" value="DEMO")', "el-option(:label=\"$t('booking.demo')\" value=\"DEMO\")"],
  ['el-option(label="Consultation" value="CONSULTATION")', "el-option(:label=\"$t('booking.consultation')\" value=\"CONSULTATION\")"],
  ['el-option(label="Follow-up" value="FOLLOW_UP")', "el-option(:label=\"$t('booking.followUp')\" value=\"FOLLOW_UP\")"],
]);

// 4. documents/editor.vue (Pug)
fixFile('pages/documents/editor.vue', [
  ['el-option(label="Cash" value="Cash")', "el-option(:label=\"$t('documents.cash')\" value=\"Cash\")"],
  ['el-option(label="Credit" value="Credit")', "el-option(:label=\"$t('documents.credit')\" value=\"Credit\")"],
  ['el-option(label="Bank Transfer" value="Bank Transfer")', "el-option(:label=\"$t('documents.bankTransfer')\" value=\"Bank Transfer\")"],
  ['el-option(label="SAR" value="SAR")', "el-option(:label=\"$t('common.currencySAR')\" value=\"SAR\")"],
  ['el-option(label="USD" value="USD")', "el-option(:label=\"$t('common.currencyUSD')\" value=\"USD\")"],
  ['el-option(label="EUR" value="EUR")', "el-option(:label=\"$t('common.currencyEUR')\" value=\"EUR\")"],
  ['el-option(label="GBP" value="GBP")', "el-option(:label=\"$t('common.currencyGBP')\" value=\"GBP\")"],
]);

// 5. automations/templates.vue (Pug)
fixFile('pages/automations/templates.vue', [
  ['el-option(label="Owner" value="owner")', "el-option(:label=\"$t('automations.owner')\" value=\"owner\")"],
  ['el-option(label="Team Lead" value="team_lead")', "el-option(:label=\"$t('automations.teamLead')\" value=\"team_lead\")"],
  ['el-option(label="Sales Manager" value="sales_manager")', "el-option(:label=\"$t('automations.salesManager')\" value=\"sales_manager\")"],
  ['el-option(label="All Team" value="all_team")', "el-option(:label=\"$t('automations.allTeam')\" value=\"all_team\")"],
  ['el-option(label="Admin" value="admin")', "el-option(:label=\"$t('automations.admin')\" value=\"admin\")"],
]);

// 6. documents/e-signatures.vue (HTML)
fixFile('pages/documents/e-signatures.vue', [
  ['<el-option label="All" value="" />', "<el-option :label=\"$t('common.all')\" value=\"\" />"],
  ['<el-option label="Pending" value="PENDING" />', "<el-option :label=\"$t('common.pending')\" value=\"PENDING\" />"],
  ['<el-option label="Signed" value="SIGNED" />', "<el-option :label=\"$t('eSignatures.signed')\" value=\"SIGNED\" />"],
  ['<el-option label="Declined" value="DECLINED" />', "<el-option :label=\"$t('eSignatures.declined')\" value=\"DECLINED\" />"],
  ['<el-option label="Expired" value="EXPIRED" />', "<el-option :label=\"$t('eSignatures.expired')\" value=\"EXPIRED\" />"],
]);

// 7. marketing/surveys.vue (HTML)
fixFile('pages/marketing/surveys.vue', [
  ['<el-option label="NPS Survey" value="NPS" />', "<el-option :label=\"$t('surveys.npsSurvey')\" value=\"NPS\" />"],
  ['<el-option label="CSAT Survey" value="CSAT" />', "<el-option :label=\"$t('surveys.csatSurvey')\" value=\"CSAT\" />"],
  ['<el-option label="Product Feedback" value="PRODUCT" />', "<el-option :label=\"$t('surveys.productFeedback')\" value=\"PRODUCT\" />"],
  ['<el-option label="Custom Survey" value="CUSTOM" />', "<el-option :label=\"$t('surveys.customSurvey')\" value=\"CUSTOM\" />"],
  ['<el-option label="All Clients" value="ALL_CLIENTS" />', "<el-option :label=\"$t('surveys.allClients')\" value=\"ALL_CLIENTS\" />"],
  ['<el-option label="Active Clients" value="ACTIVE" />', "<el-option :label=\"$t('surveys.activeClients')\" value=\"ACTIVE\" />"],
  ['<el-option label="Churned" value="CHURNED" />', "<el-option :label=\"$t('surveys.churned')\" value=\"CHURNED\" />"],
  ['<el-option label="Custom Segment" value="CUSTOM" />', "<el-option :label=\"$t('surveys.customSegment')\" value=\"CUSTOM\" />"],
]);

// 8. catalog/index.vue (Pug)
fixFile('pages/catalog/index.vue', [
  ['el-option(label="Electronics" value="Electronics")', "el-option(:label=\"$t('catalog.electronics')\" value=\"Electronics\")"],
  ['el-option(label="Software" value="Software")', "el-option(:label=\"$t('catalog.software')\" value=\"Software\")"],
  ['el-option(label="Services" value="Services")', "el-option(:label=\"$t('catalog.services')\" value=\"Services\")"],
  ['el-option(label="Hardware" value="Hardware")', "el-option(:label=\"$t('catalog.hardware')\" value=\"Hardware\")"],
  ['el-option(label="Accessories" value="Accessories")', "el-option(:label=\"$t('catalog.accessories')\" value=\"Accessories\")"],
]);

// 9. marketing/surveys/[id].vue (Pug)
fixFile('pages/marketing/surveys/[id].vue', [
  ['el-option(label="Draft" value="DRAFT")', "el-option(:label=\"$t('common.draft')\" value=\"DRAFT\")"],
  ['el-option(label="Active" value="ACTIVE")', "el-option(:label=\"$t('common.active')\" value=\"ACTIVE\")"],
  ['el-option(label="Closed" value="CLOSED")', "el-option(:label=\"$t('common.closed')\" value=\"CLOSED\")"],
  ['el-option(label="Archived" value="ARCHIVED")', "el-option(:label=\"$t('common.archived')\" value=\"ARCHIVED\")"],
  ['el-option(label="Customer Satisfaction" value="CUSTOMER_SATISFACTION")', "el-option(:label=\"$t('surveys.customerSatisfaction')\" value=\"CUSTOMER_SATISFACTION\")"],
  ['el-option(label="Employee" value="EMPLOYEE")', "el-option(:label=\"$t('surveys.employee')\" value=\"EMPLOYEE\")"],
  ['el-option(label="NPS" value="NPS")', "el-option(:label=\"'NPS'\" value=\"NPS\")"],
  ['el-option(label="Product Feedback" value="PRODUCT_FEEDBACK")', "el-option(:label=\"$t('surveys.productFeedback')\" value=\"PRODUCT_FEEDBACK\")"],
  ['el-option(label="Custom" value="CUSTOM")', "el-option(:label=\"$t('surveys.custom')\" value=\"CUSTOM\")"],
]);

// 10. marketing/surveys/index.vue (Pug)
fixFile('pages/marketing/surveys/index.vue', [
  ['el-option(label="Text" value="TEXT")', "el-option(:label=\"$t('surveys.text')\" value=\"TEXT\")"],
  ['el-option(label="Single Choice" value="SINGLE_CHOICE")', "el-option(:label=\"$t('surveys.singleChoice')\" value=\"SINGLE_CHOICE\")"],
  ['el-option(label="Multiple Choice" value="MULTIPLE_CHOICE")', "el-option(:label=\"$t('surveys.multipleChoice')\" value=\"MULTIPLE_CHOICE\")"],
  ['el-option(label="Rating" value="RATING")', "el-option(:label=\"$t('surveys.rating')\" value=\"RATING\")"],
  ['el-option(label="Scale (1-10)" value="SCALE")', "el-option(:label=\"$t('surveys.scale')\" value=\"SCALE\")"],
]);

// 11. e-commerce/products/[slug].vue (Pug)
fixFile('pages/e-commerce/products/[slug].vue', [
  ['el-option(label="SAR" value="SAR")', "el-option(:label=\"$t('common.currencySAR')\" value=\"SAR\")"],
  ['el-option(label="USD" value="USD")', "el-option(:label=\"$t('common.currencyUSD')\" value=\"USD\")"],
  ['el-option(label="EUR" value="EUR")', "el-option(:label=\"$t('common.currencyEUR')\" value=\"EUR\")"],
  ['el-option(label="GBP" value="GBP")', "el-option(:label=\"$t('common.currencyGBP')\" value=\"GBP\")"],
  ['el-option(label="Percentage" value="percentage")', "el-option(:label=\"$t('common.percentage')\" value=\"percentage\")"],
  ['el-option(label="Fixed Amount" value="fixed")', "el-option(:label=\"$t('common.fixedAmount')\" value=\"fixed\")"],
]);

// 12. marketing/ab-testing.vue (HTML)
fixFile('pages/marketing/ab-testing.vue', [
  ['<el-option label="Q1 Newsletter" value="1" />', "<el-option :label=\"$t('abTesting.q1Newsletter')\" value=\"1\" />"],
  ['<el-option label="Product Launch" value="2" />', "<el-option :label=\"$t('abTesting.productLaunch')\" value=\"2\" />"],
  ['<el-option label="Re-engagement Series" value="3" />', "<el-option :label=\"$t('abTesting.reEngagement')\" value=\"3\" />"],
]);

// 13. marketing/campaigns/index.vue (Pug)
fixFile('pages/marketing/campaigns/index.vue', [
  ['el-option(label="Draft" value="DRAFT")', "el-option(:label=\"$t('common.draft')\" value=\"DRAFT\")"],
  ['el-option(label="Scheduled" value="SCHEDULED")', "el-option(:label=\"$t('campaigns.scheduled')\" value=\"SCHEDULED\")"],
  ['el-option(label="Sending" value="SENDING")', "el-option(:label=\"$t('campaigns.sending')\" value=\"SENDING\")"],
  ['el-option(label="Sent" value="SENT")', "el-option(:label=\"$t('campaigns.sent')\" value=\"SENT\")"],
  ['el-option(label="Cancelled" value="CANCELLED")', "el-option(:label=\"$t('common.cancelled')\" value=\"CANCELLED\")"],
]);

// 14. hr/training.vue (HTML)
fixFile('pages/hr/training.vue', [
  ['<el-option label="Beginner" value="Beginner" />', "<el-option :label=\"$t('training.beginner')\" value=\"Beginner\" />"],
  ['<el-option label="Intermediate" value="Intermediate" />', "<el-option :label=\"$t('training.intermediate')\" value=\"Intermediate\" />"],
  ['<el-option label="Advanced" value="Advanced" />', "<el-option :label=\"$t('training.advanced')\" value=\"Advanced\" />"],
]);

// 15. marketing/social-crm/index.vue (Pug)
fixFile('pages/marketing/social-crm/index.vue', [
  ['el-option(label="Positive" value="POSITIVE")', "el-option(:label=\"$t('socialCrm.positive')\" value=\"POSITIVE\")"],
  ['el-option(label="Neutral" value="NEUTRAL")', "el-option(:label=\"$t('socialCrm.neutral')\" value=\"NEUTRAL\")"],
  ['el-option(label="Negative" value="NEGATIVE")', "el-option(:label=\"$t('socialCrm.negative')\" value=\"NEGATIVE\")"],
]);

// 16. e-commerce/products/index.vue (Pug)
fixFile('pages/e-commerce/products/index.vue', [
  ['el-option(label="SAR" value="SAR")', "el-option(:label=\"$t('common.currencySAR')\" value=\"SAR\")"],
  ['el-option(label="USD" value="USD")', "el-option(:label=\"$t('common.currencyUSD')\" value=\"USD\")"],
  ['el-option(label="EUR" value="EUR")', "el-option(:label=\"$t('common.currencyEUR')\" value=\"EUR\")"],
  ['el-option(label="GBP" value="GBP")', "el-option(:label=\"$t('common.currencyGBP')\" value=\"GBP\")"],
]);

// 17. kanban/index.vue (Pug) - Low/Medium/High appear twice
fixFile('pages/kanban/index.vue', [
  ['el-option(label="Low" value="low")', "el-option(:label=\"$t('common.low')\" value=\"low\")"],
  ['el-option(label="Medium" value="medium")', "el-option(:label=\"$t('common.medium')\" value=\"medium\")"],
  ['el-option(label="High" value="high")', "el-option(:label=\"$t('common.high')\" value=\"high\")"],
]);

// 18. marketing/campaigns/builder.vue (Pug)
fixFile('pages/marketing/campaigns/builder.vue', [
  ['el-option(label="Filled" value="filled")', "el-option(:label=\"$t('campaigns.filled')\" value=\"filled\")"],
  ['el-option(label="Outlined" value="outlined")', "el-option(:label=\"$t('campaigns.outlined')\" value=\"outlined\")"],
  ['el-option(label="Rounded" value="rounded")', "el-option(:label=\"$t('campaigns.rounded')\" value=\"rounded\")"],
  ['el-option(label="Pill" value="pill")', "el-option(:label=\"$t('campaigns.pill')\" value=\"pill\")"],
  ['el-option(label="Recipient\'s Local Timezone" value="recipient_local")', "el-option(:label=\"$t('campaigns.recipientTimezone')\" value=\"recipient_local\")"],
]);

// 19. marketing/sequences/[id].vue (Pug)
fixFile('pages/marketing/sequences/[id].vue', [
  ['el-option(label="Email" value="email")', "el-option(:label=\"$t('sequences.email')\" value=\"email\")"],
  ['el-option(label="Wait" value="wait")', "el-option(:label=\"$t('sequences.wait')\" value=\"wait\")"],
  ['el-option(label="Task" value="task")', "el-option(:label=\"$t('sequences.task')\" value=\"task\")"],
  ['el-option(label="Lead" value="lead")', "el-option(:label=\"$t('common.lead')\" value=\"lead\")"],
  ['el-option(label="Client" value="client")', "el-option(:label=\"$t('common.client')\" value=\"client\")"],
  ['el-option(label="Deal" value="deal")', "el-option(:label=\"$t('common.deal')\" value=\"deal\")"],
  ['el-option(label="Opportunity" value="opportunity")', "el-option(:label=\"$t('common.opportunity')\" value=\"opportunity\")"],
]);

// 20. hr/training/[id].vue (Pug)
fixFile('pages/hr/training/[id].vue', [
  ['el-option(label="All" value="")', "el-option(:label=\"$t('common.all')\" value=\"\")"],
  ['el-option(label="Online" value="ONLINE")', "el-option(:label=\"$t('training.online')\" value=\"ONLINE\")"],
  ['el-option(label="Classroom" value="CLASSROOM")', "el-option(:label=\"$t('training.classroom')\" value=\"CLASSROOM\")"],
  ['el-option(label="Workshop" value="WORKSHOP")', "el-option(:label=\"$t('training.workshop')\" value=\"WORKSHOP\")"],
  ['el-option(label="Certification" value="CERTIFICATION")', "el-option(:label=\"$t('training.certification')\" value=\"CERTIFICATION\")"],
  ['el-option(label="On the Job" value="ON_THE_JOB")', "el-option(:label=\"$t('training.onTheJob')\" value=\"ON_THE_JOB\")"],
  ['el-option(label="Draft" value="DRAFT")', "el-option(:label=\"$t('common.draft')\" value=\"DRAFT\")"],
  ['el-option(label="Active" value="ACTIVE")', "el-option(:label=\"$t('common.active')\" value=\"ACTIVE\")"],
  ['el-option(label="Completed" value="COMPLETED")', "el-option(:label=\"$t('common.completed')\" value=\"COMPLETED\")"],
  ['el-option(label="Archived" value="ARCHIVED")', "el-option(:label=\"$t('common.archived')\" value=\"ARCHIVED\")"],
  ['el-option(label="PDF" value="PDF")', "el-option(:label=\"$t('training.pdf')\" value=\"PDF\")"],
  ['el-option(label="Video" value="VIDEO")', "el-option(:label=\"$t('training.video')\" value=\"VIDEO\")"],
  ['el-option(label="Slides" value="SLIDES")', "el-option(:label=\"$t('training.slides')\" value=\"SLIDES\")"],
  ['el-option(label="Document" value="DOCUMENT")', "el-option(:label=\"$t('training.document')\" value=\"DOCUMENT\")"],
  ['el-option(label="Link" value="LINK")', "el-option(:label=\"$t('training.link')\" value=\"LINK\")"],
]);

// 21. warranty/index.vue (Pug)
fixFile('pages/warranty/index.vue', [
  ['el-option(label="Filed" value="FILED")', "el-option(:label=\"$t('warranty.filed')\" value=\"FILED\")"],
  ['el-option(label="Under Review" value="UNDER_REVIEW")', "el-option(:label=\"$t('warranty.underReview')\" value=\"UNDER_REVIEW\")"],
  ['el-option(label="Approved" value="APPROVED")', "el-option(:label=\"$t('common.approved')\" value=\"APPROVED\")"],
  ['el-option(label="Denied" value="DENIED")', "el-option(:label=\"$t('common.denied')\" value=\"DENIED\")"],
  ['el-option(label="Fulfilled" value="FULFILLED")', "el-option(:label=\"$t('warranty.fulfilled')\" value=\"FULFILLED\")"],
  ['el-option(label="Warranty" value="Warranty")', "el-option(:label=\"$t('warranty.typeWarranty')\" value=\"Warranty\")"],
  ['el-option(label="Maintenance" value="Maintenance")', "el-option(:label=\"$t('warranty.typeMaintenance')\" value=\"Maintenance\")"],
  ['el-option(label="Support Plan" value="Support")', "el-option(:label=\"$t('warranty.typeSupportPlan')\" value=\"Support\")"],
  ['el-option(label="AMC" value="AMC")', "el-option(:label=\"$t('warranty.typeAMC')\" value=\"AMC\")"],
]);

// 22. marketing/abm/index.vue (Pug)
fixFile('pages/marketing/abm/index.vue', [
  ['el-option(label="Email" value="email")', "el-option(:label=\"$t('abm.channelEmail')\" value=\"email\")"],
  ['el-option(label="Ads" value="ads")', "el-option(:label=\"$t('abm.channelAds')\" value=\"ads\")"],
  ['el-option(label="Social" value="social")', "el-option(:label=\"$t('abm.channelSocial')\" value=\"social\")"],
  ['el-option(label="Events" value="events")', "el-option(:label=\"$t('abm.channelEvents')\" value=\"events\")"],
]);

// 23. marketing/loyalty/index.vue (Pug)
fixFile('pages/marketing/loyalty/index.vue', [
  ['el-option(label="All" value="")', "el-option(:label=\"$t('common.all')\" value=\"\")"],
  ['el-option(label="Active" value="ACTIVE")', "el-option(:label=\"$t('common.active')\" value=\"ACTIVE\")"],
  ['el-option(label="Paused" value="PAUSED")', "el-option(:label=\"$t('common.paused')\" value=\"PAUSED\")"],
  ['el-option(label="Ended" value="ENDED")', "el-option(:label=\"$t('loyalty.ended')\" value=\"ENDED\")"],
  ['el-option(label="All Tiers" value="")', "el-option(:label=\"$t('loyalty.allTiers')\" value=\"\")"],
  ['el-option(label="Bronze" value="BRONZE")', "el-option(:label=\"$t('loyalty.bronze')\" value=\"BRONZE\")"],
  ['el-option(label="Silver" value="SILVER")', "el-option(:label=\"$t('loyalty.silver')\" value=\"SILVER\")"],
  ['el-option(label="Gold" value="GOLD")', "el-option(:label=\"$t('loyalty.gold')\" value=\"GOLD\")"],
  ['el-option(label="Platinum" value="PLATINUM")', "el-option(:label=\"$t('loyalty.platinum')\" value=\"PLATINUM\")"],
  ['el-option(label="Earn" value="EARN")', "el-option(:label=\"$t('loyalty.earn')\" value=\"EARN\")"],
  ['el-option(label="Redeem" value="REDEEM")', "el-option(:label=\"$t('loyalty.redeem')\" value=\"REDEEM\")"],
  ['el-option(label="Adjust" value="ADJUST")', "el-option(:label=\"$t('loyalty.adjust')\" value=\"ADJUST\")"],
]);

// 24. hr/recruitment/[id].vue (Pug)
fixFile('pages/hr/recruitment/[id].vue', [
  ['el-option(label="LinkedIn" value="LinkedIn")', "el-option(:label=\"$t('recruitment.linkedin')\" value=\"LinkedIn\")"],
  ['el-option(label="Indeed" value="Indeed")', "el-option(:label=\"$t('recruitment.indeed')\" value=\"Indeed\")"],
  ['el-option(label="Referral" value="Referral")', "el-option(:label=\"$t('recruitment.referral')\" value=\"Referral\")"],
  ['el-option(label="Website" value="Website")', "el-option(:label=\"$t('recruitment.website')\" value=\"Website\")"],
  ['el-option(label="Job Board" value="Job Board")', "el-option(:label=\"$t('recruitment.jobBoard')\" value=\"Job Board\")"],
  ['el-option(label="Other" value="Other")', "el-option(:label=\"$t('recruitment.other')\" value=\"Other\")"],
]);

// 25. e-commerce/index.vue (Pug)
fixFile('pages/e-commerce/index.vue', [
  ['el-option(label="Percentage" value="percentage")', "el-option(:label=\"$t('common.percentage')\" value=\"percentage\")"],
  ['el-option(label="Fixed Amount" value="fixed")', "el-option(:label=\"$t('common.fixedAmount')\" value=\"fixed\")"],
]);

// 26. hr/recruitment/index.vue (Pug)
fixFile('pages/hr/recruitment/index.vue', [
  ['el-option(label="All Stages" value="")', "el-option(:label=\"$t('recruitment.allStages')\" value=\"\")"],
  ['el-option(label="All Jobs" value="")', "el-option(:label=\"$t('recruitment.allJobs')\" value=\"\")"],
  ['el-option(label="Full-time" value="FULL_TIME")', "el-option(:label=\"$t('recruitment.fullTime')\" value=\"FULL_TIME\")"],
  ['el-option(label="Part-time" value="PART_TIME")', "el-option(:label=\"$t('recruitment.partTime')\" value=\"PART_TIME\")"],
  ['el-option(label="Contract" value="CONTRACT")', "el-option(:label=\"$t('recruitment.contract')\" value=\"CONTRACT\")"],
  ['el-option(label="Internship" value="INTERNSHIP")', "el-option(:label=\"$t('recruitment.internship')\" value=\"INTERNSHIP\")"],
  ['el-option(label="LinkedIn" value="LinkedIn")', "el-option(:label=\"$t('recruitment.linkedin')\" value=\"LinkedIn\")"],
  ['el-option(label="Indeed" value="Indeed")', "el-option(:label=\"$t('recruitment.indeed')\" value=\"Indeed\")"],
  ['el-option(label="Referral" value="Referral")', "el-option(:label=\"$t('recruitment.referral')\" value=\"Referral\")"],
  ['el-option(label="Website" value="Website")', "el-option(:label=\"$t('recruitment.website')\" value=\"Website\")"],
  ['el-option(label="Job Board" value="Job Board")', "el-option(:label=\"$t('recruitment.jobBoard')\" value=\"Job Board\")"],
  ['el-option(label="Other" value="Other")', "el-option(:label=\"$t('recruitment.other')\" value=\"Other\")"],
]);

// 27. e-commerce/orders/create.vue (Pug)
fixFile('pages/e-commerce/orders/create.vue', [
  ['el-option(label="SAR" value="SAR")', "el-option(:label=\"$t('common.currencySAR')\" value=\"SAR\")"],
  ['el-option(label="USD" value="USD")', "el-option(:label=\"$t('common.currencyUSD')\" value=\"USD\")"],
  ['el-option(label="EUR" value="EUR")', "el-option(:label=\"$t('common.currencyEUR')\" value=\"EUR\")"],
  ['el-option(label="GBP" value="GBP")', "el-option(:label=\"$t('common.currencyGBP')\" value=\"GBP\")"],
]);

// 28. marketing/form-builder/index.vue (Pug)
fixFile('pages/marketing/form-builder/index.vue', [
  ['el-option(label="Draft" value="DRAFT")', "el-option(:label=\"$t('common.draft')\" value=\"DRAFT\")"],
  ['el-option(label="Active" value="ACTIVE")', "el-option(:label=\"$t('common.active')\" value=\"ACTIVE\")"],
  ['el-option(label="Inactive" value="INACTIVE")', "el-option(:label=\"$t('common.inactive')\" value=\"INACTIVE\")"],
]);

// 29. hr/performance-reviews.vue (HTML)
fixFile('pages/hr/performance-reviews.vue', [
  ['<el-option label="Q1 2026" value="Q1-2026" />', "<el-option :label=\"$t('performance.q1_2026')\" value=\"Q1-2026\" />"],
  ['<el-option label="Q4 2025" value="Q4-2025" />', "<el-option :label=\"$t('performance.q4_2025')\" value=\"Q4-2025\" />"],
  ['<el-option label="Q3 2025" value="Q3-2025" />', "<el-option :label=\"$t('performance.q3_2025')\" value=\"Q3-2025\" />"],
  ['<el-option label="Annual 2025" value="ANNUAL-2025" />', "<el-option :label=\"$t('performance.annual_2025')\" value=\"ANNUAL-2025\" />"],
  ['<el-option label="Quarterly" value="QUARTERLY" />', "<el-option :label=\"$t('performance.quarterly')\" value=\"QUARTERLY\" />"],
  ['<el-option label="Annual" value="ANNUAL" />', "<el-option :label=\"$t('performance.annual')\" value=\"ANNUAL\" />"],
  ['<el-option label="Probation" value="PROBATION" />', "<el-option :label=\"$t('performance.probation')\" value=\"PROBATION\" />"],
  ['<el-option label="Project-Based" value="PROJECT" />', "<el-option :label=\"$t('performance.projectBased')\" value=\"PROJECT\" />"],
]);

// 30. warehouse/index.vue (Pug)
fixFile('pages/warehouse/index.vue', [
  ['el-option(label="Active" value="ACTIVE")', "el-option(:label=\"$t('common.active')\" value=\"ACTIVE\")"],
  ['el-option(label="Inactive" value="INACTIVE")', "el-option(:label=\"$t('common.inactive')\" value=\"INACTIVE\")"],
  ['el-option(label="Maintenance" value="MAINTENANCE")', "el-option(:label=\"$t('warehouse.maintenance')\" value=\"MAINTENANCE\")"],
  ['el-option(label="Storage" value="STORAGE")', "el-option(:label=\"$t('warehouse.storage')\" value=\"STORAGE\")"],
  ['el-option(label="Picking" value="PICKING")', "el-option(:label=\"$t('warehouse.picking')\" value=\"PICKING\")"],
  ['el-option(label="Receiving" value="RECEIVING")', "el-option(:label=\"$t('warehouse.receiving')\" value=\"RECEIVING\")"],
  ['el-option(label="Shipping" value="SHIPPING")', "el-option(:label=\"$t('warehouse.shippingZone')\" value=\"SHIPPING\")"],
  ['el-option(label="Quarantine" value="QUARANTINE")', "el-option(:label=\"$t('warehouse.quarantine')\" value=\"QUARANTINE\")"],
]);

// 31. hr/performance/index.vue (Pug)
fixFile('pages/hr/performance/index.vue', [
  ['el-option(label="Q1 2026" value="Q1-2026")', "el-option(:label=\"$t('performance.q1_2026')\" value=\"Q1-2026\")"],
  ['el-option(label="Q2 2026" value="Q2-2026")', "el-option(:label=\"$t('performance.q2_2026')\" value=\"Q2-2026\")"],
  ['el-option(label="Q3 2026" value="Q3-2026")', "el-option(:label=\"$t('performance.q3_2026')\" value=\"Q3-2026\")"],
  ['el-option(label="Q4 2026" value="Q4-2026")', "el-option(:label=\"$t('performance.q4_2026')\" value=\"Q4-2026\")"],
  ['el-option(label="Annual 2025" value="ANNUAL-2025")', "el-option(:label=\"$t('performance.annual_2025')\" value=\"ANNUAL-2025\")"],
  ['el-option(label="Annual 2026" value="ANNUAL-2026")', "el-option(:label=\"$t('performance.annual_2026')\" value=\"ANNUAL-2026\")"],
  ['el-option(label="All Statuses" value="")', "el-option(:label=\"$t('performance.allStatuses')\" value=\"\")"],
]);

// 32. reports/custom-reports.vue (Pug)
fixFile('pages/reports/custom-reports.vue', [
  ['el-option(label="Descending" value="DESC")', "el-option(:label=\"$t('common.descending')\" value=\"DESC\")"],
  ['el-option(label="Ascending" value="ASC")', "el-option(:label=\"$t('common.ascending')\" value=\"ASC\")"],
  ['el-option(label="Equals" value="equals")', "el-option(:label=\"$t('common.equals')\" value=\"equals\")"],
  ['el-option(label="Contains" value="contains")', "el-option(:label=\"$t('common.contains')\" value=\"contains\")"],
  ['el-option(label="Is Null" value="is_null")', "el-option(:label=\"$t('common.isNull')\" value=\"is_null\")"],
  ['el-option(label="Is Not Null" value="is_not_null")', "el-option(:label=\"$t('common.isNotNull')\" value=\"is_not_null\")"],
]);

// 33. shipping/index.vue (Pug)
fixFile('pages/shipping/index.vue', [
  ['el-option(label="Domestic" value="Domestic")', "el-option(:label=\"$t('shipping.domestic')\" value=\"Domestic\")"],
  ['el-option(label="International" value="International")', "el-option(:label=\"$t('shipping.international')\" value=\"International\")"],
  ['el-option(label="Express" value="Express")', "el-option(:label=\"$t('shipping.express')\" value=\"Express\")"],
  ['el-option(label="Economy" value="Economy")', "el-option(:label=\"$t('shipping.economy')\" value=\"Economy\")"],
  ['el-option(label="All" value="")', "el-option(:label=\"$t('common.all')\" value=\"\")"],
  ['el-option(label="Preparing" value="PREPARING")', "el-option(:label=\"$t('shipping.preparing')\" value=\"PREPARING\")"],
  ['el-option(label="Shipped" value="SHIPPED")', "el-option(:label=\"$t('common.shipped')\" value=\"SHIPPED\")"],
  ['el-option(label="In Transit" value="IN_TRANSIT")', "el-option(:label=\"$t('shipping.inTransit')\" value=\"IN_TRANSIT\")"],
  ['el-option(label="Delivered" value="DELIVERED")', "el-option(:label=\"$t('common.delivered')\" value=\"DELIVERED\")"],
  ['el-option(label="Returned" value="RETURNED")', "el-option(:label=\"$t('common.returned')\" value=\"RETURNED\")"],
  ['el-option(label="Cancelled" value="CANCELLED")', "el-option(:label=\"$t('common.cancelled')\" value=\"CANCELLED\")"],
  ['el-option(label="SAR" value="SAR")', "el-option(:label=\"$t('common.currencySAR')\" value=\"SAR\")"],
  ['el-option(label="USD" value="USD")', "el-option(:label=\"$t('common.currencyUSD')\" value=\"USD\")"],
  ['el-option(label="EUR" value="EUR")', "el-option(:label=\"$t('common.currencyEUR')\" value=\"EUR\")"],
  ['el-option(label="GBP" value="GBP")', "el-option(:label=\"$t('common.currencyGBP')\" value=\"GBP\")"],
]);

// 34. messaging/whatsapp/index.vue (Pug)
fixFile('pages/messaging/whatsapp/index.vue', [
  ['el-option(label="English" value="en")', "el-option(:label=\"$t('whatsapp.english')\" value=\"en\")"],
  ['el-option(label="Arabic" value="ar")', "el-option(:label=\"$t('whatsapp.arabic')\" value=\"ar\")"],
  ['el-option(label="None" value="NONE")', "el-option(:label=\"$t('whatsapp.none')\" value=\"NONE\")"],
  ['el-option(label="Text" value="TEXT")', "el-option(:label=\"$t('whatsapp.text')\" value=\"TEXT\")"],
  ['el-option(label="Image" value="IMAGE")', "el-option(:label=\"$t('whatsapp.image')\" value=\"IMAGE\")"],
  ['el-option(label="Document" value="DOCUMENT")', "el-option(:label=\"$t('whatsapp.document')\" value=\"DOCUMENT\")"],
  ['el-option(label="Audio" value="AUDIO")', "el-option(:label=\"$t('whatsapp.audio')\" value=\"AUDIO\")"],
  ['el-option(label="Video" value="VIDEO")', "el-option(:label=\"$t('whatsapp.video')\" value=\"VIDEO\")"],
]);

// 35. sales/ai-lead-scoring.vue (Pug)
fixFile('pages/sales/ai-lead-scoring.vue', [
  ['el-option(label="Gradient Boost" value="gradient_boost")', "el-option(:label=\"$t('aiLeadScoring.gradientBoost')\" value=\"gradient_boost\")"],
  ['el-option(label="Neural Network" value="neural_net")', "el-option(:label=\"$t('aiLeadScoring.neuralNetwork')\" value=\"neural_net\")"],
  ['el-option(label="Bayesian" value="bayesian")', "el-option(:label=\"$t('aiLeadScoring.bayesian')\" value=\"bayesian\")"],
  ['el-option(label="Logistic Regression" value="logistic_regression")', "el-option(:label=\"$t('aiLeadScoring.logisticRegression')\" value=\"logistic_regression\")"],
  ['el-option(label="Random Forest" value="random_forest")', "el-option(:label=\"$t('aiLeadScoring.randomForest')\" value=\"random_forest\")"],
]);

// 36. settings/sla.vue (Pug)
fixFile('pages/settings/sla.vue', [
  ['el-option(label="Lead" value="lead")', "el-option(:label=\"$t('sla.lead')\" value=\"lead\")"],
  ['el-option(label="Deal" value="deal")', "el-option(:label=\"$t('sla.deal')\" value=\"deal\")"],
  ['el-option(label="Client" value="client")', "el-option(:label=\"$t('sla.client')\" value=\"client\")"],
  ['el-option(label="Ticket" value="ticket")', "el-option(:label=\"$t('sla.ticket')\" value=\"ticket\")"],
  ['el-option(label="Opportunity" value="opportunity")', "el-option(:label=\"$t('sla.opportunity')\" value=\"opportunity\")"],
]);

// 37. settings/products/index.vue (Pug)
fixFile('pages/settings/products/index.vue', [
  ['el-option(label="SAR" value="SAR")', "el-option(:label=\"$t('common.currencySAR')\" value=\"SAR\")"],
  ['el-option(label="USD" value="USD")', "el-option(:label=\"$t('common.currencyUSD')\" value=\"USD\")"],
  ['el-option(label="EUR" value="EUR")', "el-option(:label=\"$t('common.currencyEUR')\" value=\"EUR\")"],
  ['el-option(label="GBP" value="GBP")', "el-option(:label=\"$t('common.currencyGBP')\" value=\"GBP\")"],
]);

// 38. supply-chain/quality-control.vue (Pug)
fixFile('pages/supply-chain/quality-control.vue', [
  ['el-option(label="Manufacturing" value="Manufacturing")', "el-option(:label=\"$t('qualityControl.manufacturing')\" value=\"Manufacturing\")"],
  ['el-option(label="Packaging" value="Packaging")', "el-option(:label=\"$t('qualityControl.packaging')\" value=\"Packaging\")"],
  ['el-option(label="Safety" value="Safety")', "el-option(:label=\"$t('qualityControl.safety')\" value=\"Safety\")"],
  ['el-option(label="Compliance" value="Compliance")', "el-option(:label=\"$t('qualityControl.compliance')\" value=\"Compliance\")"],
  ['el-option(label="Environmental" value="Environmental")', "el-option(:label=\"$t('qualityControl.environmental')\" value=\"Environmental\")"],
  ['el-option(label="Pass/Fail" value="pass-fail")', "el-option(:label=\"$t('qualityControl.passFail')\" value=\"pass-fail\")"],
  ['el-option(label="Pass/Fail/NA" value="pass-fail-na")', "el-option(:label=\"$t('qualityControl.passFailNa')\" value=\"pass-fail-na\")"],
  ['el-option(label="Numeric" value="numeric")', "el-option(:label=\"$t('qualityControl.numeric')\" value=\"numeric\")"],
]);

// 39. settings/lead-scoring.vue (Pug)
fixFile('pages/settings/lead-scoring.vue', [
  ['el-option(label="Lead" value="lead")', "el-option(:label=\"$t('leadScoring.lead')\" value=\"lead\")"],
  ['el-option(label="Deal" value="deal")', "el-option(:label=\"$t('leadScoring.deal')\" value=\"deal\")"],
  ['el-option(label="Client" value="client")', "el-option(:label=\"$t('leadScoring.client')\" value=\"client\")"],
  ['el-option(label="Opportunity" value="opportunity")', "el-option(:label=\"$t('leadScoring.opportunity')\" value=\"opportunity\")"],
  ['el-option(label="Equals" value="equals")', "el-option(:label=\"$t('common.equals')\" value=\"equals\")"],
  ['el-option(label="Contains" value="contains")', "el-option(:label=\"$t('common.contains')\" value=\"contains\")"],
  ['el-option(label="Greater than" value="gt")', "el-option(:label=\"$t('common.greaterThan')\" value=\"gt\")"],
  ['el-option(label="Less than" value="lt")', "el-option(:label=\"$t('common.lessThan')\" value=\"lt\")"],
  ['el-option(label="Not empty" value="not_empty")', "el-option(:label=\"$t('common.notEmpty')\" value=\"not_empty\")"],
]);

// 40. sales/cpq/index.vue (Pug)
fixFile('pages/sales/cpq/index.vue', [
  ['el-option(label="SAR" value="SAR")', "el-option(:label=\"$t('common.currencySAR')\" value=\"SAR\")"],
  ['el-option(label="USD" value="USD")', "el-option(:label=\"$t('common.currencyUSD')\" value=\"USD\")"],
  ['el-option(label="EUR" value="EUR")', "el-option(:label=\"$t('common.currencyEUR')\" value=\"EUR\")"],
  ['el-option(label="GBP" value="GBP")', "el-option(:label=\"$t('common.currencyGBP')\" value=\"GBP\")"],
]);

// 41. operations/resource-planner.vue (HTML)
fixFile('pages/operations/resource-planner.vue', [
  ['<el-option label="Standard" value="Standard" />', "<el-option :label=\"$t('resourcePlanner.standard')\" value=\"Standard\" />"],
  ['<el-option label="Helper" value="Helper" />', "<el-option :label=\"$t('resourcePlanner.helper')\" value=\"Helper\" />"],
  ['<el-option label="SiteEngineer" value="SiteEngineer" />', "<el-option :label=\"$t('resourcePlanner.siteEngineer')\" value=\"SiteEngineer\" />"],
  ['<el-option label="Engineer" value="Engineer" />', "<el-option :label=\"$t('resourcePlanner.engineer')\" value=\"Engineer\" />"],
]);

// 42. settings/email-templates/index.vue (Pug)
fixFile('pages/settings/email-templates/index.vue', [
  ['el-option(label="Sales" value="Sales")', "el-option(:label=\"$t('emailTemplates.sales')\" value=\"Sales\")"],
  ['el-option(label="Follow-up" value="Follow-up")', "el-option(:label=\"$t('emailTemplates.followUp')\" value=\"Follow-up\")"],
  ['el-option(label="Onboarding" value="Onboarding")', "el-option(:label=\"$t('emailTemplates.onboarding')\" value=\"Onboarding\")"],
  ['el-option(label="Invoice" value="Invoice")', "el-option(:label=\"$t('emailTemplates.invoice')\" value=\"Invoice\")"],
  ['el-option(label="Support" value="Support")', "el-option(:label=\"$t('emailTemplates.support')\" value=\"Support\")"],
  ['el-option(label="Marketing" value="Marketing")', "el-option(:label=\"$t('emailTemplates.marketing')\" value=\"Marketing\")"],
  ['el-option(label="General" value="General")', "el-option(:label=\"$t('emailTemplates.general')\" value=\"General\")"],
]);

// 43. settings/email-accounts.vue (Pug)
fixFile('pages/settings/email-accounts.vue', [
  ['el-option(label="Gmail" value="gmail")', "el-option(:label=\"$t('emailAccounts.gmail')\" value=\"gmail\")"],
  ['el-option(label="Outlook" value="outlook")', "el-option(:label=\"$t('emailAccounts.outlook')\" value=\"outlook\")"],
  ['el-option(label="IMAP" value="imap")', "el-option(:label=\"$t('emailAccounts.imap')\" value=\"imap\")"],
  ['el-option(label="SMTP" value="smtp")', "el-option(:label=\"$t('emailAccounts.smtp')\" value=\"smtp\")"],
]);

// 44. settings/duplicates.vue (Pug)
fixFile('pages/settings/duplicates.vue', [
  ['el-option(label="Lead" value="lead")', "el-option(:label=\"$t('duplicates.lead')\" value=\"lead\")"],
  ['el-option(label="Client" value="client")', "el-option(:label=\"$t('duplicates.client')\" value=\"client\")"],
  ['el-option(label="Deal" value="deal")', "el-option(:label=\"$t('duplicates.deal')\" value=\"deal\")"],
]);

// 45. settings/document-templates.vue (Pug)
fixFile('pages/settings/document-templates.vue', [
  ['el-option(label="A4" value="A4")', "el-option(:label=\"$t('documentTemplates.a4')\" value=\"A4\")"],
  ['el-option(label="Letter" value="Letter")', "el-option(:label=\"$t('documentTemplates.letter')\" value=\"Letter\")"],
  ['el-option(label="Legal" value="Legal")', "el-option(:label=\"$t('documentTemplates.legal')\" value=\"Legal\")"],
]);

// 46. sales/product-catalog/index.vue (Pug)
fixFile('pages/sales/product-catalog/index.vue', [
  ['el-option(label="SAR" value="SAR")', "el-option(:label=\"$t('common.currencySAR')\" value=\"SAR\")"],
  ['el-option(label="USD" value="USD")', "el-option(:label=\"$t('common.currencyUSD')\" value=\"USD\")"],
  ['el-option(label="EUR" value="EUR")', "el-option(:label=\"$t('common.currencyEUR')\" value=\"EUR\")"],
  ['el-option(label="GBP" value="GBP")', "el-option(:label=\"$t('common.currencyGBP')\" value=\"GBP\")"],
]);

// 47. settings/data-import.vue (HTML)
fixFile('pages/settings/data-import.vue', [
  ['<el-option label="Skip duplicates" value="skip" />', "<el-option :label=\"$t('dataImport.skipDuplicates')\" value=\"skip\" />"],
  ['<el-option label="Update existing records" value="update" />', "<el-option :label=\"$t('dataImport.updateExisting')\" value=\"update\" />"],
  ['<el-option label="Create new records" value="create" />', "<el-option :label=\"$t('dataImport.createNew')\" value=\"create\" />"],
  ['<el-option label="Strict - Skip invalid rows" value="strict" />', "<el-option :label=\"$t('dataImport.strict')\" value=\"strict\" />"],
  ['<el-option label="Lenient - Import all rows" value="lenient" />', "<el-option :label=\"$t('dataImport.lenient')\" value=\"lenient\" />"],
]);

// Save locale files
fs.writeFileSync(`${base}/locales/en.json`, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(`${base}/locales/ar.json`, JSON.stringify(ar, null, 2) + '\n');

console.log(`\nTotal replacements: ${totalFixed}`);
console.log('Locale files updated.');
