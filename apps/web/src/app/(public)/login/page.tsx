"use client";

import { Button } from "@trackwise/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@trackwise/ui/components/card";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
   return (
      <div className="flex h-full items-center justify-center p-6">
         <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
               <CardTitle>Welcome to Trackwise</CardTitle>
               <CardDescription>Sign in with your Intellibus account</CardDescription>
            </CardHeader>
            <CardContent>
               <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                     authClient.signIn.social({
                        provider: "google",
                        callbackURL: "/dashboard",
                     })
                  }
               >
                  Continue with Google
               </Button>
            </CardContent>
         </Card>
      </div>
   );
}
