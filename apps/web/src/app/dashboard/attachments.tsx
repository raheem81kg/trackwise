"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@trackwise/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@trackwise/ui/components/card";
import { Download, Loader2, Paperclip, Trash2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "@trackwise/ui/components/toast";

import { trpc } from "@/utils/trpc";

export function Attachments({ currentUserId }: { currentUserId: string }) {
   const fileInputRef = useRef<HTMLInputElement>(null);
   const attachments = useQuery(trpc.attachment.list.queryOptions());
   const createUpload = useMutation(trpc.attachment.createUpload.mutationOptions());
   const completeUpload = useMutation(trpc.attachment.completeUpload.mutationOptions());
   const download = useMutation(
      trpc.attachment.download.mutationOptions({
         onSuccess: ({ url }) => window.location.assign(url),
         onError: (error) => toast.add({ title: error.message, type: "error" }),
      }),
   );
   const remove = useMutation(
      trpc.attachment.delete.mutationOptions({
         onSuccess: async () => {
            await attachments.refetch();
            toast.add({ title: "Attachment deleted", type: "success" });
         },
         onError: (error) => toast.add({ title: error.message, type: "error" }),
      }),
   );
   const uploading = createUpload.isPending || completeUpload.isPending;

   async function upload(file: File) {
      try {
         const pending = await createUpload.mutateAsync({
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
         });
         const response = await fetch(pending.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
         });
         if (!response.ok) throw new Error("File upload failed");
         await completeUpload.mutateAsync({ attachmentId: pending.id });
         await attachments.refetch();
         toast.add({ title: "Attachment uploaded", type: "success" });
      } catch (error) {
         toast.add({
            title: error instanceof Error ? error.message : "File upload failed",
            type: "error",
         });
      }
   }

   return (
      <Card className="mt-6 w-full max-w-md">
         <CardHeader>
            <div className="flex items-center justify-between gap-2">
               <div>
                  <CardTitle>Attachments</CardTitle>
                  <CardDescription>Up to 10 files, 10 MB each.</CardDescription>
               </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading || (attachments.data?.length ?? 0) >= 10}
                  title="Upload a file"
                  onClick={() => fileInputRef.current?.click()}
               >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />} Attach
               </Button>
               <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  disabled={uploading}
                  accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                  onChange={(event) => {
                     const file = event.target.files?.[0];
                     if (file) void upload(file);
                     event.target.value = "";
                  }}
               />
            </div>
         </CardHeader>
         <CardContent>
            {attachments.isLoading ? (
               <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
               </div>
            ) : attachments.data?.length === 0 ? (
               <p className="py-4 text-center text-sm">No files yet. Upload one above!</p>
            ) : (
               <ul className="space-y-2">
                  {attachments.data?.map((item) => (
                     <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                        <div className="min-w-0">
                           <span className="block truncate">{item.fileName}</span>
                           <span className="text-muted-foreground text-xs">
                              uploaded by {item.uploadedByName}
                              {item.uploadedById === currentUserId ? " (you)" : ""}
                           </span>
                        </div>
                        <div className="flex gap-1">
                           <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={`Download ${item.fileName}`}
                              onClick={() => download.mutate({ attachmentId: item.id })}
                           >
                              <Download className="h-4 w-4" />
                           </Button>
                           {item.uploadedById === currentUserId && (
                              <Button
                                 type="button"
                                 variant="ghost"
                                 size="icon"
                                 title={`Delete ${item.fileName}`}
                                 onClick={() => remove.mutate({ attachmentId: item.id })}
                              >
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           )}
                        </div>
                     </li>
                  ))}
               </ul>
            )}
         </CardContent>
      </Card>
   );
}
