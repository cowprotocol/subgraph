import { Address, BigDecimal, Bytes } from "@graphprotocol/graph-ts"
import { User } from "../../generated/schema"
import { ZERO_BD } from "../utils/constants"
import { totals } from "./totals"

export namespace users {

    function getOrCreateUserEntity(address: Address): User{
        let user = User.load(address)
        if (!user) {
            user = new User(address)
            user.address = address
            user.isSolver = false
            user.numberOfTrades = 0
            user.solvedAmountEth = ZERO_BD
            user.solvedAmountUsd = ZERO_BD
            user.tradedAmountEth = ZERO_BD
            user.tradedAmountUsd = ZERO_BD
            user.firstTradeTimestamp = 0
        } 

        return user as User
    }

   export function getOrCreateTrader(timestamp: i32, owner: Address, tradedAmountEth: BigDecimal | null, tradedAmountUsd: BigDecimal | null) :void {

        let user = getOrCreateUserEntity(owner)
        let prevTradedAmountUsd = user.tradedAmountUsd
        let prevTradedAmountEth = user.tradedAmountEth

        if (!user.firstTradeTimestamp) {
            user.firstTradeTimestamp = timestamp
            totals.addTraderCount()
        }

        if (tradedAmountUsd) {
            if (prevTradedAmountUsd) {
                user.tradedAmountUsd = prevTradedAmountUsd.plus(tradedAmountUsd)
            } else {
                user.tradedAmountUsd = tradedAmountUsd
            }
        }
        if (tradedAmountEth) {
            if (prevTradedAmountEth) {
                user.tradedAmountEth = prevTradedAmountEth.plus(tradedAmountEth)
            } else {
                user.tradedAmountEth = tradedAmountEth
            }
        }

        user.save()
    }

    export function getOrCreateSigner(owner: Address) :void {
        let user = getOrCreateUserEntity(owner)
        user.save()
    }

    export function getOrCreateSolver(solver: Address, solvedAmountEth: BigDecimal | null, solvedAmountUsd: BigDecimal | null): void{

        let user = getOrCreateUserEntity(solver)
        let prevNumOfTrades = user.numberOfTrades
        let prevSolvedAmountUsd = user.solvedAmountUsd
        let prevSolvedAmountEth = user.solvedAmountEth
        
        user.isSolver = true
        user.numberOfTrades = prevNumOfTrades + 1
        if (solvedAmountUsd) {
            if (prevSolvedAmountUsd) {
                user.solvedAmountUsd = prevSolvedAmountUsd.plus(solvedAmountUsd)
            } else {
                user.solvedAmountUsd = solvedAmountUsd
            }
        }
        if (solvedAmountEth) {
            if (prevSolvedAmountEth) {
                user.solvedAmountEth = prevSolvedAmountEth.plus(solvedAmountEth)
            } else {
                user.solvedAmountEth = solvedAmountEth
            }
        }
        
        user.save()
    }
}