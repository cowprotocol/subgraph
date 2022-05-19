
export function getDayTotalTimestamp(timestamp: i32): i32 {
    let dayId = timestamp / 86400 
    return dayId * 86400
}

export function getHourTotalTimestamp(timestamp: i32): i32 {
    let hourId = timestamp / 3600
    return hourId * 3600
}
