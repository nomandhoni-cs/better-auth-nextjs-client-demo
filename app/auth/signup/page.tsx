// src/app/signup/page.tsx
"use client";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, X, AlertTriangle, Mail } from "lucide-react";
import { signUp, useSession, authClient } from "~/lib/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [signupSuccess, setSignupSuccess] = useState(false);

  const next = "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && !sessionLoading) {
      if (!session.user.emailVerified) {
        router.push("/verify-email");
      } else {
        router.push(next);
      }
    }
  }, [session, sessionLoading, router]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (password !== passwordConfirmation) {
      errors.passwordConfirmation = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let imageData = "";
      if (image) {
        imageData = await convertImageToBase64(image);
      }

      const response = await signUp.email({
        email,
        password,
        name: `${firstName.trim()} ${lastName.trim()}`,
        image: imageData,
      });

      if (response?.error) {
        setError(response.error.message || "Sign up failed");
        setLoading(false);
        return;
      }

      // Success - Account created
      setSignupSuccess(true);
      toast.success("Account created successfully! Please check your email to verify your account.");

      // Since requireEmailVerification is true in your auth config,
      // we should redirect to verify-email page instead of trying to auto sign-in
      // The user won't be able to sign in until they verify their email

      // Store email in sessionStorage for verify-email page
      sessionStorage.setItem('pendingVerificationEmail', email);

      // Redirect to verification page after a short delay
      setTimeout(() => {
        router.push("/verify-email?fromSignup=true");
      }, 2000);

    } catch (err) {
      console.error("Sign up error:", err);
      setError("Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: "google" | "github") => {
    setError(null);
    setLoading(true);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}${next}`,
      });
      // The social sign-in will redirect automatically
    } catch (err) {
      console.error(`${provider} sign-up error:`, err);
      setError(`Failed to sign up with ${provider}`);
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  // Don't render sign-up form if already logged in
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

  // Show success message after signup
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Check Your Email!</h2>
              <p className="text-gray-600 mb-4">
                We&apos;ve sent a verification link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to verification page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <Alert variant="destructive" aria-live="polite">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sign-up failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  placeholder="Max"
                  required
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (validationErrors.firstName) {
                      setValidationErrors(prev => ({ ...prev, firstName: "" }));
                    }
                  }}
                  value={firstName}
                  disabled={loading}
                  className={validationErrors.firstName ? "border-red-500" : ""}
                />
                {validationErrors.firstName && (
                  <p className="text-xs text-red-500">{validationErrors.firstName}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  placeholder="Robinson"
                  required
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (validationErrors.lastName) {
                      setValidationErrors(prev => ({ ...prev, lastName: "" }));
                    }
                  }}
                  value={lastName}
                  disabled={loading}
                  className={validationErrors.lastName ? "border-red-500" : ""}
                />
                {validationErrors.lastName && (
                  <p className="text-xs text-red-500">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors(prev => ({ ...prev, email: "" }));
                  }
                }}
                value={email}
                disabled={loading}
                className={validationErrors.email ? "border-red-500" : ""}
              />
              {validationErrors.email && (
                <p className="text-xs text-red-500">{validationErrors.email}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors(prev => ({ ...prev, password: "" }));
                  }
                }}
                autoComplete="new-password"
                placeholder="Password (min 8 characters)"
                disabled={loading}
                className={validationErrors.password ? "border-red-500" : ""}
              />
              {validationErrors.password && (
                <p className="text-xs text-red-500">{validationErrors.password}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password_confirmation">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value);
                  if (validationErrors.passwordConfirmation) {
                    setValidationErrors(prev => ({ ...prev, passwordConfirmation: "" }));
                  }
                }}
                autoComplete="new-password"
                placeholder="Confirm Password"
                disabled={loading}
                className={validationErrors.passwordConfirmation ? "border-red-500" : ""}
              />
              {validationErrors.passwordConfirmation && (
                <p className="text-xs text-red-500">{validationErrors.passwordConfirmation}</p>
              )}
            </div>


            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                "Create an account"
              )}
            </Button>

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

            {/* Social Sign Up */}
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => handleSocialSignUp("google")}
              >
                Sign up with Google
              </Button>
            </div>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}