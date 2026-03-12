import { Op } from 'sequelize';
import { EcCart, EcCartItem, CartStatusEnum } from './cartModel';
import CatalogProduct from '../../productCatalog/productModel';
import Client from '../../client/clientModel';
import { clampPagination } from '../../utils/pagination';

class CartService {
  async getCarts(query: Record<string, unknown>): Promise<unknown> {
    const { page, limit, offset } = clampPagination(query);
    const { clientId, status } = query;

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const { rows: docs, count: totalItems } = await EcCart.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Client, as: 'client' },
        {
          model: EcCartItem,
          as: 'items',
          include: [{ model: CatalogProduct, as: 'product' }]
        }
      ],
      distinct: true
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async getCartById(id: string): Promise<unknown> {
    const cart = await EcCart.findByPk(id, {
      include: [
        { model: Client, as: 'client' },
        {
          model: EcCartItem,
          as: 'items',
          include: [{ model: CatalogProduct, as: 'product' }]
        }
      ]
    });
    if (!cart) throw new Error('Cart not found');

    const items = cart.items || [];
    const subtotal = items.reduce((sum, item) => {
      return sum + Number(item.quantity) * Number(item.unitPrice);
    }, 0);

    return {
      ...cart.toJSON(),
      subtotal: Number(subtotal.toFixed(2)),
      total: Number((subtotal - Number(cart.discountAmount || 0)).toFixed(2))
    };
  }

  async getActiveCart(clientId: string): Promise<EcCart> {
    let cart = await EcCart.findOne({
      where: { clientId, status: CartStatusEnum.ACTIVE },
      include: [
        { model: Client, as: 'client' },
        {
          model: EcCartItem,
          as: 'items',
          include: [{ model: CatalogProduct, as: 'product' }]
        }
      ]
    });

    if (!cart) {
      cart = await EcCart.create({ clientId, status: CartStatusEnum.ACTIVE });
      cart = (await EcCart.findByPk(cart.id, {
        include: [
          { model: Client, as: 'client' },
          {
            model: EcCartItem,
            as: 'items',
            include: [{ model: CatalogProduct, as: 'product' }]
          }
        ]
      })) as EcCart;
    }

    return cart;
  }

  async addItem(cartId: string, data: { productId: string; quantity?: number; notes?: string }): Promise<EcCartItem> {
    const cart = await EcCart.findByPk(cartId);
    if (!cart) throw new Error('Cart not found');

    const product = await CatalogProduct.findByPk(data.productId);
    if (!product) throw new Error('Product not found');

    // If product already in cart, update quantity
    const existingItem = await EcCartItem.findOne({
      where: { cartId, productId: data.productId }
    });

    if (existingItem) {
      const newQuantity = Number(existingItem.quantity) + (Number(data.quantity) || 1);
      await existingItem.update({ quantity: newQuantity, notes: data.notes ?? existingItem.notes });
      return existingItem;
    }

    return EcCartItem.create({
      cartId,
      productId: data.productId,
      quantity: data.quantity || 1,
      unitPrice: product.unitPrice,
      notes: data.notes
    });
  }

  async updateItem(itemId: string, data: { quantity?: number; notes?: string }): Promise<EcCartItem> {
    const item = await EcCartItem.findByPk(itemId);
    if (!item) throw new Error('Cart item not found');
    return item.update(data);
  }

  async removeItem(itemId: string): Promise<void> {
    const item = await EcCartItem.findByPk(itemId);
    if (!item) throw new Error('Cart item not found');
    await item.destroy();
  }

  async clearCart(cartId: string): Promise<void> {
    const cart = await EcCart.findByPk(cartId);
    if (!cart) throw new Error('Cart not found');
    await EcCartItem.destroy({ where: { cartId } });
  }

  async applyCoupon(cartId: string, couponCode: string): Promise<EcCart> {
    const cart = await EcCart.findByPk(cartId);
    if (!cart) throw new Error('Cart not found');

    // Store the coupon code on the cart
    // Actual coupon validation/discount calculation can be extended via a coupon service
    return cart.update({ couponCode });
  }

  async convertToOrder(cartId: string): Promise<unknown> {
    const cart = await EcCart.findByPk(cartId, {
      include: [
        { model: Client, as: 'client' },
        {
          model: EcCartItem,
          as: 'items',
          include: [{ model: CatalogProduct, as: 'product' }]
        }
      ]
    });
    if (!cart) throw new Error('Cart not found');

    if (cart.status === CartStatusEnum.CONVERTED) {
      throw new Error('Cart has already been converted');
    }

    const items = cart.items || [];
    if (items.length === 0) {
      throw new Error('Cannot convert an empty cart');
    }

    const subtotal = items.reduce((sum, item) => {
      return sum + Number(item.quantity) * Number(item.unitPrice);
    }, 0);

    // Mark cart as converted
    await cart.update({ status: CartStatusEnum.CONVERTED });

    // Return structured data for order creation
    return {
      clientId: cart.clientId,
      currency: cart.currency,
      couponCode: cart.couponCode,
      discountAmount: Number(cart.discountAmount || 0),
      subtotal: Number(subtotal.toFixed(2)),
      total: Number((subtotal - Number(cart.discountAmount || 0)).toFixed(2)),
      notes: cart.notes,
      items: items.map(item => ({
        productId: item.productId,
        productName: (item as Record<string, unknown>).product?.name || null,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number((Number(item.quantity) * Number(item.unitPrice)).toFixed(2)),
        notes: item.notes
      }))
    };
  }

  async getAbandonedCarts(query: Record<string, unknown>): Promise<unknown> {
    const { page, limit, offset } = clampPagination(query);

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const where: Record<string, unknown> = {
      status: CartStatusEnum.ABANDONED,
      updatedAt: { [Op.lt]: twentyFourHoursAgo }
    };

    const { rows: docs, count: totalItems } = await EcCart.findAndCountAll({
      where,
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      include: [
        { model: Client, as: 'client' },
        {
          model: EcCartItem,
          as: 'items',
          include: [{ model: CatalogProduct, as: 'product' }]
        }
      ],
      distinct: true
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }
}

export default new CartService();
