import {
    SolverAdded,
    SolverRemoved
} from "../generated/GPv2AllowListAuthentication/GPv2AllowListAuthentication"
import { users } from "./modules"

export function handleSolverAdded(event: SolverAdded): void {
    let solverAddress = event.params.solver
    let timestamp = event.block.timestamp.toI32()
    users.setIsSolverTrue(solverAddress, timestamp)
}

export function handleSolverRemoved(event: SolverRemoved): void { 
    let solverAddress = event.params.solver
    let timestamp = event.block.timestamp.toI32()
    users.setIsSolverFalse(solverAddress, timestamp)
}
