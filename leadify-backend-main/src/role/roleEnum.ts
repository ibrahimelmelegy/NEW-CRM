export enum LeadPermissionsEnum {
  VIEW_OWN_LEADS = 'VIEW_OWN_LEADS',
  VIEW_GLOBAL_LEADS = 'VIEW_GLOBAL_LEADS',
  CREATE_LEADS = 'CREATE_LEADS',
  EDIT_LEADS = 'EDIT_LEADS'
}

export enum OpportunityPermissionsEnum {
  VIEW_OWN_OPPORTUNITIES = 'VIEW_OWN_OPPORTUNITIES',
  VIEW_GLOBAL_OPPORTUNITIES = 'VIEW_GLOBAL_OPPORTUNITIES',
  CREATE_OPPORTUNITIES = 'CREATE_OPPORTUNITIES',
  EDIT_OPPORTUNITIES = 'EDIT_OPPORTUNITIES'
}

export enum DealPermissionsEnum {
  VIEW_OWN_DEALS = 'VIEW_OWN_DEALS',
  VIEW_GLOBAL_DEALS = 'VIEW_GLOBAL_DEALS',
  CREATE_DEALS = 'CREATE_DEALS',
  EDIT_DEALS = 'EDIT_DEALS'
}

export enum ProposalPermissionsEnum {
  VIEW_OWN_PROPOSALS = 'VIEW_OWN_PROPOSALS',
  VIEW_GLOBAL_PROPOSALS = 'VIEW_GLOBAL_PROPOSALS',
  CREATE_PROPOSALS = 'CREATE_PROPOSALS',
  EDIT_PROPOSALS = 'EDIT_PROPOSALS',
  APPROVE_PROPOSALS = 'APPROVE_PROPOSALS',
  REJECT_PROPOSALS = 'REJECT_PROPOSALS',
  WAITING_APPROVAL_PROPOSALS = 'WAITING_APPROVAL_PROPOSALS',
  ARCHIVE_PROPOSALS = 'ARCHIVE_PROPOSALS',
  DELETE_PROPOSALS = 'DELETE_PROPOSALS'
}

export enum ProjectPermissionsEnum {
  VIEW_OWN_PROJECTS = 'VIEW_OWN_PROJECTS',
  VIEW_GLOBAL_PROJECTS = 'VIEW_GLOBAL_PROJECTS',
  CREATE_PROJECTS = 'CREATE_PROJECTS',
  EDIT_PROJECTS = 'EDIT_PROJECTS'
}

export enum VehiclePermissionsEnum {
  VIEW_VEHICLES = 'VIEW_VEHICLES',
  CREATE_VEHICLES = 'CREATE_VEHICLES',
  EDIT_VEHICLES = 'EDIT_VEHICLES'
}

export enum ManpowerPermissionsEnum {
  VIEW_MANPOWER = 'VIEW_MANPOWER',
  CREATE_MANPOWER = 'CREATE_MANPOWER',
  EDIT_MANPOWER = 'EDIT_MANPOWER'
}

export enum AdditionalMaterialPermissionsEnum {
  VIEW_ADDITIONAL_MATERIAL = 'VIEW_ADDITIONAL_MATERIAL',
  CREATE_ADDITIONAL_MATERIAL = 'CREATE_ADDITIONAL_MATERIAL',
  EDIT_ADDITIONAL_MATERIAL = 'EDIT_ADDITIONAL_MATERIAL'
}

export enum ServicePermissionsEnum {
  VIEW_SERVICES = 'VIEW_SERVICES',
  CREATE_SERVICES = 'CREATE_SERVICES',
  EDIT_SERVICES = 'EDIT_SERVICES'
}

export enum AssetPermissionsEnum {
  VIEW_ASSETS = 'VIEW_ASSETS',
  CREATE_ASSETS = 'CREATE_ASSETS',
  EDIT_ASSETS = 'EDIT_ASSETS'
}

export enum ClientPermissionsEnum {
  VIEW_OWN_CLIENTS = 'VIEW_OWN_CLIENTS',
  VIEW_GLOBAL_CLIENTS = 'VIEW_GLOBAL_CLIENTS',
  CREATE_CLIENTS = 'CREATE_CLIENTS',
  EDIT_CLIENTS = 'EDIT_CLIENTS'
}

export enum StaffPermissionsEnum {
  VIEW_OWN_STAFF = 'VIEW_OWN_STAFF',
  VIEW_GLOBAL_STAFF = 'VIEW_GLOBAL_STAFF',
  CREATE_STAFF = 'CREATE_STAFF',
  EDIT_STAFF = 'EDIT_STAFF'
}

export enum RolePermissionsEnum {
  VIEW_ROLES = 'VIEW_ROLES',
  CREATE_ROLES = 'CREATE_ROLES',
  EDIT_ROLES = 'EDIT_ROLES'
}

export enum SettingsPermissionsEnum {
  VIEW_SETTINGS = 'VIEW_SETTINGS',
  EDIT_SETTINGS = 'EDIT_SETTINGS'
}

export enum ReportPermissionsEnum {
  EXPORT_OWN_REPORTS = 'EXPORT_OWN_REPORTS',
  EXPORT_GLOBAL_REPORTS = 'EXPORT_GLOBAL_REPORTS',
  EXPORT_SALES_REPORTS = 'EXPORT_SALES_REPORTS',
  EXPORT_PROJECT_REPORTS = 'EXPORT_PROJECT_REPORTS',
  EXPORT_PERFORMANCE_REPORTS = 'EXPORT_PERFORMANCE_REPORTS'
}

export enum LeadAndSalesWidgetsPermissionsEnum {
  VIEW_OWN_LEAD_SALES_WIDGETS = 'VIEW_OWN_LEAD_SALES_WIDGETS',
  VIEW_GLOBAL_LEAD_SALES_WIDGETS = 'VIEW_GLOBAL_LEAD_SALES_WIDGETS'
}

export enum ProjectsAndOperationsWidgetsPermissionsEnum {
  VIEW_OWN_PROJECTS_OPERATIONS_WIDGETS = 'VIEW_OWN_PROJECTS_OPERATIONS_WIDGETS',
  VIEW_GLOBAL_PROJECTS_OPERATIONS_WIDGETS = 'VIEW_GLOBAL_PROJECTS_OPERATIONS_WIDGETS'
}
export enum FinancialAndBusinessMetricsWidgetsPermissionsEnum {
  VIEW_OWN_FINANCIAL_BUSINESS_METRICS_WIDGETS = 'VIEW_OWN_FINANCIAL_BUSINESS_METRICS_WIDGETS',
  VIEW_GLOBAL_FINANCIAL_BUSINESS_METRICS_WIDGETS = 'VIEW_GLOBAL_FINANCIAL_BUSINESS_METRICS_WIDGETS'
}

export enum PerformanceAndHRWidgetsPermissionsEnum {
  VIEW_OWN_PERFORMANCE_HR_WIDGETS = 'VIEW_OWN_PERFORMANCE_HR_WIDGETS',
  VIEW_GLOBAL_PERFORMANCE_HR_WIDGETS = 'VIEW_GLOBAL_PERFORMANCE_HR_WIDGETS'
}

export enum ProcurementPermissionsEnum {
  VIEW_PROCUREMENT = 'VIEW_PROCUREMENT',
  CREATE_PROCUREMENT = 'CREATE_PROCUREMENT',
  EDIT_PROCUREMENT = 'EDIT_PROCUREMENT',
  APPROVE_PROCUREMENT = 'APPROVE_PROCUREMENT',
  REJECT_PROCUREMENT = 'REJECT_PROCUREMENT',
  DELETE_PROCUREMENT = 'DELETE_PROCUREMENT',
  ARCHIVE_PROCUREMENT = 'ARCHIVE_PROCUREMENT'
}

export enum VendorPermissionsEnum {
  VIEW_VENDORS = 'VIEW_VENDORS',
  CREATE_VENDORS = 'CREATE_VENDORS',
  EDIT_VENDORS = 'EDIT_VENDORS',
  DELETE_VENDORS = 'DELETE_VENDORS'
}

export enum DocumentTemplatePermissionsEnum {
  VIEW_DOCUMENT_TEMPLATES = 'VIEW_DOCUMENT_TEMPLATES',
  CREATE_DOCUMENT_TEMPLATES = 'CREATE_DOCUMENT_TEMPLATES',
  EDIT_DOCUMENT_TEMPLATES = 'EDIT_DOCUMENT_TEMPLATES',
  DELETE_DOCUMENT_TEMPLATES = 'DELETE_DOCUMENT_TEMPLATES'
}

export enum InvoicePermissionsEnum {
  VIEW_INVOICES = 'VIEW_INVOICES',
  CREATE_INVOICES = 'CREATE_INVOICES',
  EDIT_INVOICES = 'EDIT_INVOICES',
  VOID_INVOICES = 'VOID_INVOICES',
  SEND_INVOICES = 'SEND_INVOICES',
  VIEW_AGING = 'VIEW_AGING',
  CREATE_CREDIT_NOTE = 'CREATE_CREDIT_NOTE'
}

export enum SalesOrderPermissionsEnum {
  VIEW_SALES_ORDERS = 'VIEW_SALES_ORDERS',
  CREATE_SALES_ORDERS = 'CREATE_SALES_ORDERS',
  EDIT_SALES_ORDERS = 'EDIT_SALES_ORDERS',
  CONVERT_DEAL_TO_ORDER = 'CONVERT_DEAL_TO_ORDER'
}

export enum SubscriptionPermissionsEnum {
  VIEW_SUBSCRIPTIONS = 'VIEW_SUBSCRIPTIONS',
  CREATE_SUBSCRIPTIONS = 'CREATE_SUBSCRIPTIONS',
  EDIT_SUBSCRIPTIONS = 'EDIT_SUBSCRIPTIONS',
  CANCEL_SUBSCRIPTIONS = 'CANCEL_SUBSCRIPTIONS',
  MANAGE_PLANS = 'MANAGE_PLANS',
  VIEW_METRICS = 'VIEW_METRICS'
}

export enum AccountingPermissionsEnum {
  VIEW_CHART_OF_ACCOUNTS = 'VIEW_CHART_OF_ACCOUNTS',
  MANAGE_CHART_OF_ACCOUNTS = 'MANAGE_CHART_OF_ACCOUNTS',
  VIEW_JOURNAL_ENTRIES = 'VIEW_JOURNAL_ENTRIES',
  CREATE_JOURNAL_ENTRIES = 'CREATE_JOURNAL_ENTRIES',
  POST_JOURNAL_ENTRIES = 'POST_JOURNAL_ENTRIES',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS'
}

export enum PaymentPermissionsEnum {
  VIEW_PAYMENTS = 'VIEW_PAYMENTS',
  RECORD_PAYMENTS = 'RECORD_PAYMENTS',
  VOID_PAYMENTS = 'VOID_PAYMENTS',
  VIEW_PAYMENT_DASHBOARD = 'VIEW_PAYMENT_DASHBOARD',
  SEND_PAYMENT_REMINDERS = 'SEND_PAYMENT_REMINDERS'
}

export enum EmployeePermissionsEnum {
  VIEW_EMPLOYEES = 'VIEW_EMPLOYEES',
  CREATE_EMPLOYEES = 'CREATE_EMPLOYEES',
  EDIT_EMPLOYEES = 'EDIT_EMPLOYEES',
  TERMINATE_EMPLOYEES = 'TERMINATE_EMPLOYEES',
  VIEW_ORG_CHART = 'VIEW_ORG_CHART',
  VIEW_SALARY = 'VIEW_SALARY'
}

export enum PayrollPermissionsEnum {
  VIEW_PAYROLL = 'VIEW_PAYROLL',
  CREATE_PAYROLL_RUN = 'CREATE_PAYROLL_RUN',
  APPROVE_PAYROLL = 'APPROVE_PAYROLL',
  PROCESS_PAYROLL = 'PROCESS_PAYROLL',
  VIEW_PAYSLIPS = 'VIEW_PAYSLIPS',
  MANAGE_SALARY = 'MANAGE_SALARY'
}

export enum SupportPermissionsEnum {
  VIEW_TICKETS = 'VIEW_TICKETS',
  CREATE_TICKETS = 'CREATE_TICKETS',
  EDIT_TICKETS = 'EDIT_TICKETS',
  ASSIGN_TICKETS = 'ASSIGN_TICKETS',
  RESOLVE_TICKETS = 'RESOLVE_TICKETS',
  VIEW_INTERNAL_NOTES = 'VIEW_INTERNAL_NOTES',
  MANAGE_CANNED_RESPONSES = 'MANAGE_CANNED_RESPONSES'
}

export enum SecurityPermissionsEnum {
  VIEW_SESSIONS = 'VIEW_SESSIONS',
  MANAGE_SESSIONS = 'MANAGE_SESSIONS',
  VIEW_LOGIN_HISTORY = 'VIEW_LOGIN_HISTORY',
  MANAGE_IP_WHITELIST = 'MANAGE_IP_WHITELIST',
  EXPORT_DATA = 'EXPORT_DATA'
}

export enum CommunicationPermissionsEnum {
  VIEW_ACTIVITIES = 'VIEW_ACTIVITIES',
  LOG_ACTIVITIES = 'LOG_ACTIVITIES',
  LOG_CALLS = 'LOG_CALLS',
  VIEW_STATS = 'VIEW_STATS'
}

export enum ReportBuilderPermissionsEnum {
  BUILD_REPORTS = 'BUILD_REPORTS',
  SAVE_REPORTS = 'SAVE_REPORTS',
  SCHEDULE_REPORTS = 'SCHEDULE_REPORTS',
  EXPORT_REPORTS = 'EXPORT_REPORTS'
}

export enum IntegrationPermissionsEnum {
  VIEW_INTEGRATIONS = 'VIEW_INTEGRATIONS',
  CONFIGURE_INTEGRATIONS = 'CONFIGURE_INTEGRATIONS',
  TEST_INTEGRATIONS = 'TEST_INTEGRATIONS',
  MANAGE_WEBHOOKS = 'MANAGE_WEBHOOKS'
}

export enum DocBuilderPermissionsEnum {
  VIEW_OWN_DOCUMENTS = 'VIEW_OWN_DOCUMENTS',
  VIEW_GLOBAL_DOCUMENTS = 'VIEW_GLOBAL_DOCUMENTS',
  CREATE_DOCUMENTS = 'CREATE_DOCUMENTS',
  EDIT_DOCUMENTS = 'EDIT_DOCUMENTS',
  DELETE_DOCUMENTS = 'DELETE_DOCUMENTS',
  APPROVE_DOCUMENTS = 'APPROVE_DOCUMENTS',
  SEND_DOCUMENTS = 'SEND_DOCUMENTS'
}

export enum GoalPermissionsEnum {
  VIEW_GOALS = 'VIEW_GOALS',
  CREATE_GOALS = 'CREATE_GOALS',
  EDIT_GOALS = 'EDIT_GOALS',
  DELETE_GOALS = 'DELETE_GOALS'
}

export enum BookingPermissionsEnum {
  VIEW_BOOKINGS = 'VIEW_BOOKINGS',
  CREATE_BOOKINGS = 'CREATE_BOOKINGS',
  EDIT_BOOKINGS = 'EDIT_BOOKINGS',
  DELETE_BOOKINGS = 'DELETE_BOOKINGS',
  MANAGE_SLOTS = 'MANAGE_SLOTS'
}

export enum SocialCrmPermissionsEnum {
  VIEW_SOCIAL_CRM = 'VIEW_SOCIAL_CRM',
  CREATE_SOCIAL_CRM = 'CREATE_SOCIAL_CRM',
  EDIT_SOCIAL_CRM = 'EDIT_SOCIAL_CRM',
  DELETE_SOCIAL_CRM = 'DELETE_SOCIAL_CRM'
}

export enum CommissionPermissionsEnum {
  VIEW_COMMISSIONS = 'VIEW_COMMISSIONS',
  CREATE_COMMISSIONS = 'CREATE_COMMISSIONS',
  EDIT_COMMISSIONS = 'EDIT_COMMISSIONS',
  DELETE_COMMISSIONS = 'DELETE_COMMISSIONS'
}

export enum CompetitorPermissionsEnum {
  VIEW_COMPETITORS = 'VIEW_COMPETITORS',
  CREATE_COMPETITORS = 'CREATE_COMPETITORS',
  EDIT_COMPETITORS = 'EDIT_COMPETITORS',
  DELETE_COMPETITORS = 'DELETE_COMPETITORS'
}

export enum CpqPermissionsEnum {
  VIEW_CPQ = 'VIEW_CPQ',
  CREATE_CPQ = 'CREATE_CPQ',
  EDIT_CPQ = 'EDIT_CPQ',
  DELETE_CPQ = 'DELETE_CPQ'
}

export enum AbTestPermissionsEnum {
  VIEW_AB_TESTS = 'VIEW_AB_TESTS',
  CREATE_AB_TESTS = 'CREATE_AB_TESTS',
  EDIT_AB_TESTS = 'EDIT_AB_TESTS',
  DELETE_AB_TESTS = 'DELETE_AB_TESTS'
}

export enum FormBuilderPermissionsEnum {
  VIEW_FORMS = 'VIEW_FORMS',
  CREATE_FORMS = 'CREATE_FORMS',
  EDIT_FORMS = 'EDIT_FORMS',
  DELETE_FORMS = 'DELETE_FORMS',
  VIEW_SUBMISSIONS = 'VIEW_SUBMISSIONS'
}

export enum LoyaltyPermissionsEnum {
  VIEW_LOYALTY = 'VIEW_LOYALTY',
  CREATE_LOYALTY = 'CREATE_LOYALTY',
  EDIT_LOYALTY = 'EDIT_LOYALTY',
  DELETE_LOYALTY = 'DELETE_LOYALTY',
  MANAGE_POINTS = 'MANAGE_POINTS'
}

export enum SurveyPermissionsEnum {
  VIEW_SURVEYS = 'VIEW_SURVEYS',
  CREATE_SURVEYS = 'CREATE_SURVEYS',
  EDIT_SURVEYS = 'EDIT_SURVEYS',
  DELETE_SURVEYS = 'DELETE_SURVEYS',
  VIEW_RESPONSES = 'VIEW_RESPONSES'
}

export enum LiveChatPermissionsEnum {
  VIEW_CONVERSATIONS = 'VIEW_CONVERSATIONS',
  CREATE_CONVERSATIONS = 'CREATE_CONVERSATIONS',
  EDIT_CONVERSATIONS = 'EDIT_CONVERSATIONS',
  DELETE_CONVERSATIONS = 'DELETE_CONVERSATIONS',
  SEND_MESSAGES = 'SEND_MESSAGES'
}

export enum WarehousePermissionsEnum {
  VIEW_WAREHOUSES = 'VIEW_WAREHOUSES',
  CREATE_WAREHOUSES = 'CREATE_WAREHOUSES',
  EDIT_WAREHOUSES = 'EDIT_WAREHOUSES',
  DELETE_WAREHOUSES = 'DELETE_WAREHOUSES',
  MANAGE_ZONES = 'MANAGE_ZONES',
  MANAGE_TRANSFERS = 'MANAGE_TRANSFERS'
}

export enum VendorScorecardPermissionsEnum {
  VIEW_VENDOR_SCORECARDS = 'VIEW_VENDOR_SCORECARDS',
  CREATE_VENDOR_SCORECARDS = 'CREATE_VENDOR_SCORECARDS',
  EDIT_VENDOR_SCORECARDS = 'EDIT_VENDOR_SCORECARDS',
  DELETE_VENDOR_SCORECARDS = 'DELETE_VENDOR_SCORECARDS'
}

export enum WarrantyPermissionsEnum {
  VIEW_WARRANTIES = 'VIEW_WARRANTIES',
  CREATE_WARRANTIES = 'CREATE_WARRANTIES',
  EDIT_WARRANTIES = 'EDIT_WARRANTIES',
  DELETE_WARRANTIES = 'DELETE_WARRANTIES',
  MANAGE_CLAIMS = 'MANAGE_CLAIMS'
}

export enum ShippingPermissionsEnum {
  VIEW_SHIPMENTS = 'VIEW_SHIPMENTS',
  CREATE_SHIPMENTS = 'CREATE_SHIPMENTS',
  EDIT_SHIPMENTS = 'EDIT_SHIPMENTS',
  DELETE_SHIPMENTS = 'DELETE_SHIPMENTS',
  MANAGE_RATES = 'MANAGE_RATES'
}

// ─── E-Commerce Permissions ─────────────────────────────────────────────────

export enum EcCategoryPermissionsEnum {
  VIEW_EC_CATEGORIES = 'VIEW_EC_CATEGORIES',
  CREATE_EC_CATEGORIES = 'CREATE_EC_CATEGORIES',
  EDIT_EC_CATEGORIES = 'EDIT_EC_CATEGORIES',
  DELETE_EC_CATEGORIES = 'DELETE_EC_CATEGORIES'
}

export enum EcCouponPermissionsEnum {
  VIEW_EC_COUPONS = 'VIEW_EC_COUPONS',
  CREATE_EC_COUPONS = 'CREATE_EC_COUPONS',
  EDIT_EC_COUPONS = 'EDIT_EC_COUPONS',
  DELETE_EC_COUPONS = 'DELETE_EC_COUPONS',
  APPLY_EC_COUPONS = 'APPLY_EC_COUPONS'
}

export enum EcReviewPermissionsEnum {
  VIEW_EC_REVIEWS = 'VIEW_EC_REVIEWS',
  CREATE_EC_REVIEWS = 'CREATE_EC_REVIEWS',
  MODERATE_EC_REVIEWS = 'MODERATE_EC_REVIEWS',
  RESPOND_EC_REVIEWS = 'RESPOND_EC_REVIEWS',
  DELETE_EC_REVIEWS = 'DELETE_EC_REVIEWS'
}

export enum EcCartPermissionsEnum {
  VIEW_EC_CARTS = 'VIEW_EC_CARTS',
  MANAGE_EC_CARTS = 'MANAGE_EC_CARTS',
  CONVERT_EC_CARTS = 'CONVERT_EC_CARTS'
}

export enum ManufacturingPermissionsEnum {
  VIEW_MANUFACTURING = 'VIEW_MANUFACTURING',
  CREATE_MANUFACTURING = 'CREATE_MANUFACTURING',
  EDIT_MANUFACTURING = 'EDIT_MANUFACTURING',
  DELETE_MANUFACTURING = 'DELETE_MANUFACTURING'
}

export enum HRPermissionsEnum {
  VIEW_ATTENDANCE = 'VIEW_ATTENDANCE',
  MANAGE_ATTENDANCE = 'MANAGE_ATTENDANCE',
  VIEW_LEAVE_REQUESTS = 'VIEW_LEAVE_REQUESTS',
  CREATE_LEAVE_REQUESTS = 'CREATE_LEAVE_REQUESTS',
  APPROVE_LEAVE_REQUESTS = 'APPROVE_LEAVE_REQUESTS',
  DELETE_LEAVE_REQUESTS = 'DELETE_LEAVE_REQUESTS'
}

export enum PerformancePermissionsEnum {
  VIEW_PERFORMANCE = 'VIEW_PERFORMANCE',
  CREATE_PERFORMANCE = 'CREATE_PERFORMANCE',
  EDIT_PERFORMANCE = 'EDIT_PERFORMANCE',
  DELETE_PERFORMANCE = 'DELETE_PERFORMANCE'
}

export enum RecruitmentPermissionsEnum {
  VIEW_RECRUITMENT = 'VIEW_RECRUITMENT',
  CREATE_RECRUITMENT = 'CREATE_RECRUITMENT',
  EDIT_RECRUITMENT = 'EDIT_RECRUITMENT',
  DELETE_RECRUITMENT = 'DELETE_RECRUITMENT'
}

export enum TrainingPermissionsEnum {
  VIEW_TRAINING = 'VIEW_TRAINING',
  CREATE_TRAINING = 'CREATE_TRAINING',
  EDIT_TRAINING = 'EDIT_TRAINING',
  DELETE_TRAINING = 'DELETE_TRAINING'
}

export enum FinancePermissionsEnum {
  VIEW_EXPENSES = 'VIEW_EXPENSES',
  CREATE_EXPENSES = 'CREATE_EXPENSES',
  EDIT_EXPENSES = 'EDIT_EXPENSES',
  DELETE_EXPENSES = 'DELETE_EXPENSES',
  APPROVE_EXPENSES = 'APPROVE_EXPENSES',
  VIEW_BUDGETS = 'VIEW_BUDGETS',
  CREATE_BUDGETS = 'CREATE_BUDGETS',
  EDIT_BUDGETS = 'EDIT_BUDGETS',
  DELETE_BUDGETS = 'DELETE_BUDGETS',
  VIEW_CATEGORIES = 'VIEW_CATEGORIES',
  MANAGE_CATEGORIES = 'MANAGE_CATEGORIES'
}

export enum CampaignPermissionsEnum {
  VIEW_CAMPAIGNS = 'VIEW_CAMPAIGNS',
  CREATE_CAMPAIGNS = 'CREATE_CAMPAIGNS',
  EDIT_CAMPAIGNS = 'EDIT_CAMPAIGNS',
  DELETE_CAMPAIGNS = 'DELETE_CAMPAIGNS',
  SEND_CAMPAIGNS = 'SEND_CAMPAIGNS',
  MANAGE_TEMPLATES = 'MANAGE_TEMPLATES'
}

export enum ContractPermissionsEnum {
  VIEW_CONTRACTS = 'VIEW_CONTRACTS',
  CREATE_CONTRACTS = 'CREATE_CONTRACTS',
  EDIT_CONTRACTS = 'EDIT_CONTRACTS',
  DELETE_CONTRACTS = 'DELETE_CONTRACTS',
  SEND_FOR_SIGNATURE = 'SEND_FOR_SIGNATURE'
}

export enum ApprovalPermissionsEnum {
  VIEW_APPROVALS = 'VIEW_APPROVALS',
  CREATE_APPROVALS = 'CREATE_APPROVALS',
  MANAGE_WORKFLOWS = 'MANAGE_WORKFLOWS',
  APPROVE_REQUESTS = 'APPROVE_REQUESTS',
  REJECT_REQUESTS = 'REJECT_REQUESTS'
}

export enum InventoryPermissionsEnum {
  VIEW_INVENTORY = 'VIEW_INVENTORY',
  CREATE_INVENTORY = 'CREATE_INVENTORY',
  EDIT_INVENTORY = 'EDIT_INVENTORY',
  DELETE_INVENTORY = 'DELETE_INVENTORY',
  MANAGE_MOVEMENTS = 'MANAGE_MOVEMENTS'
}

export enum MeetingNotePermissionsEnum {
  VIEW_MEETING_NOTES = 'VIEW_MEETING_NOTES',
  CREATE_MEETING_NOTES = 'CREATE_MEETING_NOTES',
  EDIT_MEETING_NOTES = 'EDIT_MEETING_NOTES',
  DELETE_MEETING_NOTES = 'DELETE_MEETING_NOTES'
}

export enum ESignaturePermissionsEnum {
  VIEW_E_SIGNATURES = 'VIEW_E_SIGNATURES',
  CREATE_E_SIGNATURES = 'CREATE_E_SIGNATURES',
  EDIT_E_SIGNATURES = 'EDIT_E_SIGNATURES',
  DELETE_E_SIGNATURES = 'DELETE_E_SIGNATURES',
  SIGN_DOCUMENTS = 'SIGN_DOCUMENTS'
}

// Consolidating all permissions
export const permissions = {
  leads: Object.keys(LeadPermissionsEnum),
  opportunities: Object.keys(OpportunityPermissionsEnum),
  deals: Object.keys(DealPermissionsEnum),
  proposals: Object.keys(ProposalPermissionsEnum),
  projects: Object.keys(ProjectPermissionsEnum),
  vehicles: Object.keys(VehiclePermissionsEnum),
  manpower: Object.keys(ManpowerPermissionsEnum),
  additionalMaterial: Object.keys(AdditionalMaterialPermissionsEnum),
  services: Object.keys(ServicePermissionsEnum),
  assets: Object.keys(AssetPermissionsEnum),
  clients: Object.keys(ClientPermissionsEnum),
  staff: Object.keys(StaffPermissionsEnum),
  roles: Object.keys(RolePermissionsEnum),
  settings: Object.keys(SettingsPermissionsEnum),
  reports: Object.keys(ReportPermissionsEnum),
  leadAndSalesWidgets: Object.keys(LeadAndSalesWidgetsPermissionsEnum),
  projectsAndOperationsWidgets: Object.keys(ProjectsAndOperationsWidgetsPermissionsEnum),
  financialAndBusinessMetricsWidgets: Object.keys(FinancialAndBusinessMetricsWidgetsPermissionsEnum),
  performanceAndHRWidgets: Object.keys(PerformanceAndHRWidgetsPermissionsEnum),
  procurement: Object.keys(ProcurementPermissionsEnum),
  vendors: Object.keys(VendorPermissionsEnum),
  documentTemplates: Object.keys(DocumentTemplatePermissionsEnum),
  invoices: Object.keys(InvoicePermissionsEnum),
  salesOrders: Object.keys(SalesOrderPermissionsEnum),
  subscriptions: Object.keys(SubscriptionPermissionsEnum),
  accounting: Object.keys(AccountingPermissionsEnum),
  payments: Object.keys(PaymentPermissionsEnum),
  support: Object.keys(SupportPermissionsEnum),
  employees: Object.keys(EmployeePermissionsEnum),
  payroll: Object.keys(PayrollPermissionsEnum),
  security: Object.keys(SecurityPermissionsEnum),
  communications: Object.keys(CommunicationPermissionsEnum),
  reportBuilder: Object.keys(ReportBuilderPermissionsEnum),
  integrations: Object.keys(IntegrationPermissionsEnum),
  docBuilder: Object.keys(DocBuilderPermissionsEnum),
  goals: Object.keys(GoalPermissionsEnum),
  bookings: Object.keys(BookingPermissionsEnum),
  socialCrm: Object.keys(SocialCrmPermissionsEnum),
  commissions: Object.keys(CommissionPermissionsEnum),
  competitors: Object.keys(CompetitorPermissionsEnum),
  cpq: Object.keys(CpqPermissionsEnum),
  abTests: Object.keys(AbTestPermissionsEnum),
  formBuilder: Object.keys(FormBuilderPermissionsEnum),
  loyalty: Object.keys(LoyaltyPermissionsEnum),
  surveys: Object.keys(SurveyPermissionsEnum),
  liveChat: Object.keys(LiveChatPermissionsEnum),
  warehouses: Object.keys(WarehousePermissionsEnum),
  vendorScorecards: Object.keys(VendorScorecardPermissionsEnum),
  warranties: Object.keys(WarrantyPermissionsEnum),
  shipping: Object.keys(ShippingPermissionsEnum),
  manufacturing: Object.keys(ManufacturingPermissionsEnum),
  hr: Object.keys(HRPermissionsEnum),
  performance: Object.keys(PerformancePermissionsEnum),
  recruitment: Object.keys(RecruitmentPermissionsEnum),
  training: Object.keys(TrainingPermissionsEnum),
  finance: Object.keys(FinancePermissionsEnum),
  campaigns: Object.keys(CampaignPermissionsEnum),
  contracts: Object.keys(ContractPermissionsEnum),
  approvals: Object.keys(ApprovalPermissionsEnum),
  inventory: Object.keys(InventoryPermissionsEnum),
  ecCategories: Object.keys(EcCategoryPermissionsEnum),
  ecCoupons: Object.keys(EcCouponPermissionsEnum),
  ecReviews: Object.keys(EcReviewPermissionsEnum),
  ecCarts: Object.keys(EcCartPermissionsEnum),
  meetingNotes: Object.keys(MeetingNotePermissionsEnum),
  eSignatures: Object.keys(ESignaturePermissionsEnum)
};

// Function to get all permissions
export function getAllPermissions(): string[] {
  return Object.values(permissions).reduce((total, row) => {
    total.push(...row);
    return total;
  }, []);
}

export function getPermissionsGroupedByName(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const key in permissions) {
    const typedKey = key as keyof typeof permissions;
    grouped[key] = [...permissions[typedKey]];
  }
  return grouped;
}
