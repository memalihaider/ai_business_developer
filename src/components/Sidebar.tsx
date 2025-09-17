'use client';

import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  Mail,
  FolderKanban,
  Calendar,
  Kanban,
  Globe,
  Star,
  CreditCard,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Pacifico } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
});

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' }, 
 
  { icon: Users, label: 'Leads', href: '/Lead' }, 
  { icon: Users, label: 'Clients', href: '/clients' }, 
  
  { icon: FolderKanban, label: 'Portfolio & Case Studies', href: '/portfolio' }, 

  { 
    label: "Team Management", 
    icon: UserCog, 
    href: "/team-management",
    subItems: [
      { label: "Dashboard", href: "/team-management" },
      { label: "Team Members", href: "/team-management/members" },
      { label: "Add Team Member", href: "/team-management/add-member" },
      { label: "Projects", href: "/team-management/projects" },
      { label: "Add Project", href: "/team-management/add-project" },
      { label: "Assignments", href: "/team-management/assignments" },
    ]
  },

  { 
    label: "Proposal & Quotation", 
    icon: FileText,
    href: "/proposals",
    subItems:[
      { label: "Proposal Builder", href: "/proposals/builder" },
      { label: "Quotation Generator", href: "/proposals/quotation" },
      { label: "Tracking & Analytics", href: "/proposals/tracking" },
      { label: "Templates Library", href: "/proposals/templates" },
    ]
  },
  { 
    label: "Email & Follow-up", 
    icon: Mail, 
    href: "/email",
    subItems: [
      { label: "Email Composer", href: "/email/composer" },
      { label: "Follow-up Scheduler", href: "/email/followups" },
    ] 
  },

  { 
  label: "Social Content", 
  icon: Calendar, 
  href: "/social-content-engine",
  subItems: [
    { label: "Content Ideas", href: "/social-content-engine/contentIdeas" },
    
    { label: "SEO SuggessionsS", href: "/social-content-engine/seoSuggestions" },
  ]
}, 
  { icon: Kanban, label: 'CRM Pipeline', href: '/pipeline' }, 
  { icon: Globe, label: 'Opportunities', href: '/opportunities' }, 
 
  { icon: CreditCard, label: 'Payments & Invoicing', href: '/payments' }, 
  { icon: BarChart3, label: 'Reports & Insights', href: '/reports' }, 
  { icon: Settings, label: 'Settings', href: '/settings' }, 
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const isMenuItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleSubmenu = (href: string) => {
    setOpenMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: collapsed ? '54px' : '176px',
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
      className={cn(
        'fixed left-0 top-0 z-50 flex flex-col h-[95vh] m-2',
        'shadow-lg dark:shadow-xl rounded-2xl overflow-hidden',
        'bg-white/95 dark:bg-black/85 backdrop-blur-sm',
        'border border-[#7A8063]/20 dark:border-[#7A8063]/10'
      )}
    >
      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full px-2 py-6 items-center">
        {/* Logo */}
        <motion.div
          className="flex-shrink-0 flex items-center justify-center py-4 mb-4 mx-auto"
          layout
          transition={{ duration: 0.15 }}
        >
          <span
            className={cn(
              'bg-clip-text text-transparent bg-gradient-to-r from-[#7A8063] to-[#7A8063] dark:from-[#7A8063] dark:to-[#7A8063] text-center',
              collapsed ? 'text-base' : 'text-lg',
              pacifico.className
            )}
          >
            {collapsed ? 'L' : 'Largify AI Business Developer'}
          </span>
        </motion.div>

        {/* Navigation */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-1 w-full">
          <nav className="flex flex-col space-y-1.5">
            {navItems.map(({ icon: Icon, label, href, subItems }, index) => {
              const isActive = isMenuItemActive(href);
              const isOpen = openMenus.includes(href);

              return (
                <div key={index}>
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.div
                      layout
                      transition={{ duration: 0.15 }}
                      onClick={() =>
                        subItems ? toggleSubmenu(href) : router.push(href)
                      }
                      suppressHydrationWarning
                      className={cn(
                        'flex items-center px-2.5 py-1.5 rounded-xl cursor-pointer',
                        collapsed && 'justify-center',
                        isActive
                          ? 'bg-[#7A8063]/20 text-[#7A8063] dark:bg-[#7A8063]/30 dark:text-[#7A8063]'
                          : 'hover:bg-[#7A8055]/10 dark:hover:bg-[#7A8055]/20'
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center">
                            <Icon
                              className={cn(
                                'w-3.5 h-3.5',
                                isActive
                                  ? 'text-[#7A8063] dark:text-[#7A8063]'
                                  : 'text-[#7A8063] dark:text-[#7A8055]'
                              )}
                            />
                          </div>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent
                            side="right"
                            className="bg-white dark:bg-gray-900 border border-[#7A8063]/20 shadow-lg"
                          >
                            <span>{label}</span>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between w-full ml-3"
                        >
                          <span
                            className={cn(
                              'text-[10px] font-medium',
                              isActive
                                ? 'text-[#7A8063] dark:text-[#7A8063]'
                                : 'text-gray-700 dark:text-gray-300'
                            )}
                          >
                            {label}
                          </span>

                          {subItems && (
                            <span>
                              {isOpen ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Submenu */}
                  <AnimatePresence>
                    {!collapsed && subItems && isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-8 mt-1 space-y-1 overflow-hidden"
                      >
                        {subItems.map((sub, i) => (
                          <li
                            key={i}
                            onClick={() => router.push(sub.href)}
                            className={cn(
                              'px-2 py-1 text-[10px] rounded-md cursor-pointer',
                              pathname === sub.href
                                ? 'bg-[#7A8063]/20 text-[#7A8063]'
                                : 'hover:bg-[#7A8055]/10 dark:hover:bg-[#7A8055]/20 text-gray-600 dark:text-gray-400'
                            )}
                          >
                            {sub.label}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Decorative Element */}
        <motion.div layout className="mt-4 flex justify-center">
          <div className="w-12 h-0.5 bg-[#7A8063]/30 rounded-full" />
        </motion.div>
      </div>
    </motion.div>
  );
}
