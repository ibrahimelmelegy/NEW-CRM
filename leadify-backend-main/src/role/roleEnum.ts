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
  integrations: Object.keys(IntegrationPermissionsEnum)
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
