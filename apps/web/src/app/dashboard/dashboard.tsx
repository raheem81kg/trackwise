"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@trackwise/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@trackwise/ui/components/card";
import { toast } from "@trackwise/ui/components/toast";

import type { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

import { Attachments } from "./attachments";

const toastTypes = ["success", "info", "warning", "error", "loading"] as const;

export default function Dashboard({ session }: { session: typeof authClient.$Infer.Session }) {
   const privateData = useQuery(trpc.privateData.queryOptions());

   return (
      <>
         <p>API: {privateData.data?.message}</p>
         <Card className="my-4">
            <CardHeader>
               <CardTitle>Toast tests</CardTitle>
               <CardDescription>Fire a toast of each type</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
               {toastTypes.map((type) => (
                  <Button
                     key={type}
                     variant="outline"
                     onClick={() =>
                        toast.add({
                           title: `${type[0].toUpperCase()}${type.slice(1)} toast`,
                           description: `This is a test ${type} notification.`,
                           type,
                        })
                     }
                  >
                     {type}
                  </Button>
               ))}
               <Button
                  variant="outline"
                  onClick={() =>
                     toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
                        loading: { title: "Saving...", type: "loading" },
                        success: { title: "Saved!", type: "success" },
                        error: { title: "Failed", type: "error" },
                     })
                  }
               >
                  promise
               </Button>
            </CardContent>
         </Card>
         <Attachments currentUserId={session.user.id} />
      </>
   );
}
