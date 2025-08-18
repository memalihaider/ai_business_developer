/**
 * @description: Enhanced Header with professional styling and theme toggle for POS
 * @version: 2.0.0
 * @date: 2025-01-27
 */

"use client";
import { useState, useEffect } from "react";
import { Menu, Bell, Moon, Sun, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Pacifico } from "next/font/google";

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
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationCount] = useState(2);

    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const isDark = localStorage.getItem("theme") === "dark";
        setDarkMode(isDark);
        document.documentElement.classList.toggle("dark", isDark);
    }, []);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem("theme", newMode ? "dark" : "light");
        document.documentElement.classList.toggle("dark", newMode);
    };

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
                {/* Notifications */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 rounded-lg bg-gradient-to-r from-[#7A8063]/10 to-[#7A8063]/5 dark:from-[#7A8063]/20 dark:to-[#7A8063]/10 hover:from-[#7A8055]/20 hover:to-[#7A8055]/10 dark:hover:from-[#7A8055]/30 dark:hover:to-[#7A8055]/20 transition-all duration-300 shadow-sm hover:shadow-md border border-[#7A8063]/10 dark:border-[#7A8063]/20"
                    >
                        <Bell className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                        {notificationCount > 0 && (
                            <span className="absolute top-0 right-0 flex h-5 w-5 -mt-1 -mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7A8063] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#7A8055] text-[10px] text-white font-medium justify-center items-center">
                                    {notificationCount}
                                </span>
                            </span>
                        )}
                    </motion.button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg border border-[#7A8063]/30 dark:border-[#7A8063]/30 z-50"
                        >
                            <div className="p-4 border-b border-[#7A8063]/30 dark:border-[#7A8063]/30">
                                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    Notifications
                                </h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="p-3 hover:bg-[#7A8055]/10 transition-colors duration-200 border-b border-[#7A8063]/20 dark:border-[#7A8063]/20">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        New sale completed
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Order #1234 has been processed successfully
                                    </p>
                                    <p className="text-xs text-[#7A8063] dark:text-[#7A8063] mt-1">
                                        2 minutes ago
                                    </p>
                                </div>
                                <div className="p-3 hover:bg-[#7A8055]/10 transition-colors duration-200">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        Low stock alert
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Product 'Coffee Beans' is running low
                                    </p>
                                    <p className="text-xs text-[#7A8063] dark:text-[#7A8063] mt-1">
                                        15 minutes ago
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Theme Toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-gradient-to-r from-[#7A8063]/10 to-[#7A8063]/5 dark:from-[#7A8063]/20 dark:to-[#7A8063]/10 hover:from-[#7A8055]/20 hover:to-[#7A8055]/10 dark:hover:from-[#7A8055]/30 dark:hover:to-[#7A8055]/20 transition-all duration-300 shadow-sm hover:shadow-md border border-[#7A8063]/10 dark:border-[#7A8063]/20"
                >
                    {darkMode ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5 text-yellow-400"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 2a1 1 0 0 1 1 1v1.26a9 9 0 1 1-2 0V3a1 1 0 0 1 1-1z" />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2m0 18v2m9-9h-2M5 12H3m15.54 6.36l-1.41-1.41M6.34 6.34L4.93 4.93m0 14.14 1.41-1.41m12.02-12.02-1.41 1.41" />
                        </svg>
                    )}
                </motion.button>

                {/* User Profile */}
                <div className="flex items-center space-x-3">
                    <div className="relative group">
                        <Avatar className="h-7 w-7 border-2 border-[#7A8063]/50 dark:border-[#7A8063]/30 group-hover:border-[#7A8055]/50 dark:group-hover:border-[#7A8055]/30 transition-all duration-300">
                            <AvatarImage src="/avatar.jpg" alt="User" />
                            <AvatarFallback className="bg-gradient-to-br from-[#7A8063]/80 to-[#7A8055]/80 dark:from-[#7A8063]/60 dark:to-[#7A8055]/60 text-white text-xs">
                                SM
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-[#7A8055] rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>

                    <ChevronDown className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                </div>
            </div>
        </motion.header>
    );
}
