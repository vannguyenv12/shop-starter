import { Cart, Coupon } from "@prisma/client";
import { cartService } from "./cart.service";
import { prisma } from "~/prisma";
import { couponService } from "./coupon.service";
import { BadRequestException, NotFoundException } from "~/globals/middlewares/error.middleware";
import { Helper } from "~/globals/helpers/helper";

class OrderService {
  public async add(requestBody: any, currentUser: UserPayload) {
    const { couponCode, addressId } = requestBody;

    const coupon: Coupon | null = await couponService.get(couponCode);
    if (!coupon) {
      throw new NotFoundException(`The coupon ${couponCode} does not exist`);
    }

    // Get all cart items in my cart
    const cart: any | null = await cartService.getMyCart(currentUser);
    // Create a Order

    const newOrder = await prisma.order.create({
      data: {
        addressId,
        totalPrice: 0,
        status: 'pending',
        userId: currentUser.id
      }
    })

    // Loop through the cart items and add it to orderItem
    const orderItems = [];
    let totalQuantity: number = 0;

    for (const cartItem of cart.cartItems) {
      orderItems.push({
        orderId: newOrder.id,
        productId: cartItem.productId,
        variant: cartItem.variant,
        price: cartItem.price,
        quantity: cartItem.quantity,
      });

      totalQuantity += cartItem.quantity
    }

    await prisma.orderItem.createMany({
      data: orderItems
    })

    // Clear carts
    cartService.clear(cart.id, currentUser);

    // update total price of order
    await prisma.order.update({
      where: { id: newOrder.id },
      data: {
        totalQuantity: totalQuantity,
        totalPrice: Helper.getOrderTotalPrice(coupon, cart.totalPrice)
      }
    })
  }

  public async update(orderId: number, requestBody: any) {
    const { status } = requestBody;

    if (status !== 'pending' && status !== 'delivered') {
      throw new BadRequestException('status does not support');
    }

    const order = await this.get(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID: ${orderId} not found`);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

  }

  private async get(orderId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId }
    });

    return order;
  }
}

export const orderService: OrderService = new OrderService();