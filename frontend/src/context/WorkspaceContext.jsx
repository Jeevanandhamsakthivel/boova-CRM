import { createContext, useContext } from "react";

export const WorkspaceContext = createContext(null);

export function useWorkspaceContext() {
    return useContext(WorkspaceContext);
}
