/**
 * @description: Enhanced Header with professional styling and theme toggle for POS
 * @version: 2.0.0
 * @date: 2025-01-27
 */

"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Pacifico } from "next/font/google";
import { toast } from "sonner";

const pacifico = Pacifico({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-pacifico",
});

type HeaderProps = {
    onToggle?: () => void;
    collapsed?: boolean;
};

export default function Header({ onToggle, collapsed }: HeaderProps) {
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user, logout } = useAuth();

// Theme functionality removed


    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            toast.success("Logged out successfully");
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to logout. Please try again.");
        } finally {
            setIsLoggingOut(false);
            setDropdownOpen(false);
        }
    };

    const handleProfileClick = () => {
        // For now, redirect to dashboard since there's no dedicated profile page
        router.push("/dashboard");
        setDropdownOpen(false);
    };

    const handleSettingsClick = () => {
        router.push("/settings");
        setDropdownOpen(false);
    };

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] }}
            className={cn(
                "relative z-40 flex items-center justify-between mx-2 mt-3 mr-2 px-3 py-2 rounded-xl transition-all duration-400 ease-[cubic-bezier(0.7,-0.15,0.25,1.15)] will-change-transform ",
                "shadow-[0_8px_30px_rgb(122,128,99,0.15)] dark:shadow-[0_8px_30px_rgb(122,128,99,0.07)]",
                "hover:shadow-[0_15px_50px_rgb(122,128,99,0.25)] dark:hover:shadow-[0_15px_50px_rgb(122,128,99,0.15)]",
                scrolled
                    ? "shadow-[0_12px_40px_rgb(122,128,99,0.25)] dark:shadow-[0_12px_40px_rgb(122,128,99,0.12)]"
                    : ""
            )}
        >
            {/* Elegant Glass Background with Gradient Border */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#7A8063]/5 via-transparent to-[#7A8063]/5 dark:from-[#7A8063]/10 dark:via-transparent dark:to-[#7A8063]/10 rounded-xl blur-xl" />

                {/* Gradient Border Effect */}
                <div className="absolute inset-0 p-[1px] rounded-xl bg-gradient-to-br from-[#7A8063]/30 via-white/20 to-[#7A8063]/30 dark:from-[#7A8063]/20 dark:via-white/10 dark:to-[#7A8063]/20">
                    {/* Glass Background */}
                    <div className="absolute inset-0 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-xl" />
                </div>

                {/* Subtle Background Patterns */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(122,128,99,0.4),transparent_70%)]" />
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(122,128,99,0.4),transparent_70%)]" />
                </div>
            </div>

            {/* Left Section */}
            <div className="relative z-10 flex items-center space-x-4">
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-2 rounded-lg bg-gradient-to-r from-[#7A8063]/10 to-[#7A8063]/5 dark:from-[#7A8063]/20 dark:to-[#7A8063]/10 hover:from-[#7A8055]/20 hover:to-[#7A8055]/10 dark:hover:from-[#7A8055]/30 dark:hover:to-[#7A8055]/20 transition-all duration-300 shadow-sm hover:shadow-md border border-[#7A8063]/10 dark:border-[#7A8063]/20 active:scale-95"
                        title="Toggle Sidebar"
                        type="button"
                    >
                        <Menu className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                    </button>
                )}

                <div className="flex flex-col">
                    <h1 className=" text-sm font-semibold text-gray-800 dark:text-gray-200">
                        AI bussiness developer
                    </h1>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        Welcome to{" "}
                        <span className="relative inline-block group">
                            {/* Text shadow for depth */}
                            <span className="absolute inset-0 bg-gradient-to-r from-[#7A8063] via-[#7A8055] to-[#7A8063] dark:from-[#7A8063] dark:via-[#7A8055] dark:to-[#7A8063] bg-clip-text text-transparent blur-sm opacity-50"></span>
                            <span
                                className={cn(
                                    "relative bg-gradient-to-r from-[#7A8063] via-[#7A8055] to-[#7A8063] dark:from-[#7A8063] dark:via-[#7A8055] dark:to-[#7A8063] bg-clip-text text-transparent transition-all duration-300 ease-out",
                                    pacifico.className
                                )}
                            >
                                Largify AI-Bussiness-Developer
                            </span>
                            {/* Subtle shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out opacity-0 group-hover:opacity-100" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="relative z-10 flex items-center space-x-3">


                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center space-x-3 p-1 rounded-lg hover:bg-[#7A8063]/10 dark:hover:bg-[#7A8063]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7A8063]/30"
                    >
                        <div className="relative group">
                            <Avatar className="h-7 w-7 border-2 border-[#7A8063]/50 dark:border-[#7A8063]/30 group-hover:border-[#7A8055]/50 dark:group-hover:border-[#7A8055]/30 transition-all duration-300">
                                <AvatarImage src="/avatar.jpg" alt="User" />
                                <AvatarFallback className="bg-gradient-to-br from-[#7A8063]/80 to-[#7A8055]/80 dark:from-[#7A8063]/60 dark:to-[#7A8055]/60 text-white text-xs">
                                    SM
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-[#7A8055] rounded-full border-2 border-white dark:border-gray-900"></div>
                        </div>

                        <ChevronDown className={cn(
                            "w-3.5 h-3.5 text-gray-600 dark:text-gray-400 transition-transform duration-200",
                            dropdownOpen && "rotate-180"
                        )} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg border border-[#7A8063]/20 dark:border-[#7A8063]/30 overflow-hidden z-50"
                            >
                                {/* Dropdown Items */}
                                <div className="py-2">
                                    <button
                                        onClick={handleProfileClick}
                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#7A8063]/10 dark:hover:bg-[#7A8063]/20 transition-colors duration-150"
                                    >
                                        <User className="w-4 h-4 mr-3" />
                                        Profile
                                    </button>
                                    
                                    <button
                                        onClick={handleSettingsClick}
                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#7A8063]/10 dark:hover:bg-[#7A8063]/20 transition-colors duration-150"
                                    >
                                        <Settings className="w-4 h-4 mr-3" />
                                        Settings
                                    </button>
                                    
                                    <div className="border-t border-[#7A8063]/20 dark:border-[#7A8063]/30 my-1"></div>
                                    
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <LogOut className={cn(
                                            "w-4 h-4 mr-3",
                                            isLoggingOut && "animate-spin"
                                        )} />
                                        {isLoggingOut ? "Logging out..." : "Logout"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.header>
    );
}
