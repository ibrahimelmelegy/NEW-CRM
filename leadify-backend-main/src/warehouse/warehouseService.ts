import { Op } from 'sequelize';
import { Warehouse, WarehouseZone, StockTransfer } from './warehouseModel';
import { clampPagination } from '../utils/pagination';
import { sequelize } from '../config/db';
import { io } from '../server';

class WarehouseService {
  async createWarehouse(data: any, tenantId?: string) {
    return Warehouse.create({ ...data, tenantId });
  }

  async getWarehouses(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await Warehouse.findAndCountAll({
      where,
      include: [{ model: WarehouseZone, as: 'zones' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getWarehouseById(id: number) {
    return Warehouse.findByPk(id, { include: [{ model: WarehouseZone, as: 'zones' }] });
  }

  async updateWarehouse(id: number, data: any) {
    const item = await Warehouse.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deleteWarehouse(id: number) {
    const item = await Warehouse.findByPk(id);
    if (!item) return false;
    await WarehouseZone.destroy({ where: { warehouseId: id } });
    await item.destroy();
    return true;
  }

  async getZones(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    const { rows, count } = await WarehouseZone.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async createZone(data: any, tenantId?: string) {
    return WarehouseZone.create({ ...data, tenantId });
  }

  async getStockCount(tenantId?: string) {
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    const count = await StockTransfer.count({ where });
    return { count, total: count };
  }

  async deleteZone(id: number) {
    const zone = await WarehouseZone.findByPk(id);
    if (!zone) return false;
    await zone.destroy();
    return true;
  }

  async createTransfer(data: any, tenantId?: string) {
    const transferNumber = `TRF-${Date.now().toString(36).toUpperCase()}`;
    return StockTransfer.create({ ...data, transferNumber, tenantId });
  }

  async getTransfers(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    const { rows, count } = await StockTransfer.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateTransfer(id: number, data: any) {
    const transfer = await StockTransfer.findByPk(id);
    if (!transfer) return null;
    await transfer.update(data);
    return transfer;
  }

  // ─── Business Logic ──────────────────────────────────────────────────────────

  /**
   * Build a stock ledger for a warehouse by replaying all RECEIVED transfers.
   * Returns a map of productName -> net quantity.
   */
  private async buildStockLedger(warehouseId: number): Promise<Map<string, number>> {
    const ledger = new Map<string, number>();

    // Stock coming IN: transfers received at this warehouse
    const inTransfers = await StockTransfer.findAll({
      where: { toWarehouseId: warehouseId, status: 'RECEIVED' }
    });
    for (const t of inTransfers) {
      for (const item of t.items || []) {
        const current = ledger.get(item.productName) || 0;
        ledger.set(item.productName, current + item.quantity);
      }
    }

    // Stock going OUT: transfers received from this warehouse
    const outTransfers = await StockTransfer.findAll({
      where: { fromWarehouseId: warehouseId, status: 'RECEIVED' }
    });
    for (const t of outTransfers) {
      for (const item of t.items || []) {
        const current = ledger.get(item.productName) || 0;
        ledger.set(item.productName, current - item.quantity);
      }
    }

    return ledger;
  }

  /**
   * Update stock levels for a warehouse.
   * items: Array<{ productName, quantity, type: 'IN' | 'OUT' }>
   * Creates internal stock transfer records to track the movement.
   * Validates that OUT operations do not reduce stock below zero.
   */
  async updateStockLevels(warehouseId: number, items: Array<{ productName: string; quantity: number; type: 'IN' | 'OUT' }>) {
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) throw new Error('Warehouse not found');

    // Build current stock from transfer ledger
    const ledger = await this.buildStockLedger(warehouseId);

    // Validate OUT operations
    for (const item of items) {
      if (item.type === 'OUT') {
        const currentStock = ledger.get(item.productName) || 0;
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for "${item.productName}": available ${currentStock}, requested ${item.quantity}`);
        }
      }
    }

    // For IN items, create a transfer TO this warehouse (fromWarehouseId = 0 signals external receipt)
    const inItems = items.filter(i => i.type === 'IN');
    const outItems = items.filter(i => i.type === 'OUT');
    const results: StockTransfer[] = [];

    if (inItems.length > 0) {
      const transferNumber = `ADJ-IN-${Date.now().toString(36).toUpperCase()}`;
      const transfer = await StockTransfer.create({
        transferNumber,
        fromWarehouseId: 0, // external / adjustment
        toWarehouseId: warehouseId,
        items: inItems.map(i => ({ productId: 0, productName: i.productName, quantity: i.quantity })),
        status: 'RECEIVED',
        receivedDate: new Date().toISOString().slice(0, 10),
        notes: 'Stock adjustment — inbound',
        tenantId: warehouse.tenantId
      });
      results.push(transfer);
    }

    if (outItems.length > 0) {
      const transferNumber = `ADJ-OUT-${Date.now().toString(36).toUpperCase()}`;
      const transfer = await StockTransfer.create({
        transferNumber,
        fromWarehouseId: warehouseId,
        toWarehouseId: 0, // external / adjustment
        items: outItems.map(i => ({ productId: 0, productName: i.productName, quantity: i.quantity })),
        status: 'RECEIVED',
        shippedDate: new Date().toISOString().slice(0, 10),
        receivedDate: new Date().toISOString().slice(0, 10),
        notes: 'Stock adjustment — outbound',
        tenantId: warehouse.tenantId
      });
      results.push(transfer);
    }

    // Update currentOccupancy on the warehouse
    const updatedLedger = await this.buildStockLedger(warehouseId);
    let totalQty = 0;
    for (const qty of updatedLedger.values()) totalQty += Math.max(qty, 0);
    await warehouse.update({ currentOccupancy: totalQty });

    try {
      io.emit('warehouse:stock_updated', { warehouseId, currentOccupancy: totalQty, itemCount: items.length });
    } catch {}
    return { transfers: results, currentOccupancy: totalQty };
  }

  /**
   * Process (complete) a stock transfer.
   * Validates current stock at the source warehouse, then marks the transfer RECEIVED,
   * and updates currentOccupancy on both warehouses — all inside a transaction.
   */
  async processTransfer(transferId: number) {
    const transaction = await sequelize.transaction();
    try {
      const transfer = await StockTransfer.findByPk(transferId, { transaction });
      if (!transfer) throw new Error('Transfer not found');
      if (transfer.status === 'RECEIVED') throw new Error('Transfer already completed');
      if (transfer.status === 'CANCELLED') throw new Error('Cannot complete a cancelled transfer');

      // Validate source warehouse has enough stock
      const sourceLedger = await this.buildStockLedger(transfer.fromWarehouseId);
      for (const item of transfer.items || []) {
        const available = sourceLedger.get(item.productName) || 0;
        if (available < item.quantity) {
          throw new Error(`Insufficient stock at source warehouse for "${item.productName}": available ${available}, required ${item.quantity}`);
        }
      }

      // Mark transfer as RECEIVED
      const today = new Date().toISOString().slice(0, 10);
      await transfer.update(
        {
          status: 'RECEIVED',
          receivedDate: today,
          shippedDate: transfer.shippedDate || today
        },
        { transaction }
      );

      // Update currentOccupancy on both warehouses
      const srcLedger = await this.buildStockLedger(transfer.fromWarehouseId);
      let srcTotal = 0;
      for (const qty of srcLedger.values()) srcTotal += Math.max(qty, 0);

      const destLedger = await this.buildStockLedger(transfer.toWarehouseId);
      let destTotal = 0;
      for (const qty of destLedger.values()) destTotal += Math.max(qty, 0);

      await Warehouse.update({ currentOccupancy: srcTotal }, { where: { id: transfer.fromWarehouseId }, transaction });
      await Warehouse.update({ currentOccupancy: destTotal }, { where: { id: transfer.toWarehouseId }, transaction });

      await transaction.commit();
      try {
        io.emit('warehouse:transfer_processed', {
          transferId,
          fromWarehouseId: transfer.fromWarehouseId,
          toWarehouseId: transfer.toWarehouseId,
          status: 'RECEIVED'
        });
      } catch {}
      return transfer;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Return products whose stock quantity is at or below the given threshold.
   * Scans all warehouses for the tenant.
   */
  async getLowStockAlerts(tenantId: string, threshold = 10) {
    const warehouses = await Warehouse.findAll({ where: { tenantId, status: 'ACTIVE' } });
    const alerts: Array<{ warehouseId: number; warehouseName: string; productName: string; quantity: number }> = [];

    for (const wh of warehouses) {
      const ledger = await this.buildStockLedger(wh.id);
      for (const [productName, qty] of ledger.entries()) {
        if (qty <= threshold && qty >= 0) {
          alerts.push({ warehouseId: wh.id, warehouseName: wh.name, productName, quantity: qty });
        }
      }
    }

    alerts.sort((a, b) => a.quantity - b.quantity);
    if (alerts.length > 0) {
      try {
        io.emit('warehouse:low_stock_alert', { tenantId, threshold, alertCount: alerts.length, alerts: alerts.slice(0, 10) });
      } catch {}
    }
    return alerts;
  }

  /**
   * Get a summary of stock for a single warehouse:
   * total unique items, total quantity, items grouped by zone (via transfers), low stock count.
   */
  async getStockSummary(warehouseId: number) {
    const warehouse = await Warehouse.findByPk(warehouseId, {
      include: [{ model: WarehouseZone, as: 'zones' }]
    });
    if (!warehouse) throw new Error('Warehouse not found');

    const ledger = await this.buildStockLedger(warehouseId);
    let totalItems = 0;
    let totalQuantity = 0;
    let lowStockCount = 0;
    const items: Array<{ productName: string; quantity: number }> = [];

    for (const [productName, qty] of ledger.entries()) {
      const safeQty = Math.max(qty, 0);
      totalItems++;
      totalQuantity += safeQty;
      if (safeQty <= 10) lowStockCount++;
      items.push({ productName, quantity: safeQty });
    }

    items.sort((a, b) => a.quantity - b.quantity);

    return {
      warehouseId,
      warehouseName: warehouse.name,
      capacity: warehouse.capacity,
      currentOccupancy: warehouse.currentOccupancy,
      totalUniqueItems: totalItems,
      totalQuantity,
      lowStockCount,
      zones: (warehouse.zones || []).map(z => ({ id: z.id, name: z.name, type: z.type, capacity: z.capacity })),
      items
    };
  }

  /**
   * Pick & pack operation: validates stock availability, creates outbound transfer records
   * for each item, decrements stock, and returns a packing slip summary.
   * items: Array<{ productName, quantity }>
   * orderId is an optional reference to a sales order or shipment.
   */
  async pickAndPack(warehouseId: number, items: Array<{ productName: string; quantity: number }>, orderId?: string) {
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) throw new Error('Warehouse not found');

    const ledger = await this.buildStockLedger(warehouseId);

    // Validate stock for all items before committing
    const shortages: Array<{ productName: string; requested: number; available: number }> = [];
    for (const item of items) {
      const available = ledger.get(item.productName) || 0;
      if (available < item.quantity) {
        shortages.push({ productName: item.productName, requested: item.quantity, available });
      }
    }
    if (shortages.length > 0) {
      throw Object.assign(new Error('Insufficient stock for pick & pack'), { shortages });
    }

    // Create an outbound adjustment transfer to record the pick
    const transferNumber = `PICK-${Date.now().toString(36).toUpperCase()}`;
    const _transfer = await StockTransfer.create({
      transferNumber,
      fromWarehouseId: warehouseId,
      toWarehouseId: 0, // outbound fulfillment
      items: items.map(i => ({ productId: 0, productName: i.productName, quantity: i.quantity })),
      status: 'RECEIVED',
      shippedDate: new Date().toISOString().slice(0, 10),
      receivedDate: new Date().toISOString().slice(0, 10),
      notes: orderId ? `Pick & Pack for order ${orderId}` : 'Pick & Pack fulfillment',
      tenantId: warehouse.tenantId
    });

    // Update warehouse occupancy
    const updatedLedger = await this.buildStockLedger(warehouseId);
    let totalQty = 0;
    for (const qty of updatedLedger.values()) totalQty += Math.max(qty, 0);
    await warehouse.update({ currentOccupancy: totalQty });

    const packingSlip = {
      transferNumber,
      warehouseId,
      warehouseName: warehouse.name,
      orderId: orderId || null,
      items: items.map(i => ({ productName: i.productName, quantity: i.quantity })),
      totalItems: items.length,
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      packedAt: new Date().toISOString()
    };

    try {
      io.emit('warehouse:pick_pack_completed', packingSlip);
    } catch {}
    return packingSlip;
  }

  /**
   * Return inbound and outbound transfer movements for a warehouse within a date range.
   */
  async getInventoryMovement(warehouseId: number, dateFrom: string, dateTo: string) {
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) throw new Error('Warehouse not found');

    const dateFilter = { [Op.between]: [dateFrom, dateTo] as [string, string] };

    const inbound = await StockTransfer.findAll({
      where: {
        toWarehouseId: warehouseId,
        status: 'RECEIVED',
        receivedDate: dateFilter
      },
      order: [['receivedDate', 'ASC']]
    });

    const outbound = await StockTransfer.findAll({
      where: {
        fromWarehouseId: warehouseId,
        status: 'RECEIVED',
        shippedDate: dateFilter
      },
      order: [['shippedDate', 'ASC']]
    });

    // Aggregate quantities
    let totalIn = 0;
    let totalOut = 0;
    for (const t of inbound) for (const item of t.items || []) totalIn += item.quantity;
    for (const t of outbound) for (const item of t.items || []) totalOut += item.quantity;

    return {
      warehouseId,
      warehouseName: warehouse.name,
      dateRange: { from: dateFrom, to: dateTo },
      totalInbound: totalIn,
      totalOutbound: totalOut,
      netChange: totalIn - totalOut,
      inboundTransfers: inbound,
      outboundTransfers: outbound
    };
  }
}
export default new WarehouseService();
