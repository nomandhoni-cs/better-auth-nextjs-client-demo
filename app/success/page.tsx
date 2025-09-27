import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";

const EmailVerificationSuccess = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Email Verified Successfully!
                    </CardTitle>
                    <CardDescription className="text-base">
                        Your email has been verified. You can now log in to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Link href="/auth/login" className="block w-full">
                        <Button className="w-full" size="lg">
                            Go to Login
                        </Button>
                    </Link>

                    <div className="text-center text-sm text-muted-foreground">
                        You will be redirected to the login page to access your account.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EmailVerificationSuccess;