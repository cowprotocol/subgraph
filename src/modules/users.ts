import { Address, BigInt } from "@graphprotocol/graph-ts"
import { User } from "../../generated/schema"

export namespace users {
    export function getOrCreateUser(timestamp: BigInt, owner: Address) : User {

        let userAddressHex = owner.toHexString()

        let user = User.load(userAddressHex)

        if (!user) {
            user = new User(userAddressHex)
            user.firstTradeTimestamp = timestamp
            user.address = owner
            user.isSolver = false
            user.save()
        }

        return user as User
    }
}