/* eslint-disable no-use-before-define */
/* eslint-disable require-await */
export interface Employee {
  id: string;
  employeeNumber: string;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  hireDate: string;
  terminationDate?: string;
  departmentId?: string;
  jobTitle?: string;
  managerId?: string;
  employmentType: string;
  status: string;
  salary?: number;
  salaryFrequency?: string;
  bankName?: string;
  bankAccount?: string;
  iqamaNumber?: string;
  nationalId?: string;
  passportNumber?: string;
  tenantId?: string;
  department?: { id: string; name: string; code: string };
  manager?: { id: string; firstName: string; lastName: string; jobTitle?: string; email?: string };
  directReports?: Employee[];
  documents?: EmployeeDocumentItem[];
  user?: { id: number; name: string; email: string; profilePicture?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeDocumentItem {
  id: string;
  employeeId: string;
  name: string;
  type: string;
  fileUrl: string;
  expiryDate?: string;
  notes?: string;
  employee?: { id: string; firstName: string; lastName: string; employeeNumber: string };
  createdAt?: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  managerId?: string;
  description?: string;
  parent?: { id: string; name: string };
  children?: DepartmentItem[];
  employeeCount?: number;
}

export interface OrgChartNode {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  managerId?: string;
  departmentId?: string;
  status: string;
  department?: { id: string; name: string; code: string };
  children: OrgChartNode[];
}

export const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time', type: 'success' },
  { value: 'PART_TIME', label: 'Part Time', type: 'warning' },
  { value: 'CONTRACT', label: 'Contract', type: '' },
  { value: 'INTERN', label: 'Intern', type: 'info' }
];

export const EMPLOYEE_STATUSES = [
  { value: 'ACTIVE', label: 'Active', type: 'success' },
  { value: 'ON_LEAVE', label: 'On Leave', type: 'warning' },
  { value: 'TERMINATED', label: 'Terminated', type: 'danger' },
  { value: 'PROBATION', label: 'Probation', type: 'info' }
];

export const DOCUMENT_TYPES = [
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'ID', label: 'ID' },
  { value: 'CERTIFICATION', label: 'Certification' },
  { value: 'VISA', label: 'Visa' },
  { value: 'MEDICAL', label: 'Medical' }
];

export const SALARY_FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' }
];

// Employee API
export async function fetchEmployees(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`hr/employees${query}`);
  if (success && body) return body as { docs: Employee[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  const { body, success } = await useApiFetch(`hr/employees/${id}`);
  return success && body ? (body as Employee) : null;
}

export async function createEmployee(data: Partial<Employee>) {
  return useApiFetch('hr/employees', 'POST', data as Record<string, unknown>);
}

export async function updateEmployee(id: string, data: Partial<Employee>) {
  return useApiFetch(`hr/employees/${id}`, 'PUT', data as Record<string, unknown>);
}

// Org Chart
export async function fetchOrgChart(): Promise<OrgChartNode[]> {
  const { body, success } = await useApiFetch('hr/org-chart');
  return success && body ? (body as OrgChartNode[]) : [];
}

// Direct Reports
export async function fetchDirectReports(managerId: string): Promise<Employee[]> {
  const { body, success } = await useApiFetch(`hr/employees/${managerId}/direct-reports`);
  return success && body ? (body as Employee[]) : [];
}

// Departments
export async function fetchDepartments(): Promise<DepartmentItem[]> {
  const { body, success } = await useApiFetch('hr/departments');
  return success && body ? (body as DepartmentItem[]) : [];
}

export async function fetchDepartmentTree(): Promise<DepartmentItem[]> {
  const { body, success } = await useApiFetch('hr/departments/tree');
  return success && body ? (body as DepartmentItem[]) : [];
}

export async function fetchDepartmentById(id: string): Promise<DepartmentItem | null> {
  const { body, success } = await useApiFetch(`hr/departments/${id}`);
  return success && body ? (body as DepartmentItem) : null;
}

export async function createDepartment(data: Partial<DepartmentItem>) {
  return useApiFetch('hr/departments', 'POST', data as Record<string, unknown>);
}

export async function updateDepartment(id: string, data: Partial<DepartmentItem>) {
  return useApiFetch(`hr/departments/${id}`, 'PUT', data as Record<string, unknown>);
}

export async function deleteDepartment(id: string) {
  return useApiFetch(`hr/departments/${id}`, 'DELETE');
}

// Employee Documents
export async function fetchEmployeeDocuments(employeeId: string): Promise<EmployeeDocumentItem[]> {
  const { body, success } = await useApiFetch(`hr/employees/${employeeId}/documents`);
  return success && body ? (body as EmployeeDocumentItem[]) : [];
}

export async function addEmployeeDocument(employeeId: string, data: Partial<EmployeeDocumentItem>) {
  return useApiFetch(`hr/employees/${employeeId}/documents`, 'POST', data as Record<string, unknown>);
}

export async function fetchExpiringDocuments(days: number = 30): Promise<EmployeeDocumentItem[]> {
  const { body, success } = await useApiFetch(`hr/expiring-documents?days=${days}`);
  return success && body ? (body as EmployeeDocumentItem[]) : [];
}

// Helpers
export function getEmployeeStatusType(status: string): string {
  return EMPLOYEE_STATUSES.find(s => s.value === status)?.type || '';
}

export function getEmployeeStatusLabel(status: string): string {
  return EMPLOYEE_STATUSES.find(s => s.value === status)?.label || status;
}

export function getEmploymentTypeLabel(type: string): string {
  return EMPLOYMENT_TYPES.find(t => t.value === type)?.label || type;
}

export function getDocumentTypeLabel(type: string): string {
  return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
}

export function getFullName(employee: { firstName: string; lastName: string }): string {
  return `${employee.firstName} ${employee.lastName}`;
}
