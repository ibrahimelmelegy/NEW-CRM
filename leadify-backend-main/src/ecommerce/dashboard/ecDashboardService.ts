import { Op, fn, col, literal } from 'sequelize';
import CatalogProduct from '../../productCatalog/productModel';
import SalesOrder from '../../salesOrder/models/salesOrderModel';
import SalesOrderItem from '../../salesOrder/models/salesOrderItemModel';
import Client from '../../client/clientModel';
import EcCoupon from '../coupon/couponModel';
import EcReview from '../review/reviewModel';
import { EcCart } from '../cart/cartModel';

class EcDashboardService {
  /**
   * Aggregate e-commerce dashboard statistics
   */
  async getDashboardStats(): Promise<unknown> {
    const [
      orderStats,
      totalOrders,
      productCount,
      activeProductCount,
      lowStockCount,
      activeCoupons,
      pendingReviews,
      abandonedCarts,
      totalCarts,
      ordersByStatus,
      topProductsResult,
      recentOrders
    ] = await Promise.all([
      // Revenue stats
      SalesOrder.findOne({
        attributes: [
          [fn('COALESCE', fn('SUM', col('total')), 0), 'totalRevenue'],
          [fn('COALESCE', fn('AVG', col('total')), 0), 'avgOrderValue']
        ],
        raw: true
      }) as unknown,

      // Total orders
      SalesOrder.count(),

      // Total products
      CatalogProduct.count(),

      // Active products
      CatalogProduct.count({ where: { isActive: true } }),

      // Low stock products
      CatalogProduct.count({
        where: {
          isActive: true,
          stockQuantity: { [Op.lte]: literal('"CatalogProduct"."lowStockThreshold"') }
        }
      }),

      // Active coupons
      EcCoupon.count({ where: { status: 'ACTIVE' } }).catch(() => 0),

      // Pending reviews
      EcReview.count({ where: { status: 'PENDING' } }).catch(() => 0),

      // Abandoned carts
      EcCart.count({ where: { status: 'ABANDONED' } }).catch(() => 0),

      // Total carts
      EcCart.count().catch(() => 0),

      // Orders by status
      SalesOrder.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true
      }).catch(() => []),

      // Top selling products (by frequency in order items)
      SalesOrderItem.findAll({
        attributes: [
          'productId',
          [fn('SUM', col('quantity')), 'totalQuantity'],
          [fn('SUM', col('lineTotal')), 'totalRevenue'],
          [fn('COUNT', col('id')), 'orderCount']
        ],
        where: { productId: { [Op.ne]: null } },
        group: ['productId'],
        order: [[fn('SUM', col('lineTotal')), 'DESC']],
        limit: 10,
        raw: true
      }).catch(() => []),

      // Recent orders
      SalesOrder.findAll({
        include: [
          { model: Client, as: 'client', attributes: ['id', 'clientName', 'email'] },
          { model: SalesOrderItem, as: 'items' }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      }).catch(() => [])
    ]);

    // Build orders by status map
    const statusMap: Record<string, number> = {};
    for (const row of ordersByStatus as Record<string, unknown>[]) {
      statusMap[row.status as string] = parseInt(row.count as string, 10);
    }

    // Enrich top products with product details
    const topProducts: unknown[] = [];
    for (const tp of topProductsResult as Record<string, unknown>[]) {
      if (tp.productId) {
        const product = await CatalogProduct.findByPk(tp.productId, {
          attributes: ['id', 'name', 'sku', 'category', 'unitPrice', 'isActive']
        });
        if (product) {
          topProducts.push({
            ...product.toJSON(),
            totalQuantitySold: parseFloat(tp.totalQuantity || 0),
            totalRevenue: parseFloat(tp.totalRevenue || 0),
            orderCount: parseInt(tp.orderCount || 0, 10)
          });
        }
      }
    }

    return {
      totalRevenue: parseFloat(orderStats?.totalRevenue || 0),
      totalOrders,
      avgOrderValue: parseFloat(orderStats?.avgOrderValue || 0),
      productCount,
      activeProductCount,
      lowStockCount,
      activeCoupons,
      pendingReviews,
      abandonedCarts,
      totalCarts,
      convertedCarts: Math.max(totalCarts - abandonedCarts, 0),
      ordersByStatus: statusMap,
      topProducts,
      recentOrders
    };
  }
}

export default new EcDashboardService();
