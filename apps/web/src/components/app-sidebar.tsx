"use client";

import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarGroup,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarRail,
} from "@trackwise/ui/components/sidebar";
import { LayoutDashboardIcon, PaperclipIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const items = [
   { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
   { to: "/dashboard#attachments", label: "Attachments", icon: PaperclipIcon },
] as const;

export function AppSidebar() {
   const pathname = usePathname();

   return (
      <Sidebar collapsible="icon">
         <SidebarHeader>
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
                     <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/30">
                        <span className="cn-font-heading font-extrabold text-base leading-none">T</span>
                     </div>
                     <div className="flex flex-col gap-0.5 leading-none">
                        <span className="cn-font-heading font-extrabold text-foreground text-lg tracking-tight">Trackwise</span>
                     </div>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarHeader>
         <SidebarContent>
            <SidebarGroup>
               <SidebarGroupLabel>Menu</SidebarGroupLabel>
               <SidebarGroupContent>
                  <SidebarMenu>
                     {items.map(({ to, label, icon: Icon }) => (
                        <SidebarMenuItem key={to}>
                           <SidebarMenuButton render={<Link href={to} />} isActive={pathname === to} tooltip={label}>
                              <Icon />
                              <span>{label}</span>
                           </SidebarMenuButton>
                        </SidebarMenuItem>
                     ))}
                  </SidebarMenu>
               </SidebarGroupContent>
            </SidebarGroup>
         </SidebarContent>
         <SidebarFooter>
            <SidebarMenu>
               <SidebarMenuItem>
                  <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                     <UserMenu />
                     <ModeToggle />
                  </div>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarFooter>
         <SidebarRail />
      </Sidebar>
   );
}
