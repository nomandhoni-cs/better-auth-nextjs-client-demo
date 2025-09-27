import { headers } from "next/headers";

// This must be a Server Component (no "use client")
export default async function SessionInfo() {
    async function getSession(authServerUrl: string) {
        const res = await fetch(`${authServerUrl}/api/auth/get-session`, {
            credentials: "include",
            headers: await headers(),
        });

        if (!res.ok) return null;

        try {
            return await res.json();
        } catch {
            return null;
        }
    }

    const authServerUrl = "https://auth0.peermed.de"
    const session = await getSession(authServerUrl);

    if (!session) {
        return (
            <div className="p-4 rounded-2xl shadow-md bg-red-50 text-red-700">
                <p>No active session</p>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl shadow-lg bg-green-50 text-green-800 space-y-2">
            <h2 className="text-xl font-semibold">Active Session</h2>
            <pre className="text-sm bg-white p-3 rounded-xl overflow-x-auto border">
                {JSON.stringify(session, null, 2)}
            </pre>
        </div>
    );
}
