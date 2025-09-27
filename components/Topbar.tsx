"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { useSession, signOut } from "~/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";

export default function Topbar() {
    const { data: session, isPending, error } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const handleSignOut = async () => {
        try {
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/");
                        router.refresh(); // Force refresh the page
                    },
                },
            });
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    return (
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-xl font-bold font-sans text-gray-900 hover:text-gray-700 transition-colors">
                            peermed
                        </Link>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        {/* Additional nav items */}
                        {session && (
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/jwt">JWT Demo</Link>
                            </Button>
                        )}

                        {isPending ? (
                            // Loading state
                            <div className="flex items-center space-x-2">
                                <div className="w-20 h-8 bg-gray-200 animate-pulse rounded-md"></div>
                                <div className="w-20 h-8 bg-gray-200 animate-pulse rounded-md"></div>
                            </div>
                        ) : session?.user ? (
                            // Authenticated state
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 text-sm">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700 font-medium">
                                        {session.user.name || session.user.email?.split('@')[0]}
                                    </span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push("/dashboard")}
                                    className={pathname === "/dashboard" ? "bg-gray-100" : ""}
                                >
                                    Dashboard
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSignOut}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </Button>
                            </div>
                        ) : (
                            // Unauthenticated state
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push("/auth/login")}
                                    className={pathname === "/auth/login" ? "bg-gray-100" : ""}
                                >
                                    Login
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => router.push("/auth/signup")}
                                    className={pathname === "/auth/signup" ? "opacity-90" : ""}
                                >
                                    Sign Up
                                </Button>
                            </div>
                        )}

                        {/* Error state */}
                        {error && !isPending && (
                            <span className="text-xs text-red-500">Session error</span>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}