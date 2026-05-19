"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.string().min(1, {
    message: "Please select a role.",
  }),
  plan: z.string().min(1, {
    message: "Please select a plan.",
  }),
  billing: z.string().min(1, {
    message: "Please select a billing method.",
  }),
  status: z.string().min(1, {
    message: "Please select a status.",
  }),
})

type UserFormValues = z.infer<typeof userFormSchema>

interface UserFormDialogProps {
  onAddUser: (user: UserFormValues) => void
}

export function UserFormDialog({ onAddUser }: UserFormDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      plan: "",
      billing: "",
      status: "",
    },
  })

  function onSubmit(data: UserFormValues) {
    onAddUser(data)
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="">
          <DialogTitle className="">Add New User</DialogTitle>
          <DialogDescription className="">
            Create a new user account. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage className="">{""}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage>{""}</FormMessage>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="">
                        <SelectItem className="" value="Admin">Admin</SelectItem>
                        <SelectItem className="" value="Author">Author</SelectItem>
                        <SelectItem className="" value="Editor">Editor</SelectItem>
                        <SelectItem className="" value="Maintainer">Maintainer</SelectItem>
                        <SelectItem className="" value="Subscriber">Subscriber</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>{""}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="">
                        <SelectItem className="" value="Basic">Basic</SelectItem>
                        <SelectItem className="" value="Professional">Professional</SelectItem>
                        <SelectItem className="" value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>{""}</FormMessage>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Select billing" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="">
                        <SelectItem  className=""value="Auto Debit">Auto Debit</SelectItem>
                        <SelectItem className="" value="UPI">UPI</SelectItem>
                        <SelectItem className="" value="Paypal">Paypal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>{""}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="">
                        <SelectItem className="" value="Active">Active</SelectItem>
                        <SelectItem className="" value="Pending">Pending</SelectItem>
                        <SelectItem className="" value="Error">Error</SelectItem>
                        <SelectItem className="" value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>{""}</FormMessage>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="">
              <Button type="submit" className="cursor-pointer">
                Save User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}