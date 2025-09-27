// context/SessionContext.tsx
import { BetterFetchError } from "better-auth/react";
import React, { createContext, useContext } from "react";
import { useSession } from "~/lib/auth";
import type { SessionData } from "~/types/session";

type SessionContextType = {
    data: SessionData | null;
    error: BetterFetchError | null;
    isPending: boolean;
    refetch: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
    const { data, error, isPending, refetch } = useSession();

    const value: SessionContextType = {
        data,
        error,
        isPending,
        refetch,
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSessionContext = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error("useSessionContext must be used within a SessionProvider");
    }
    return context;
};
