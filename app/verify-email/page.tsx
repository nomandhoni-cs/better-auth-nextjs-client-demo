// src/app/verify-email/page.tsx
"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { useSession, sendVerificationEmail } from "~/lib/auth";
import { toast } from "sonner";

function VerifyEmailContent() {
    const router = useRouter();
    const { data: session, isPending: sessionLoading } = useSession();

    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Handle cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleResendEmail = async () => {
        if (!session?.user?.email) {
            toast.error("No email address found. Please sign in again.");
            return;
        }

        setResending(true);

        try {
            await sendVerificationEmail({
                email: session.user.email,
            });

            toast.success("Verification email sent! Please check your inbox.");
            setResendCooldown(60); // 60 second cooldown
        } catch (err) {
            console.error("Resend email error:", err);
            toast.error("Failed to send verification email");
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
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Check your email</AlertTitle>
                        <AlertDescription>
                            Click the verification link in the email we sent you. The link will expire in 24 hours.
                        </AlertDescription>
                    </Alert>

                    <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            Didn&apos;t receive the email? Check your spam folder
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

                    <div className="text-center">
                        <Button
                            variant="link"
                            onClick={() => router.push("/auth/login")}
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