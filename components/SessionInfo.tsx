import { headers } from "next/headers";

export default async function PrivateLayout() {
    const incomingHeaders = await headers(); // Add await here
    const cookie = incomingHeaders.get("cookie");

    const res = await fetch("https://auth0.peermed.de/api/auth/get-session", {
        credentials: "include",
        headers: cookie ? { cookie } : {},
        cache: "no-store",
    });

    let sessionData
    try {
        sessionData = await res.json();
    } catch {
        // ignore parse errors, session stays null
    }

    return (
        <div>
            {/* Debug: show session data (optional, can remove later) */}
            <pre className="mt-4 p-2 bg-gray-100 rounded text-sm">
                {JSON.stringify(sessionData, null, 2)}
            </pre>
        </div>
    );
}