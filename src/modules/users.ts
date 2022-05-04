import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { User } from "../../generated/schema"
import { ZERO_BD } from "../utils/constants"
import { totals } from "./totals"

export namespace users {

    function getOrCreateUserEntity(id: string, address: Address): User{
        let user = User.load(id)
        if (!user) {
            user = new User(id)
            user.address = address
            user.isSolver = false
            user.numberOfTrades = 0
            user.solvedAmountEth = ZERO_BD
            user.solvedAmountUsd = ZERO_BD
            user.tradedAmountEth = ZERO_BD
            user.tradedAmountUsd = ZERO_BD
        } 

        return user as User
    }

   export function getOrCreateTrader(orderOwner: string, timestamp: BigInt, owner: Address, tradedAmountEth: BigDecimal, tradedAmountUsd: BigDecimal) :void {

        let user = getOrCreateUserEntity(orderOwner, owner)
        let prevTradedAmountUsd = user.tradedAmountUsd
        let prevTradedAmountEth = user.tradedAmountEth

        if (!user.firstTradeTimestamp) {
            user.firstTradeTimestamp = timestamp
            totals.addTraderCount()
        }

        user.tradedAmountEth = prevTradedAmountEth.plus(tradedAmountEth)
        user.tradedAmountUsd = prevTradedAmountUsd.plus(tradedAmountUsd)

        user.save()
    }

    export function getOrCreateSigner(orderOwner: string, timestamp: BigInt, owner: Address) :void {
        let user = getOrCreateUserEntity(orderOwner, owner)
        user.save()
    }

    export function getOrCreateSolver(solver: Address, solvedAmountEth: BigDecimal, solvedAmountUsd: BigDecimal): void{

        let user = getOrCreateUserEntity(solver.toHexString(), solver)
        let prevNumOfTrades = user.numberOfTrades
        let prevSolvedAmountUsd = user.solvedAmountUsd
        let prevSolvedAmountEth = user.solvedAmountEth
        
        user.isSolver = true
        user.numberOfTrades = prevNumOfTrades + 1
        user.solvedAmountUsd = prevSolvedAmountUsd.plus(solvedAmountUsd)
        user.solvedAmountEth = prevSolvedAmountEth.plus(solvedAmountEth)
        
        user.save()
    }
}