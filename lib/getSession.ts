// utils/getSession.ts
export async function getSessionUtil() {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/auth/get-session", {
        method: "GET",
        credentials: "include", // send cookies
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!res.ok) {
        console.error("Failed to fetch session:", res.status, res.statusText);
        return null;
    }

    try {
        const data = await res.json();
        console.log("Session data:", data);
        return data;
    } catch (err) {
        console.error("Error parsing session JSON:", err);
        return null;
    }
}
