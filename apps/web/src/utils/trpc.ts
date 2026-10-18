import { QueryCache, QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "@trackwise/api/routers/index";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "@trackwise/ui/components/toast";

export const queryClient = new QueryClient({
   queryCache: new QueryCache({
      onError: (error, query) => {
         toast.add({
            title: "Something went wrong",
            description: error.message,
            type: "error",
         });
      },
   }),
});

const trpcClient = createTRPCClient<AppRouter>({
   links: [
      httpBatchLink({
         url: "/api/trpc",
         fetch(url, options) {
            return fetch(url, {
               ...options,
               credentials: "include",
            });
         },
      }),
   ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
   client: trpcClient,
   queryClient,
});
