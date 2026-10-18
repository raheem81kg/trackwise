import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@trackwise/ui/components/breadcrumb";
import { Separator } from "@trackwise/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@trackwise/ui/components/sidebar";

import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "../../services";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
   const session = await auth.api.getSession({
      headers: await headers(),
   });

   if (!session?.user) {
      redirect("/login");
   }

   return (
      <SidebarProvider>
         <AppSidebar />
         <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
               <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-center" />
                  <Breadcrumb>
                     <BreadcrumbList>
                        <BreadcrumbItem>
                           <BreadcrumbPage>Dashboard</BreadcrumbPage>
                        </BreadcrumbItem>
                     </BreadcrumbList>
                  </Breadcrumb>
               </div>
            </header>
            <div className="flex flex-1 flex-col p-4 pt-0">{children}</div>
         </SidebarInset>
      </SidebarProvider>
   );
}
