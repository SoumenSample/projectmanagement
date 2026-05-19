"use client"

import { Eye, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import React from "react"

const transactions = [
  {
    id: "TXN-001",
    customer: {
      name: "Olivia Martin",
      email: "olivia.martin@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=female-7",
    },
    amount: "₹1,999.00",
    status: "completed",
    date: "2 hours ago",
  },
  {
    id: "TXN-002",
    customer: {
      name: "Jackson Lee",
      email: "jackson.lee@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=male-1",
    },
    amount: "₹2,999.00",
    status: "pending",
    date: "5 hours ago",
  },
  {
    id: "TXN-003",
    customer: {
      name: "Isabella Nguyen",
      email: "isabella.nguyen@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=female-2",
    },
    amount: "₹39.00",
    status: "completed",
    date: "1 day ago",
  },
  {
    id: "TXN-004",
    customer: {
      name: "William Kim",
      email: "will@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=male-5",
    },
    amount: "₹299.00",
    status: "failed",
    date: "2 days ago",
  },
  {
    id: "TXN-005",
    customer: {
      name: "Sofia Davis",
      email: "sofia.davis@email.com",
      avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=female-4",
    },
    amount: "₹99.00",
    status: "completed",
    date: "3 days ago",
  },
]

export function RecentTransactions() {
  const [clients, setClients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const statusStyles = {
    active: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    inactive: "border-red-200 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
  };

  React.useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (res.ok && data.clients) {
          setClients(data.clients);
        } else {
          setError(data.error || "Failed to fetch clients");
        }
      } catch {
        setError("Failed to fetch clients");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="">All Clients</CardTitle>
          <CardDescription className="">List of all clients with details</CardDescription>
        </div>
        {/* <Button variant="outline" size="sm" className="cursor-pointer">
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button> */}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="text-gray-400">Loading clients...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : clients.length === 0 ? (
          <div className="text-gray-400">No clients found.</div>
        ) : (
          <table className="min-w-[900px] w-full table-auto border border-border text-left text-sm">
            <thead>
              <tr className="bg-muted/60">
                <th className="p-2 border-b border-border/70">Name</th>
                <th className="p-2 border-b border-border/70">Email</th>
                <th className="p-2 border-b border-border/70">Phone</th>
                <th className="p-2 border-b border-border/70">Services</th>
                <th className="p-2 border-b border-border/70">Budget</th>
                <th className="p-2 border-b border-border/70">Status</th>
                <th className="p-2 border-b border-border/70">Created</th>
                {/* <th className="p-2 border-b border-border/70">Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client._id || client.email} className="border-b border-border/70 hover:bg-muted/40">
                  <td className="p-2 font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage className="" src={client.avatar || undefined} alt={client.name} />
                        <AvatarFallback className="">{client.name?.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      {client.name}
                    </div>
                  </td>
                  <td className="p-2">{client.email}</td>
                  <td className="p-2">{client.phone || <span className="text-muted-foreground">N/A</span>}</td>
                  <td className="p-2">{client.services && client.services.length > 0 ? client.services.join(", ") : <span className="text-muted-foreground">N/A</span>}</td>
                  <td className="p-2">{client.budget || <span className="text-muted-foreground">N/A</span>}</td>
                  <td className="p-2">
                    {(() => {
                      const status = String(client.status || "inactive").toLowerCase();
                      const statusClass = statusStyles[status] || statusStyles.inactive;

                      return (
                        <Badge variant="outline" className={`cursor-pointer ${statusClass}`}>
                          {status}
                        </Badge>
                      );
                    })()}
                  </td>
                  <td className="p-2">{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : <span className="text-muted-foreground">N/A</span>}</td>
                  {/* <td className="p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Contact Client</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}