"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { getCookie } from "@/utils";
const formSchema = z
  .object({
    updateType: z.enum(["stage", "result","joined"]),
    stage: z.string().optional(),
    status: z.boolean().optional(),
    final_result: z.string().optional(),
    joined: z.string().optional(),
  })

interface BulkUpdateDialogProps {
  applicationIds: string[];
  onSuccess: () => void;
}

export function BulkUpdateDialog({
  applicationIds,
  onSuccess,
}: BulkUpdateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      updateType: "stage",
      status: true,
    },
  });

  const updateType = form.watch("updateType");
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const apiBody: {
      application_ids: string[];
      stage?: string;
      status?: boolean;
      final_result?: string;
      joined?: string;
    } = { application_ids: applicationIds };

    if (values.updateType === "stage") {
      apiBody.stage = values.stage;
      apiBody.status = values.status;
    } else if (values.updateType === "joined") {
      apiBody.joined = "joined";
    }
     else {
      apiBody.final_result = values.final_result;
    }
    try {
      const csrfToken = getCookie("csrftoken");
      const response = await fetch("/api/staff/company/bulk-update-progress/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        }, // Add any auth headers
        body: JSON.stringify(apiBody),
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update progress.");
      }

      const result = await response.json();
      toast.success(
        `Successfully updated ${result.updated_count} students. ${result.offers_created} offers created.`
      );
      onSuccess();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={applicationIds.length === 0}>
          Bulk Update ({applicationIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Update Progress</DialogTitle>
          <DialogDescription>
            Update the placement progress for {applicationIds.length} selected
            students.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="updateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="text-black">
                        <SelectValue placeholder="Select update type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stage">Update a Stage</SelectItem>
                      <SelectItem value="result">Set Final Result</SelectItem>
                      <SelectItem value="joined">Mark as Joined</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {updateType === "stage" && (
              <>
                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-black">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aptitude_test">
                            Aptitude Test
                          </SelectItem>
                          <SelectItem value="coding_test">
                            Coding Test
                          </SelectItem>
                          <SelectItem value="gd">
                            Group Discussion
                          </SelectItem>
                          <SelectItem value="technical_interview">
                            Technical Interview
                          </SelectItem>
                          <SelectItem value="hr_interview">
                            HR Interview
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel>Mark as "Passed"</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {updateType === "result" && (
              <FormField
                control={form.control}
                name="final_result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Result</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-black">
                          <SelectValue placeholder="Select final result" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Selected">Selected</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Update
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
