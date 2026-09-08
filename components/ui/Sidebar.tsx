// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// import {
//   Calendar,
//   File,
//   Fingerprint,
//   Folder,
//   HelpCircle,
//   LayoutDashboard,
//   Menu,
//   Settings,
//   X,
// } from "lucide-react";
// import Image from "next/image";
// import LogoutButton from "../auth/LogoutButton";

// const menuItems = [
//   {
//     name: "Dashboard",
//     href: "/dashboard",
//     icon: LayoutDashboard,
//   },
//   {
//     name: "Generate Report",
//     href: "/dashboard/get-report",
//     icon: File,
//   },
//   {
//     name: "Health Analysis",
//     href: "/dashboard/health-analysis",
//     icon: Fingerprint,
//   },
//   {
//     name: "Appointments",
//     href: "/dashboard/appointments",
//     icon: Calendar,
//   },
//   {
//     name: "Medical Records",
//     href: "/dashboard/medical-records",
//     icon: Folder,
//   },
//   {
//     name: "Settings",
//     href: "/dashboard/settings",
//     icon: Settings,
//   },
// ];

// export default function Sidebar() {
//   const pathname = usePathname();
//   const [open, setOpen] = useState(false);

//   return (
//     <>
//       {/* Mobile Hamburger */}
//       {!open && (
//         <button
//           onClick={() => setOpen(true)}
//           className=" z-[60] w-10 h-10 fixed ml-6 mt-6 rounded-lg border border-outline-variant bg-black p-2 shadow-md lg:hidden"
//         >
//           <Menu className="h-6 w-6 text-white" />
//         </button>
//       )}

//       {/* Overlay */}
//       <div
//         onClick={() => setOpen(false)}
//         className={` inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
//           open ? "visible opacity-100" : "invisible opacity-0"
//         }`}
//       />

//       {/* Sidebar */}
//       <aside
//         className={`fixed left-0 top-0 z-50 flex h-screen w-72 transform flex-col border-r border-outline-variant/30 bg-white py-6 shadow-xl shadow-primary/5 transition-transform duration-300 ease-in-out dark:border-outline/10 dark:bg-inverse-surface

//         ${open ? "translate-x-0" : "-translate-x-full"}

//         lg:translate-x-0`}
//       >
//         {/* Header */}
//         <div className="mb-10 flex items-center align-middle gap-3 justify-between px-6">
//           <Link href="/dashboard">
//             <Image
//               src="/Logo.jpg"
//               width={350}
//               height={40}
//               alt="MYTime Logo"
//               quality={100}
//               unoptimized
//               className="object-cover"
//             />
//           </Link>

//           <button
//             onClick={() => setOpen(false)}
//             className="cursor-pointer lg:hidden"
//           >
//             <X className="h-6 w-6" />
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="flex flex-1 flex-col gap-2 px-3">
//           {menuItems.map((item) => {
//             const Icon = item.icon;
//             const isActive = pathname === item.href;

//             return (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 onClick={() => setOpen(false)}
//                 className={`group relative flex items-center gap-3 rounded-xl px-5 py-3 transition-all duration-300

//                 ${
//                   isActive
//                     ? "bg-secondary text-white shadow-lg shadow-primary/20"
//                     : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
//                 }`}
//               >
//                 <Icon
//                   className={`h-5 w-5 transition-transform duration-300 ${
//                     !isActive ? "group-hover:scale-110" : ""
//                   }`}
//                 />

//                 <span className="font-medium">{item.name}</span>

//                 {isActive && (
//                   <div className="absolute right-3 h-2 w-2 rounded-full bg-white" />
//                 )}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Bottom */}
//         <div className="mt-auto px-6">
//           <div className="space-y-2 border-t border-outline-variant/30 pt-6">
//             <Link
//               href="/support"
//               className="flex items-center gap-3 py-3 text-on-surface-variant transition-colors duration-300 hover:text-on-surface"
//             >
//               <HelpCircle className="h-5 w-5" />
//               <span>Support</span>
//             </Link>

//             <LogoutButton />
//           </div>
//         </div>
//       </aside>
//     </>
//   );
// }

"use client";

import { useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  Calendar,
  ChartBar,
  File,
  FileScanIcon,
  Fingerprint,
  Folder,
  HelpCircle,
  LayoutDashboard,
  Menu,
  MonitorCheck,
  ScanFace,
  Settings,
  Stethoscope,
  UsersRound,
  X,
} from "lucide-react";

import LogoutButton from "../auth/LogoutButton";

export type SidebarUserRole = "patient" | "doctor" | "super_admin";

interface SidebarProps {
  role: SidebarUserRole;
}

interface MenuItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: SidebarUserRole[];
}

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["patient", "doctor", "super_admin"],
  },

  /**
   * ----------------------------------------------------------
   * PATIENT SELF-ASSESSMENT
   * ----------------------------------------------------------
   *
   * Current /get-report workflow creates:
   *
   * patient_id = authenticated patient
   * created_by_user_id = authenticated patient
   *
   * Therefore doctors should NOT enter this route from the
   * sidebar.
   *
   * We will build the doctor-specific patient-selected
   * assessment flow separately.
   */
  {
    name: "Generate Report",
    href: "/dashboard/get-report",
    icon: File,
    roles: ["patient"],
  },

  /**
   * Patient-facing clinical relationship management.
   *
   * Route remains /connections for now so our existing page
   * keeps working, but the UI label is intentionally "Care Team".
   */
  {
    name: "Care Team",
    href: "/dashboard/care-team",
    icon: Stethoscope,
    roles: ["patient"],
  },

  /**
   * Doctor-facing patient workspace.
   *
   * We will build this page next.
   */
  {
    name: "My Patients",
    href: "/dashboard/patients",
    icon: UsersRound,
    roles: ["doctor"],
  },

  {
    name: "Medical Records",
    href: "/dashboard/medical-records",
    icon: Folder,
    roles: ["patient", "doctor", "super_admin"],
  },

  {
    name: "IFI Monitoring",
    href: "/dashboard/settings",
    icon: ScanFace,
    roles: ["patient"],
  },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  /**
   * ----------------------------------------------------------
   * ROLE-AWARE NAVIGATION
   * ----------------------------------------------------------
   *
   * This affects only what the user sees.
   *
   * It is NOT authorization.
   *
   * APIs, requireReportAccess(), relationship checks and RLS
   * remain responsible for actual security.
   */
  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(role),
  );

  function isMenuItemActive(href: string): boolean {
    /**
     * Dashboard should match only the exact dashboard route.
     *
     * Otherwise "/dashboard" would appear active for every
     * nested dashboard page.
     */
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Mobile Hamburger */}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed ml-6 mt-6 h-10 w-10 cursor-pointer rounded-lg border border-outline-variant bg-black p-2 shadow-md z-[60] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Overlay */}

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
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

        <div className="mb-10 flex items-center justify-between gap-3 px-6 align-middle">
          <Link href="/dashboard">
            <Image
              src="/Logo.jpg"
              width={350}
              height={40}
              alt="MYTime Logo"
              quality={100}
              unoptimized
              className="object-cover"
            />
          </Link>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex flex-1 flex-col gap-2 px-3">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;

            const isActive = isMenuItemActive(item.href);

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

            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
