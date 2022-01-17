import { log } from "@graphprotocol/graph-ts"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Order } from "../../generated/schema"


export namespace orders {

    export function invalidateOrder(orderId: string, timestamp: BigInt): Order {

        let order = Order.load(orderId)

        if (!order) {
            order = new Order(orderId)
            log.info('Order {} was not found. It was created for being invalidated', [orderId])
        }

        order.isValid = false
        order.invalidateTimestamp = timestamp

        return order as Order
    }

    export function setPresignature(orderId: string, owner: string, timestamp: BigInt, signed: boolean): Order {

        let order = getOrCreateOrder(orderId, owner)

        order.presignTimestamp = timestamp
        order.isSigned = signed

        return order as Order
    }

    export function getOrCreateOrderForTrade(orderId: string, timestamp: BigInt, owner: string): Order {

        let order = getOrCreateOrder(orderId, owner)
        order.tradesTimestamp = timestamp

        return order as Order
    }

    function getOrCreateOrder(orderId: string, owner: string): Order {

        let order = Order.load(orderId)

        if (!order) {
            order = new Order(orderId)
            order.isValid = true
            order.isSigned = false
        } 

        order.owner = owner

        return order as Order
    }
}