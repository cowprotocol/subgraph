import { BigInt } from "@graphprotocol/graph-ts";


export function getDayTotalTimestamp(timestamp: BigInt): BigInt {
    let dayId = timestamp.toI32() / 86400 
    let dayStartTimestamp = dayId * 86400
    return BigInt.fromI32(dayStartTimestamp)
}

export function getHourTotalTimestamp(timestamp: BigInt): BigInt {
    let hourId = timestamp.toI32() / 3600
    let hourStartTimestamp = hourId * 3600
    return BigInt.fromI32(hourStartTimestamp)
}
