import dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import Asset from '../asset/assetModel';
import Client from '../client/clientModel';
import DealDelivery from '../deal/model/dealDeliveryMode copy';
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
import { Vehicle } from '../vehicle/vahicle.model';
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
import OpportunityUsers from '../opportunity/model/oppotyunity_UsersModel';
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
import Sequence from '../sequences/sequenceModel';
import { SequenceEnrollment } from '../sequences/sequenceModel';
import CatalogProduct from '../productCatalog/productModel';
import PriceRule from '../productCatalog/priceRuleModel';
import QuoteLine from '../productCatalog/quoteLineModel';

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
    ProposalLog,
    MaterialsAdditionalMaterialItem,
    ProjectMaterial,
    Role,
    MaterialsAdditionalMaterialItem,
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
    QuoteLine
  ], // Path to your models
  logging: process.env.NODE_ENV !== 'production' ? console.log : false
});

export { sequelize };
