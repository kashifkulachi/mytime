"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BrainCircuit,
  Calendar,
  File,
  Fingerprint,
  Folder,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Generate Report",
    href: "/dashboard/get-report",
    icon: File,
  },
  {
    name: "Health Analysis",
    href: "/dashboard/health-analysis",
    icon: Fingerprint,
  },
  {
    name: "Appointments",
    href: "/dashboard/appointments",
    icon: Calendar,
  },
  {
    name: "Medical Records",
    href: "/dashboard/medical-records",
    icon: Folder,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className=" z-[60] w-10 h-10 fixed ml-6 mt-6 rounded-lg border border-outline-variant bg-black p-2 shadow-md lg:hidden"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={` inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 transform flex-col border-r border-outline-variant/30 bg-white py-6 shadow-xl shadow-primary/5 transition-transform duration-300 ease-in-out dark:border-outline/10 dark:bg-inverse-surface

        ${open ? "translate-x-0" : "-translate-x-full"}

        lg:translate-x-0`}
      >
        {/* Header */}
        <div className="mb-10 flex items-center justify-between px-6">
          <div>
            <h1 className="font-headline text-headline-md font-bold text-primary dark:text-primary-fixed">
              Digital
            </h1>
            <p className="font-label text-label-md text-on-surface-variant">
              Wellness
            </p>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="cursor-pointer lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-5 py-3 transition-all duration-300

                ${
                  isActive
                    ? "bg-secondary text-white shadow-lg shadow-primary/20"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-300 ${
                    !isActive ? "group-hover:scale-110" : ""
                  }`}
                />

                <span className="font-medium">{item.name}</span>

                {isActive && (
                  <div className="absolute right-3 h-2 w-2 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto px-6">
          <div className="space-y-2 border-t border-outline-variant/30 pt-6">
            <Link
              href="/support"
              className="flex items-center gap-3 py-3 text-on-surface-variant transition-colors duration-300 hover:text-on-surface"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Support</span>
            </Link>

            <Link
              href="/logout"
              className="flex items-center gap-3 py-3 text-on-surface-variant transition-colors duration-300 hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
              <File className="h-5 w-5" />
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
