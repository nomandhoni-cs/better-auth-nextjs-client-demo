// src/app/verify-email/page.tsx
"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useSession, sendVerificationEmail, verifyEmail } from "~/lib/auth";
import { toast } from "sonner";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, isPending: sessionLoading, refetch } = useSession();

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [verificationToken, setVerificationToken] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const next = searchParams.get("next") || "/dashboard";
    const token = searchParams.get("token"); // From email link

    // Check if user is already verified
    useEffect(() => {
        if (!sessionLoading && session?.user?.emailVerified) {
            router.push(next);
        }
    }, [session, sessionLoading, router, next]);

    // Auto-verify if token is present in URL
    useEffect(() => {
        if (token && !loading) {
            handleTokenVerification(token);
        }
    }, [token]);

    // Handle cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleTokenVerification = async (verifyToken: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await verifyEmail({
                query: {
                    token: verifyToken,
                }
            });

            if (response?.error) {
                setError(response.error.message || "Invalid or expired verification link");
                setLoading(false);
                return;
            }

            // Success
            setSuccess(true);
            toast.success("Email verified successfully!");

            // Refresh session
            await refetch();

            // Redirect after a short delay
            setTimeout(() => {
                router.push(next);
            }, 2000);
        } catch (err) {
            console.error("Email verification error:", err);
            setError("Failed to verify email");
            setLoading(false);
        }
    };

    const handleManualVerification = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!verificationToken.trim()) {
            setError("Please enter the verification token");
            return;
        }

        await handleTokenVerification(verificationToken);
    };

    const handleResendEmail = async () => {
        if (!session?.user?.email) {
            setError("No email address found. Please sign in again.");
            return;
        }

        setResending(true);
        setError(null);

        try {
            await sendVerificationEmail({
                email: session.user.email,
                callbackURL: `${window.location.origin}/verify-email?next=${encodeURIComponent(next)}`,
            });

            toast.success("Verification email sent! Please check your inbox.");
            setResendCooldown(60); // 60 second cooldown
        } catch (err) {
            console.error("Resend email error:", err);
            setError("Failed to send verification email");
        } finally {
            setResending(false);
        }
    };

    if (sessionLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    if (!session?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
                    <p>Redirecting to login...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                            <p className="text-gray-600">
                                Your email has been successfully verified. Redirecting...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Mail className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-center">Verify Your Email</CardTitle>
                    <CardDescription className="text-center">
                        We&apos;ve sent a verification email to{" "}
                        <span className="font-medium">{session.user.email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Verification Failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Manual verification form */}
                    {!token && (
                        <form onSubmit={handleManualVerification} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="token">Verification Token (Optional)</Label>
                                <Input
                                    id="token"
                                    type="text"
                                    placeholder="Paste verification token"
                                    value={verificationToken}
                                    onChange={(e) => setVerificationToken(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="text-sm text-gray-500 text-center">
                                    If you have the verification token, you can paste it here
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading || !verificationToken}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify with Token"
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            Didn&apos;t receive the email? Check your spam folder or
                        </p>
                        <Button
                            variant="outline"
                            onClick={handleResendEmail}
                            disabled={resending || resendCooldown > 0}
                            className="w-full"
                        >
                            {resending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : resendCooldown > 0 ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend in {resendCooldown}s
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend Verification Email
                                </>
                            )}
                        </Button>
                    </div>

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Check your email</AlertTitle>
                        <AlertDescription>
                            Click the verification link in the email we sent you. The link will expire in 24 hours.
                        </AlertDescription>
                    </Alert>

                    <div className="text-center">
                        <Button
                            variant="link"
                            onClick={() => router.push("/login")}
                            className="text-sm"
                        >
                            Back to Sign In
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Main export with Suspense boundary
export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <Loader2 className="animate-spin h-8 w-8" />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}