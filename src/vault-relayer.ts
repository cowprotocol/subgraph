import {
    SolverAdded,
    SolverRemoved
} from "../generated/GPv2VaultRelayer/GPv2VaultRelayer"
import { users } from "./modules"

export function handleSolverAdded(event: SolverAdded): void {
    let solverAddress = event.address
    users.setIsSolverTrue(solverAddress)
}

export function handleSolverRemoved(event: SolverRemoved): void { 
    let solverAddress = event.address
    users.setIsSolverFalse(solverAddress)
}
