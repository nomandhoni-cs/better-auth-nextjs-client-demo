// src/app/login/page.tsx
"use client";
import { useState, type JSX, type FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Mail } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
// import { Checkbox } from "~/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { authClient, useSession, sendVerificationEmail } from "~/lib/auth";
import { toast } from "sonner";

export default function SignIn(): JSX.Element {
  const router = useRouter();
  const { data: session, isPending: sessionLoading, refetch: refetchSession } = useSession();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [twoFARequired, setTwoFARequired] = useState<boolean>(false);
  const [twoFACode, setTwoFACode] = useState<string>("");
  const [useBackup, setUseBackup] = useState<boolean>(false);
  const [trustDevice, setTrustDevice] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [passkeyAutoFillAvailable, setPasskeyAutoFillAvailable] = useState(false);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const next = "/dashboard";

  // Handle cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && !sessionLoading && !loading) {
      // Check if email is verified
      if (!session.user.emailVerified) {
        router.replace("/verify-email");
      } else {
        router.replace(next);
      }
    }
  }, [session, sessionLoading, loading, router, next]);

  // // Check passkey support
  // useEffect(() => {
  //   if (!session?.user && !sessionLoading) {
  //     checkPasskeySupport();
  //   }
  // }, [session, sessionLoading]);

  // const checkPasskeySupport = async () => {
  //   try {
  //     if (
  //       window.PublicKeyCredential &&
  //       PublicKeyCredential.isConditionalMediationAvailable
  //     ) {
  //       const available = await PublicKeyCredential.isConditionalMediationAvailable();
  //       setPasskeyAutoFillAvailable(available);

  //       if (available && !session?.user) {
  //         try {
  //           await authClient.signIn.passkey({
  //             autoFill: true,
  //           });
  //         } catch (error) {
  //           console.debug("Passkey autofill check:", error);
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.debug("WebAuthn not supported:", error);
  //   }
  // };

  async function handleLogin(e?: FormEvent<HTMLFormElement>): Promise<void> {
    e?.preventDefault();
    setLoginError(null);
    setTwoFAError(null);
    setEmailVerificationRequired(false);
    setLoading(true);

    try {
      const response = await authClient.signIn.email(
        {
          email,
          password,
        },
        {
          onError: (ctx) => {
            // Handle email verification required error
            if (ctx.error.status === 403) {
              setEmailVerificationRequired(true);
              setLoginError("Please verify your email address before signing in.");
            } else {
              setLoginError(ctx.error.message || "Login failed");
            }
          }
        }
      );

      console.log("Login response:", response);

      // Check if 2FA is required
      if (response?.data && "twoFactorRedirect" in response.data && response.data.twoFactorRedirect === true) {
        console.log("2FA is required");
        setTwoFARequired(true);
        setLoading(false);
        return;
      }

      // Check for errors
      if (response?.error) {
        // Error already handled in onError callback
        setLoading(false);
        return;
      }

      // Successful login
      if (response?.data?.user) {
        // Check if email is verified
        if (!response.data.user.emailVerified) {
          router.replace("/verify-email");
        } else {
          router.replace(next);
        }
        router.refresh();
      }

    } catch (err: any) {
      console.error("Login error:", err);
      if (!loginError) { // Only set if not already set by onError
        setLoginError(err?.message || "Failed to sign in");
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setResendingVerification(true);
    setLoginError(null);

    try {
      await sendVerificationEmail({
        email,
        callbackURL: next,
      });

      toast.success("Verification email sent! Please check your inbox.");
      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      console.error("Resend verification error:", err);
      toast.error(err?.message || "Failed to send verification email");
    } finally {
      setResendingVerification(false);
    }
  }

  // async function handleVerify2FA(e?: FormEvent<HTMLFormElement>): Promise<void> {
  //   e?.preventDefault();
  //   setTwoFAError(null);
  //   setLoading(true);

  //   try {
  //     let response;

  //     if (useBackup) {
  //       response = await authClient.twoFactor.verifyBackupCode({
  //         code: twoFACode,
  //         trustDevice
  //       });
  //     } else {
  //       response = await authClient.twoFactor.verifyTotp({
  //         code: twoFACode,
  //         trustDevice
  //       });
  //     }

  //     if (response?.error) {
  //       setTwoFAError(response.error.message || "Invalid code");
  //       setLoading(false);
  //       return;
  //     }

  //     if (response?.data) {
  //       router.replace(next);
  //       router.refresh();
  //     }
  //   } catch (err: any) {
  //     setTwoFAError(err?.message || "Invalid code. Try again.");
  //     setLoading(false);
  //   }
  // }

  // async function handlePasskeySignIn() {
  //   setLoginError(null);
  //   setLoading(true);

  //   try {
  //     const response = await authClient.signIn.passkey({
  //       ...(email && { email }),
  //     });

  //     if (response?.error) {
  //       const errorMessage = response.error.message || "Passkey authentication failed";
  //       if (!errorMessage.toLowerCase().includes("cancel") &&
  //         !errorMessage.toLowerCase().includes("abort")) {
  //         setLoginError(errorMessage);
  //       }
  //       setLoading(false);
  //       return;
  //     }

  //     if (response?.data?.user || response?.data?.session) {
  //       setLoading(false);

  //       // Check if email is verified
  //       if (response.data.user && !response.data.user.emailVerified) {
  //         router.replace("/verify-email");
  //       } else {
  //         router.replace(next);
  //       }
  //     } else {
  //       console.log("Unexpected response format:", response);
  //       setLoginError("Authentication successful but unexpected response format");
  //       setLoading(false);
  //     }
  //   } catch (err: any) {
  //     const errorMessage = err?.message || "Passkey authentication failed";
  //     if (!errorMessage.toLowerCase().includes("cancel") &&
  //       !errorMessage.toLowerCase().includes("abort")) {
  //       setLoginError(errorMessage);
  //     }
  //     setLoading(false);
  //   }
  // }

  async function handleSocialSignIn(provider: "google" | "github") {
    setLoginError(null);
    setLoading(true);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}${next}`,
      });
    } catch (err: any) {
      console.error(`${provider} sign-in error:`, err);
      setLoginError(err?.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-96">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {loginError && (
              <Alert variant="destructive" aria-live="polite">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            {emailVerificationRequired && (
              <Alert className="border-orange-200 bg-orange-50">
                <Mail className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Email Verification Required</AlertTitle>
                <AlertDescription className="text-orange-700">
                  Your email address needs to be verified before you can sign in.
                  <Button
                    variant="link"
                    className="h-auto p-0 ml-1 text-orange-700 underline"
                    onClick={handleResendVerification}
                    disabled={resendingVerification || resendCooldown > 0}
                  >
                    {resendingVerification ? "Sending..." :
                      resendCooldown > 0 ? `Resend in ${resendCooldown}s` :
                        "Resend verification email"}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <form className="grid gap-4" onSubmit={handleLogin} noValidate>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete={passkeyAutoFillAvailable ? "username webauthn" : "username"}
                  placeholder="m@example.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="password"
                  autoComplete={passkeyAutoFillAvailable ? "current-password webauthn" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !email || !password}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* 2FA Verification */}
            {twoFARequired && (
              <div className="grid gap-2 border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twofa">
                    {useBackup ? "Backup code" : "Authenticator code"}
                  </Label>
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => {
                      setUseBackup((v) => !v);
                      setTwoFACode("");
                      setTwoFAError(null);
                    }}
                  >
                    {useBackup ? "Use authenticator code" : "Use backup code"}
                  </button>
                </div>

                {twoFAError && (
                  <Alert variant="destructive" aria-live="polite">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Verification failed</AlertTitle>
                    <AlertDescription>{twoFAError}</AlertDescription>
                  </Alert>
                )}
                {/* 
                <form className="grid gap-2" onSubmit={handleVerify2FA} noValidate>
                  <Input
                    id="twofa"
                    inputMode={useBackup ? "text" : "numeric"}
                    autoComplete="one-time-code"
                    placeholder={useBackup ? "Enter backup code" : "123456"}
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value)}
                    autoFocus
                    disabled={loading}
                  />

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="trust"
                      checked={trustDevice}
                      onCheckedChange={(v: boolean | "indeterminate") => setTrustDevice(v === true)}
                    />
                    <Label htmlFor="trust">Trust this device</Label>
                  </div>

                  <Button className="w-full" type="submit" disabled={loading || !twoFACode}>
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </form> */}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* <Button
              type="button"
              variant="secondary"
              disabled={loading}
              className="gap-2"
              onClick={handlePasskeySignIn}
            >
              <Key size={16} />
              Sign in with Passkey
            </Button> */}

            <div className="w-full gap-2 flex flex-col">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={loading}
                onClick={() => handleSocialSignIn("google")}
              >
                Sign in with Google
              </Button>

              {/* <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={loading}
                onClick={() => handleSocialSignIn("github")}
              >
                Sign in with GitHub
              </Button> */}
            </div>

            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}