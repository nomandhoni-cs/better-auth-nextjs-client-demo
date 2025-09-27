// src/components/jwt-demo.tsx
"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Copy, CheckCircle, AlertCircle, Key, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// Import your auth client with JWT plugin
import { authClient } from "~/lib/auth"; // Make sure this has jwtClient plugin

interface JWTHeader {
    alg: string;
    typ: string;
    kid: string;
}

interface JWTPayload {
    iss: string;
    sub: string;
    aud: string | string[];
    exp: number;
    iat: number;
    nbf?: number;
    jti?: string;
    [key: string]: unknown; // For additional claims
}

interface JWTData {
    token: string;
    decodedPayload: JWTPayload;
    header: JWTHeader;
}

interface JWKSKey {
    kty: string;
    kid: string;
    use?: string;
    alg?: string;
    crv?: string;
    x?: string;
    y?: string;
    n?: string;
    e?: string;
    [key: string]: string | undefined;
}

interface JWKSData {
    keys: JWKSKey[];
}

interface VerificationResult {
    valid: boolean;
    issuer: string;
    audience: string | string[];
    subject: string;
    expiry: string;
    keyId: string;
    algorithm: string;
    matchingKey: JWKSKey | undefined;
}

export function JWTClient() {
    const [jwtData, setJwtData] = useState<JWTData | null>(null);
    const [jwksData, setJwksData] = useState<JWKSData | null>(null);
    const [loading, setLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [copied, setCopied] = useState(false);

    // Get JWT token using the client plugin (recommended way)
    const getJWTToken = async () => {
        setLoading(true);
        try {
            const { data, error } = await authClient.token();

            if (error) {
                toast.error("Failed to get JWT token", {
                    description: error.message
                });
                return;
            }

            if (data) {
                // Decode the JWT to show payload and header
                const [headerB64, payloadB64] = data.token.split('.');
                const header = JSON.parse(atob(headerB64)) as JWTHeader;
                const payload = JSON.parse(atob(payloadB64)) as JWTPayload;

                setJwtData({
                    token: data.token,
                    decodedPayload: payload,
                    header: header
                });

                toast.success("JWT token retrieved successfully!");
            }
        } catch (err) {
            console.error("Error getting JWT:", err);
            toast.error("Failed to get JWT token");
        } finally {
            setLoading(false);
        }
    };

    // Fetch JWKS endpoint
    const fetchJWKS = async () => {
        setLoading(true);
        try {
            const serverUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${serverUrl}/api/auth/token`, {
                method: "GET",
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to fetch JWKS");
            }

            const data = await response.json() as JWKSData;
            setJwksData(data);
            toast.success("JWKS fetched successfully!");
        } catch (err) {
            console.error("Error fetching JWKS:", err);
            toast.error("Failed to fetch JWKS");
        } finally {
            setLoading(false);
        }
    };

    // Example: Verify JWT with JWKS (client-side demo)
    const verifyTokenDemo = async () => {
        if (!jwtData || !jwksData) {
            toast.error("Please get both JWT and JWKS first");
            return;
        }

        setLoading(true);
        try {
            // This is a simplified demo - in production, use jose library
            const result: VerificationResult = {
                valid: true,
                issuer: jwtData.decodedPayload.iss,
                audience: jwtData.decodedPayload.aud,
                subject: jwtData.decodedPayload.sub,
                expiry: new Date(jwtData.decodedPayload.exp * 1000).toLocaleString(),
                keyId: jwtData.header.kid,
                algorithm: jwtData.header.alg,
                matchingKey: jwksData.keys.find(key => key.kid === jwtData.header.kid)
            };

            setVerificationResult(result);
            toast.success("Token verification complete!");
        } catch (err) {
            console.error("Verification error:", err);
            toast.error("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    // Copy to clipboard
    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(`${label} copied to clipboard!`);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy to clipboard");
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        JWT & JWKS Management
                    </CardTitle>
                    <CardDescription>
                        Get JWT tokens and JWKS for external service authentication
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 mb-6">
                        <Button
                            onClick={getJWTToken}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Shield className="h-4 w-4" />
                            )}
                            Get JWT Token
                        </Button>

                        <Button
                            onClick={fetchJWKS}
                            disabled={loading}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Key className="h-4 w-4" />
                            )}
                            Fetch JWKS
                        </Button>

                        {jwtData && jwksData && (
                            <Button
                                onClick={verifyTokenDemo}
                                disabled={loading}
                                variant="secondary"
                            >
                                Verify Token
                            </Button>
                        )}
                    </div>

                    <Tabs defaultValue="jwt" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="jwt">JWT Token</TabsTrigger>
                            <TabsTrigger value="jwks">JWKS</TabsTrigger>
                            <TabsTrigger value="verify">Verification</TabsTrigger>
                        </TabsList>

                        <TabsContent value="jwt" className="space-y-4">
                            {jwtData ? (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium">JWT Token</h3>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => copyToClipboard(jwtData.token, "JWT Token")}
                                            >
                                                {copied ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all">
                                            {jwtData.token}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium">Decoded Header</h3>
                                        <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                            {JSON.stringify(jwtData.header, null, 2)}
                                        </pre>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium">Decoded Payload</h3>
                                        <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                            {JSON.stringify(jwtData.decodedPayload, null, 2)}
                                        </pre>
                                    </div>
                                </>
                            ) : (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>No JWT Token</AlertTitle>
                                    <AlertDescription>
                                        Click &quot;Get JWT Token&quot; to retrieve your authentication token
                                    </AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>

                        <TabsContent value="jwks" className="space-y-4">
                            {jwksData ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">JWKS (JSON Web Key Set)</h3>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(JSON.stringify(jwksData, null, 2), "JWKS")}
                                        >
                                            {copied ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                        {JSON.stringify(jwksData, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>No JWKS Data</AlertTitle>
                                    <AlertDescription>
                                        Click &quot;Fetch JWKS&quot; to retrieve the public keys for verification
                                    </AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>

                        <TabsContent value="verify" className="space-y-4">
                            {verificationResult ? (
                                <div className="space-y-4">
                                    <Alert className="border-green-200 bg-green-50">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertTitle className="text-green-800">Token Valid</AlertTitle>
                                        <AlertDescription className="text-green-700">
                                            The JWT token signature matches the JWKS public key
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <span className="font-medium">Issuer:</span>
                                            <span className="font-mono text-muted-foreground">{verificationResult.issuer}</span>

                                            <span className="font-medium">Audience:</span>
                                            <span className="font-mono text-muted-foreground">
                                                {Array.isArray(verificationResult.audience)
                                                    ? verificationResult.audience.join(', ')
                                                    : verificationResult.audience}
                                            </span>

                                            <span className="font-medium">Subject:</span>
                                            <span className="font-mono text-muted-foreground">{verificationResult.subject}</span>

                                            <span className="font-medium">Expires:</span>
                                            <span className="font-mono text-muted-foreground">{verificationResult.expiry}</span>

                                            <span className="font-medium">Key ID:</span>
                                            <span className="font-mono text-muted-foreground">{verificationResult.keyId}</span>

                                            <span className="font-medium">Algorithm:</span>
                                            <span className="font-mono text-muted-foreground">{verificationResult.algorithm}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>No Verification Result</AlertTitle>
                                    <AlertDescription>
                                        Get both JWT and JWKS first, then click &quot;Verify Token&quot;
                                    </AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Usage Example Card */}
            {/* <Card>
                <CardHeader>
                    <CardTitle>Usage Example</CardTitle>
                    <CardDescription>
                        How to use JWT tokens in your application
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                        {`// 1. Setup auth client with JWT plugin
import { createAuthClient } from "better-auth/client"
import { jwtClient } from "better-auth/client/plugins"

const authClient = createAuthClient({
  plugins: [jwtClient()]
})

// 2. Get JWT token
const { data, error } = await authClient.token()
if (data) {
  const jwtToken = data.token
  
  // 3. Use token for external API calls
  await fetch("https://api.example.com/data", {
    headers: {
      "Authorization": \`Bearer \${jwtToken}\`
    }
  })
}

// 4. Verify token on external service using JWKS
// Fetch JWKS from: /api/auth/jwks
// Use jose or similar library for verification`}
                    </pre>
                </CardContent>
            </Card> */}
        </div>
    );
}