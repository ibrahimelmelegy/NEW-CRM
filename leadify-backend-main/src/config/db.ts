import dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import Asset from '../asset/assetModel';
import Client from '../client/clientModel';
import CompanyNote from '../client/companyNoteModel';
import DealDelivery from '../deal/model/dealDeliveryModel';
import Deal from '../deal/model/dealModel';
import Invoice from '../deal/model/invoiceMode';
import Lead from '../lead/leadModel';
import Manpower from '../manpower/manpowerModel';
import { AdditionalMaterial, AdditionalMaterialItem, MaterialsAdditionalMaterialItem } from '../additionalMaterial/model/additional-material.model';
import Notification from '../notification/notificationModel';
import Opportunity from '../opportunity/opportunityModel';
import EtimadProject from '../project/models/etimadProjectModel';
import Project from '../project/models/projectModel';
import ProjectAsset from '../projectAsset/projectAssetModel';
import ProjectManpower from '../projectManpower/projectManpowerModel';
import Proposal from '../proposal/models/proposalModel';
import ProposalUsers from '../proposal/models/proposal_UsersModel';
import ProposalContent from '../proposalContent/proposalContentModel';
import ProposalFinanceTable from '../proposalFinanceTable/proposalFinanceTableModel';
import Service from '../service/serviceModel';
import { Uploader } from '../uploader/uploader.model';
import LoginFailure from '../user/models/loginFailureModel';
import PasswordResetLog from '../user/models/passwordResetLogModel';
import ResetToken from '../user/models/resetTokenModel';
import Session from '../user/models/sessionModel';
import User from '../user/userModel';
import { Vehicle } from '../vehicle/vehicle.model';
import ProposalLog from '../proposalLog/proposalLogModel';
import ProposalFinanceTableItem from '../ProposalFinanceTableItem/proposalFinanceTableItemModel';
import ProjectMaterial from '../project/models/peojectMaterial';
import Role from '../role/roleModel';
import ProjectAdditionalMaterialItem from '../project/models/projectAdditionalMaterialItem';
import { DealActivity } from '../activity-logs/model/dealActivities';
import { OpportunityActivity } from '../activity-logs/model/opportunityActivities';
import { LeadActivity } from '../activity-logs/model/leadActivities';
import { ClientActivity } from '../activity-logs/model/clientActivities';
import { ProjectActivity } from '../activity-logs/model/projectActivities';
import Setting from '../setting/settingModel';
import LeadUsers from '../lead/model/lead_UsersModel';
import DealUsers from '../deal/model/deal_UsersModel';
import OpportunityUsers from '../opportunity/model/opportunity_UsersModel';
import ClientUsers from '../client/client_UsersModel';
import UserProjects from '../project/models/projectUsersModel';
import { Material } from '../material/material.model';
import DailyTask from '../dailyTask/dailyTaskModel';
import Vendor from '../vendor/vendorModel';
import PurchaseOrder from '../procurement/models/purchaseOrderModel';
import PurchaseOrderItem from '../procurement/models/purchaseOrderItemModel';
import { VendorActivity } from '../activity-logs/model/vendorActivities';
import { PurchaseOrderActivity } from '../activity-logs/model/purchaseOrderActivities';
import RFQ from '../procurement/models/rfqModel';
import RFQItem from '../procurement/models/rfqItemModel';
import RFQVendor from '../procurement/models/rfqVendorModel';
import RFQVendorItem from '../procurement/models/rfqVendorItemModel';
import Integration from '../integration/integrationModel';
import Message from '../messaging/messagingModel';
import CustomField from '../customField/customFieldModel';
import CustomFieldValue from '../customField/customFieldValueModel';
import Webhook from '../webhook/webhookModel';
import TimeEntry from '../timeTracking/timeEntryModel';
import SavedReport from '../reports/reportModel';
import WorkflowRule from '../workflow/workflowModel';
import WorkflowExecution from '../workflow/workflowExecutionModel';
import Campaign from '../campaign/campaignModel';
import CampaignRecipient from '../campaign/campaignRecipientModel';
import EmailTemplate from '../campaign/emailTemplateModel';
import Contract from '../contract/contractModel';
import PortalUser from '../portal/portalUserModel';
import SupportTicket from '../portal/supportTicketModel';
import DocumentTemplate from '../documentTemplate/documentTemplateModel';
import KBArticle from '../knowledgeBase/kbArticleModel';
import Attendance from '../hr/attendanceModel';
import LeaveRequest from '../hr/leaveRequestModel';
import ExpenseCategory from '../finance/expenseCategoryModel';
import CalendarEvent from '../calendar/calendarEventModel';
import Expense from '../finance/expenseModel';
import Budget from '../finance/budgetModel';
import FieldCheckIn from '../fieldOps/checkInModel';
import Achievement from '../gamification/achievementModel';
import UserPoints from '../gamification/userPointsModel';
import UserStreak from '../gamification/streakModel';
import Challenge from '../gamification/challengeModel';
import UserChallenge from '../gamification/userChallengeModel';
import Currency from '../currency/currencyModel';
import TaxRule from '../currency/taxRuleModel';
import Product from '../inventory/productModel';
import StockMovement from '../inventory/stockMovementModel';
import DocumentFolder from '../documents/documentFolderModel';
import DocumentFile from '../documents/documentFileModel';
import ApprovalWorkflow from '../approval/approvalWorkflowModel';
import ApprovalRequest from '../approval/approvalRequestModel';
import Comment from '../comments/commentModel';
import Attachment from '../attachments/attachmentModel';
import AuditTrail from '../audit/auditModel';
import Task from '../tasks/taskModel';
import FocusSession from '../tasks/focusSessionModel';
import DailyHabit from '../tasks/dailyHabitModel';
import VirtualRoom from '../virtualOffice/virtualRoomModel';
import BOM from '../manufacturing/bomModel';
import BOMItem from '../manufacturing/bomItemModel';
import WorkOrder from '../manufacturing/workOrderModel';
import QualityCheck from '../manufacturing/qualityCheckModel';
import ZatcaInvoice from '../zatca/zatcaModel';
import ZakaatAssessment from '../zakaat/zakaatModel';
import SavedView from '../savedViews/savedViewModel';
import SyncLog from '../integrations/erpnext/syncLogModel';
import { LeadScoringRule, EntityScore } from '../leadScoring/leadScoringModel';
import DuplicateSet from '../duplicateDetection/duplicateModel';
import NotificationPreference from '../notification/notificationPreferenceModel';
import { SLAPolicy, SLAInstance } from '../sla/slaModel';
import Dashboard from '../dashboard/dashboardModel';
import CustomReport from '../reports/customReportModel';
import TwoFactorAuth from '../security/twoFactorModel';
import FieldPermission from '../security/fieldPermissionModel';
import { DataSharingRule, RecordShare } from '../security/dataShareModel';
import PipelineStage from '../pipelineConfig/pipelineConfigModel';
import Territory from '../territory/territoryModel';
import ForecastPeriod from '../forecasting/forecastModel';
import EmailAccount from '../emailIntegration/emailAccountModel';
import EmailMessage from '../emailIntegration/emailMessageModel';
import EmailTracking from '../emailIntegration/emailTrackingModel';
import ComposerTemplate from '../emailIntegration/emailTemplateModel';
import Sequence from '../sequences/sequenceModel';
import { SequenceEnrollment } from '../sequences/sequenceModel';
import CatalogProduct from '../productCatalog/productModel';
import PriceRule from '../productCatalog/priceRuleModel';
import QuoteLine from '../productCatalog/quoteLineModel';
import Playbook from '../playbook/playbookModel';
// ERP Module Models
import InvoiceLineItem from '../invoice/models/invoiceLineItemModel';
import CreditNote from '../invoice/models/creditNoteModel';
import Payment from '../payment/models/paymentModel';
import PaymentReminder from '../payment/models/paymentReminderModel';
import Employee from '../hr/models/employeeModel';
import Department from '../hr/models/departmentModel';
import EmployeeDocument from '../hr/models/employeeDocumentModel';
import SalaryStructure from '../payroll/models/salaryStructureModel';
import PayrollRun from '../payroll/models/payrollRunModel';
import Payslip from '../payroll/models/payslipModel';
import EndOfService from '../payroll/models/endOfServiceModel';
import ChartOfAccounts from '../accounting/models/chartOfAccountsModel';
import JournalEntry from '../accounting/models/journalEntryModel';
import JournalEntryLine from '../accounting/models/journalEntryLineModel';
import FiscalYear from '../accounting/models/fiscalYearModel';
import SalesOrder from '../salesOrder/models/salesOrderModel';
import SalesOrderItem from '../salesOrder/models/salesOrderItemModel';
import Fulfillment from '../salesOrder/models/fulfillmentModel';
import Ticket from '../support/models/ticketModel';
import TicketMessage from '../support/models/ticketMessageModel';
import TicketCategory from '../support/models/ticketCategoryModel';
import CannedResponse from '../support/models/cannedResponseModel';
import SLAConfig from '../support/models/slaConfigModel';
import SubscriptionPlan from '../subscription/models/subscriptionPlanModel';
import CustomerSubscription from '../subscription/models/customerSubscriptionModel';
import SubscriptionEvent from '../subscription/models/subscriptionEventModel';
// Security Models
import LoginHistory from '../security/models/loginHistoryModel';
import IPWhitelist from '../security/models/ipWhitelistModel';
// Communication Models
import CommActivity from '../communication/models/activityModel';
import CommCallLog from '../communication/models/callLogModel';
import CommMeetingNote from '../communication/models/meetingNoteModel';
import DocumentSignature from '../portal/models/signatureModel';
// Integration Hub Models
import IntegrationConfig from '../integration/models/integrationConfigModel';
import OutgoingWebhook from '../integration/models/outgoingWebhookModel';
// DocBuilder Models
import DocBuilderDocument from '../docBuilder/models/docBuilderModel';
import DocBuilderVersion from '../docBuilder/models/docBuilderVersionModel';
// SaaS Models
import Tenant from '../tenant/tenantModel';
// ─── New Module Models ────────────────────────────────────────────────────────
// HR Extensions
import PerformanceReview from '../hr/performance/performanceModel';
import { JobPosting, Applicant } from '../hr/recruitment/recruitmentModel';
import { TrainingProgram, TrainingEnrollment } from '../hr/training/trainingModel';
// Sales Extensions
import Commission from '../commission/commissionModel';
import Competitor from '../competitor/competitorModel';
import CompetitorDeal from '../competitor/competitorDealModel';
import { PriceBook, PriceBookEntry, CpqQuote, PricingRule } from '../cpq/cpqModel';
// Marketing Extensions
import ABTest from '../abTesting/abTestModel';
import { FormTemplate, FormSubmission } from '../formBuilder/formBuilderModel';
import { LoyaltyProgram, LoyaltyPoints } from '../loyalty/loyaltyModel';
import SocialProfile, { SocialPost } from '../socialCrm/socialCrmModel';
import { Survey, SurveyResponse } from '../survey/surveyModel';
// Communications Extensions
import { ChatConversation, ChatMessage } from '../liveChat/liveChatModel';
import { BookingSlot, Booking, BookingPage } from '../booking/bookingModel';
// Warehouse
import { Warehouse, WarehouseZone, StockTransfer } from '../warehouse/warehouseModel';
// Vendor Scorecard
import VendorScorecard from '../vendorScorecard/vendorScorecardModel';
// After-Sales
import { Warranty, WarrantyClaim } from '../warranty/warrantyModel';
import { Shipment, ShippingRate } from '../shipping/shippingModel';
import Goal from '../goals/goalModel';
// E-Commerce Models
import EcCategory from '../ecommerce/category/categoryModel';
import EcCoupon from '../ecommerce/coupon/couponModel';
import EcReview from '../ecommerce/review/reviewModel';
import { EcCart, EcCartItem } from '../ecommerce/cart/cartModel';
import MeetingNote from '../meetingNote/meetingNoteModel';
import ESignature from '../eSignature/eSignatureModel';
// WhatsApp Models
import { WhatsAppContact, WhatsAppMessage, WhatsAppTemplate } from '../whatsapp/whatsappModel';
// Attribution / Cart Recovery / CLV / Compliance / Segmentation / Social Listening / Usage Billing
import Touchpoint from '../attributionModeling/touchpointModel';
import AbandonedCart from '../cartRecovery/abandonedCartModel';
import ClvRecord from '../clvAnalytics/clvModel';
import ConsentRecord from '../complianceManager/consentRecordModel';
import DataRequest from '../complianceManager/dataRequestModel';
import Segment from '../segmentation/segmentModel';
import SocialMention from '../socialListening/socialMentionModel';
import UsageMeter from '../usageBilling/usageMeterModel';
import UsageRecord from '../usageBilling/usageRecordModel';
import AccountPlan from '../accountPlanning/accountPlanModel';
import Stakeholder from '../accountPlanning/stakeholderModel';
import DemandForecast from '../demandForecasting/forecastModel';
import { registerTenantHooks } from './tenantHooks';

dotenv.config();

// Validate environment variables
const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT) {
  throw new Error('Missing database environment variables');
}

// Initialize Sequelize with types
const sequelize = new Sequelize({
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  dialect: 'postgres',
  models: [
    User,
    Session,
    ResetToken,
    PasswordResetLog,
    LoginFailure,
    Lead,
    Notification,
    Opportunity,
    Deal,
    Invoice,
    DealDelivery,
    Manpower,
    Vehicle,
    AdditionalMaterial,
    AdditionalMaterialItem,
    Service,
    Asset,
    Uploader,
    Project,
    ProjectManpower,
    ProjectAsset,
    Proposal,
    ProposalContent,
    ProposalFinanceTable,
    ProposalFinanceTableItem,
    EtimadProject,
    Material,
    ProposalUsers,
    Client,
    CompanyNote,
    ProposalLog,
    MaterialsAdditionalMaterialItem,
    ProjectMaterial,
    Role,
    ProjectAdditionalMaterialItem,
    DealActivity,
    OpportunityActivity,
    LeadActivity,
    ClientActivity,
    ProjectActivity,
    Setting,
    LeadUsers,
    DealUsers,
    OpportunityUsers,
    ClientUsers,
    UserProjects,
    DailyTask,
    Vendor,
    PurchaseOrder,
    PurchaseOrderItem,
    VendorActivity,
    PurchaseOrderActivity,
    RFQ,
    RFQItem,
    RFQVendor,
    RFQVendorItem,
    Integration,
    Message,
    CustomField,
    CustomFieldValue,
    Webhook,
    TimeEntry,
    SavedReport,
    WorkflowRule,
    WorkflowExecution,
    Campaign,
    CampaignRecipient,
    EmailTemplate,
    Contract,
    PortalUser,
    SupportTicket,
    DocumentTemplate,
    KBArticle,
    Attendance,
    LeaveRequest,
    ExpenseCategory,
    Expense,
    Budget,
    CalendarEvent,
    FieldCheckIn,
    Achievement,
    UserPoints,
    UserStreak,
    Challenge,
    UserChallenge,
    Currency,
    TaxRule,
    Product,
    StockMovement,
    DocumentFolder,
    DocumentFile,
    ApprovalWorkflow,
    ApprovalRequest,
    Comment,
    Attachment,
    AuditTrail,
    Task,
    ZatcaInvoice,
    ZakaatAssessment,
    SavedView,
    SyncLog,
    LeadScoringRule,
    EntityScore,
    DuplicateSet,
    NotificationPreference,
    SLAPolicy,
    SLAInstance,
    Dashboard,
    CustomReport,
    TwoFactorAuth,
    FieldPermission,
    DataSharingRule,
    RecordShare,
    PipelineStage,
    Territory,
    ForecastPeriod,
    EmailAccount,
    EmailMessage,
    EmailTracking,
    Sequence,
    SequenceEnrollment,
    CatalogProduct,
    PriceRule,
    QuoteLine,
    ComposerTemplate,
    Playbook,
    SalesOrder,
    SalesOrderItem,
    Fulfillment,
    Ticket,
    TicketMessage,
    TicketCategory,
    CannedResponse,
    SLAConfig,
    SubscriptionPlan,
    CustomerSubscription,
    SubscriptionEvent,
    InvoiceLineItem,
    CreditNote,
    Payment,
    PaymentReminder,
    Employee,
    Department,
    EmployeeDocument,
    SalaryStructure,
    PayrollRun,
    Payslip,
    EndOfService,
    ChartOfAccounts,
    JournalEntry,
    JournalEntryLine,
    FiscalYear,
    LoginHistory,
    IPWhitelist,
    CommActivity,
    CommCallLog,
    CommMeetingNote,
    DocumentSignature,
    IntegrationConfig,
    OutgoingWebhook,
    Tenant,
    FocusSession,
    DailyHabit,
    VirtualRoom,
    BOM,
    BOMItem,
    WorkOrder,
    QualityCheck,
    DocBuilderDocument,
    DocBuilderVersion,
    // ─── New Module Models ─────────────────────────────────────────────────
    PerformanceReview,
    JobPosting,
    Applicant,
    TrainingProgram,
    TrainingEnrollment,
    Commission,
    Competitor,
    CompetitorDeal,
    PriceBook,
    PriceBookEntry,
    CpqQuote,
    PricingRule,
    ABTest,
    FormTemplate,
    FormSubmission,
    LoyaltyProgram,
    LoyaltyPoints,
    SocialProfile,
    SocialPost,
    Survey,
    SurveyResponse,
    ChatConversation,
    ChatMessage,
    BookingSlot,
    Booking,
    BookingPage,
    Warehouse,
    WarehouseZone,
    StockTransfer,
    VendorScorecard,
    Warranty,
    WarrantyClaim,
    Shipment,
    ShippingRate,
    Goal,
    // E-Commerce Models
    EcCategory,
    EcCoupon,
    EcReview,
    EcCart,
    EcCartItem,
    // Meeting Notes & E-Signatures
    MeetingNote,
    ESignature,
    // WhatsApp
    WhatsAppContact,
    WhatsAppMessage,
    WhatsAppTemplate,
    // Attribution Modeling / Cart Recovery / CLV / Compliance / Segmentation / Social Listening / Usage Billing
    Touchpoint,
    AbandonedCart,
    ClvRecord,
    ConsentRecord,
    DataRequest,
    Segment,
    SocialMention,
    UsageMeter,
    UsageRecord,
    // Account Planning & Demand Forecasting
    AccountPlan,
    Stakeholder,
    DemandForecast
  ], // Path to your models
  logging: process.env.NODE_ENV !== 'production' ? console.log : false
});

// Register automatic tenant scoping hooks on all models with a tenantId column
registerTenantHooks(sequelize);

export { sequelize };
