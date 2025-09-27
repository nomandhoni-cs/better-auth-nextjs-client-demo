"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth";

type Jwks = {
    keys: Array<{ kty: string; crv?: string; use?: string; kid: string; x?: string; n?: string; e?: string; alg?: string }>;
} | null;

export default function JwtDemoPage() {
    const [token, setToken] = useState<string>("");
    const [jwks, setJwks] = useState<Jwks>(null);
    const [result, setResult] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const getToken = async () => {
        setLoading(true);
        setResult("");
        try {
            // Get JWT from the auth server
            const serverUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${serverUrl}/api/auth/token`, {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setToken(data.token || "");
            setResult("JWT token retrieved successfully!");
        } catch (e) {
            setResult(`Token error: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    const getTokenFromSession = async () => {
        setLoading(true);
        setResult("");
        try {
            const session = await authClient.getSession();
            if (session?.data?.user) {
                // Try to get JWT from session
                const serverUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_SERVER_URL || "http://localhost:8787";
                const res = await fetch(`${serverUrl}/api/auth/token`, {
                    method: "GET",
                    credentials: "include",
                });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                setToken(data.token || "");
                setResult("JWT token retrieved from session successfully!");
            } else {
                setResult("No active session found. Please sign in first.");
            }
        } catch (e) {
            setResult(`Session error: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    const getJWKS = async () => {
        setLoading(true);
        setResult("");
        try {
            const serverUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_SERVER_URL || "http://localhost:8787";
            const res = await fetch(`${serverUrl}/api/auth/jwks`, { method: "GET" });
            if (!res.ok) throw new Error(await res.text());
            const data = (await res.json()) as Jwks;
            setJwks(data);
            setResult("JWKS fetched successfully!");
        } catch (e) {
            setResult(`JWKS error: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    const callProtected = async () => {
        setLoading(true);
        setResult("");
        try {
            if (!token) throw new Error("No token. Click 'Get JWT' first.");

            // Call the protected route with JWT
            const serverUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_SERVER_URL || "http://localhost:8787";
            const res = await fetch(`${serverUrl}/api/auth/protected`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(JSON.stringify(data, null, 2));
        } catch (e) {
            setResult(`Protected error: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    const copyToken = async () => {
        if (!token) return;
        try {
            await navigator.clipboard.writeText(token);
            setResult("Token copied to clipboard!");
        } catch (e) {
            setResult(`Copy error: ${e}`);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-semibold">JWT Demo</h1>
            <p className="text-sm text-gray-600">Sign in first, then fetch a JWT and call the protected API route.</p>

            <div className="flex flex-wrap gap-2">
                <Button onClick={getToken} disabled={loading}>Get JWT</Button>
                <Button onClick={getTokenFromSession} variant="outline" disabled={loading}>Get JWT from Session</Button>
                <Button onClick={copyToken} variant="outline" disabled={!token}>Copy JWT</Button>
                <Button onClick={callProtected} variant="secondary" disabled={!token || loading}>Call Protected</Button>
                <Button onClick={getJWKS} variant="ghost" disabled={loading}>Fetch JWKS</Button>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Token</label>
                <textarea
                    className="w-full h-28 p-2 border rounded font-mono text-xs"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ey..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Result / Protected response</label>
                <pre className="w-full min-h-24 p-2 border rounded bg-gray-50 overflow-auto text-xs">{result}</pre>
            </div>

            {jwks && (
                <div>
                    <label className="block text-sm font-medium mb-1">JWKS</label>
                    <pre className="w-full p-2 border rounded bg-gray-50 overflow-auto text-xs">{JSON.stringify(jwks, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
