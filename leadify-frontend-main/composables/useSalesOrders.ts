import { ElNotification } from 'element-plus';

function handleError(message: string) {
  ElNotification({
    type: 'error',
    title: 'Error',
    message
  });
}

function handleSuccess(message: string) {
  ElNotification({
    type: 'success',
    title: 'Success',
    message
  });
}

export enum SalesOrderStatusEnum {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export const salesOrderStatusOptions = [
  { label: 'Draft', value: SalesOrderStatusEnum.DRAFT },
  { label: 'Confirmed', value: SalesOrderStatusEnum.CONFIRMED },
  { label: 'Processing', value: SalesOrderStatusEnum.PROCESSING },
  { label: 'Shipped', value: SalesOrderStatusEnum.SHIPPED },
  { label: 'Delivered', value: SalesOrderStatusEnum.DELIVERED },
  { label: 'Cancelled', value: SalesOrderStatusEnum.CANCELLED }
];

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  REFUNDED = 'REFUNDED'
}

export const paymentStatusOptions = [
  { label: 'Pending', value: PaymentStatusEnum.PENDING },
  { label: 'Paid', value: PaymentStatusEnum.PAID },
  { label: 'Partial', value: PaymentStatusEnum.PARTIAL },
  { label: 'Refunded', value: PaymentStatusEnum.REFUNDED }
];

export enum FulfillmentStatusEnum {
  PENDING = 'PENDING',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED'
}

export const fulfillmentStatusOptions = [
  { label: 'Pending', value: FulfillmentStatusEnum.PENDING },
  { label: 'Packed', value: FulfillmentStatusEnum.PACKED },
  { label: 'Shipped', value: FulfillmentStatusEnum.SHIPPED },
  { label: 'Delivered', value: FulfillmentStatusEnum.DELIVERED }
];

export interface SalesOrderItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
}

export interface Fulfillment {
  id?: string;
  salesOrderId?: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
  shippedDate?: string;
  deliveredDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface SalesOrder {
  id?: string;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  dealId?: string;
  clientId?: string;
  createdBy?: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  total?: number;
  currency?: string;
  paymentTerms?: string;
  shippingAddress?: string;
  notes?: string;
  items?: SalesOrderItem[];
  fulfillments?: Fulfillment[];
  client?: unknown;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface Pagination {
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SalesOrderListResult {
  orders: SalesOrder[];
  pagination: Pagination;
}

/**
 * Fetch paginated list of sales orders
 */
export async function getSalesOrders(query?: string): Promise<SalesOrderListResult> {
  const endpoint = query ? `sales-orders?${query}` : 'sales-orders';
  const { body, success } = await useApiFetch(endpoint);
  if (success && body) {
    return {
      orders: body.docs || [],
      pagination: body.pagination || { totalItems: 0, page: 1, limit: 10, totalPages: 1 }
    };
  }
  return { orders: [], pagination: { totalItems: 0, page: 1, limit: 10, totalPages: 1 } };
}

/**
 * Fetch a single sales order by ID
 */
export async function getSalesOrderById(id: string): Promise<SalesOrder> {
  const { body, success } = await useApiFetch(`sales-orders/${id}`);
  if (success && body) return body;
  return {} as SalesOrder;
}

/**
 * Create a new sales order
 */
export async function createSalesOrder(data: unknown): Promise<SalesOrder | null> {
  try {
    const response = await useApiFetch('sales-orders', 'POST', data);

    if (response?.success) {
      handleSuccess('Sales order created successfully');
      return response.body;
    } else {
      handleError(response?.message || 'Failed to create sales order');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Update an existing sales order
 */
export async function updateSalesOrder(id: string, data: unknown): Promise<SalesOrder | null> {
  try {
    const response = await useApiFetch(`sales-orders/${id}`, 'PUT', data);

    if (response?.success) {
      handleSuccess('Sales order updated successfully');
      return response.body;
    } else {
      handleError(response?.message || 'Failed to update sales order');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Update the status of a sales order
 */
export async function updateSalesOrderStatus(id: string, status: string): Promise<SalesOrder | null> {
  try {
    const response = await useApiFetch(`sales-orders/${id}/status`, 'PATCH', { status });

    if (response?.success) {
      handleSuccess(`Order status updated to ${status}`);
      return response.body;
    } else {
      handleError(response?.message || 'Failed to update order status');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Update the payment status of a sales order
 */
export async function updatePaymentStatus(id: string, paymentStatus: string): Promise<SalesOrder | null> {
  try {
    const response = await useApiFetch(`sales-orders/${id}/payment-status`, 'PATCH', { paymentStatus });

    if (response?.success) {
      handleSuccess(`Payment status updated to ${paymentStatus}`);
      return response.body;
    } else {
      handleError(response?.message || 'Failed to update payment status');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Convert a deal to a sales order
 */
export async function convertDealToOrder(dealId: string): Promise<SalesOrder | null> {
  try {
    const response = await useApiFetch(`sales-orders/from-deal/${dealId}`, 'POST', {});

    if (response?.success) {
      handleSuccess('Deal converted to sales order successfully');
      return response.body;
    } else {
      handleError(response?.message || 'Failed to convert deal to order');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Add fulfillment to a sales order
 */
export async function addFulfillment(orderId: string, data: unknown): Promise<Fulfillment | null> {
  try {
    const response = await useApiFetch(`sales-orders/${orderId}/fulfillment`, 'POST', data);

    if (response?.success) {
      handleSuccess('Fulfillment added successfully');
      return response.body;
    } else {
      handleError(response?.message || 'Failed to add fulfillment');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Update a fulfillment record
 */
export async function updateFulfillment(orderId: string, fid: string, data: unknown): Promise<Fulfillment | null> {
  try {
    const response = await useApiFetch(`sales-orders/${orderId}/fulfillment/${fid}`, 'PATCH', data);

    if (response?.success) {
      handleSuccess('Fulfillment updated successfully');
      return response.body;
    } else {
      handleError(response?.message || 'Failed to update fulfillment');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Delete a sales order
 */
export async function deleteSalesOrder(id: string): Promise<boolean> {
  try {
    const response = await useApiFetch(`sales-orders/${id}`, 'DELETE');

    if (response?.success) {
      handleSuccess('Sales order deleted successfully');
      return true;
    } else {
      handleError(response?.message || 'Failed to delete sales order');
      return false;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Fetch order analytics
 */
export async function getSalesOrderAnalytics(query?: string) {
  const endpoint = query ? `sales-orders/analytics?${query}` : 'sales-orders/analytics';
  const { body, success } = await useApiFetch(endpoint);
  if (success && body) {
    return body;
  }
  return null;
}

/**
 * Fetch orders for a specific client
 */
export async function getClientOrders(clientId: string, query?: string): Promise<SalesOrderListResult> {
  const endpoint = query ? `sales-orders/client/${clientId}?${query}` : `sales-orders/client/${clientId}`;
  const { body, success } = await useApiFetch(endpoint);
  if (success && body) {
    return {
      orders: body.docs || [],
      pagination: body.pagination || { totalItems: 0, page: 1, limit: 10, totalPages: 1 }
    };
  }
  return { orders: [], pagination: { totalItems: 0, page: 1, limit: 10, totalPages: 1 } };
}
