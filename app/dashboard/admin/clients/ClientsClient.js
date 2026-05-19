"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function ClientsClient() {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [stats, setStats] = useState({ totalClients: 0, convertedFromLeads: 0, activeClients: 0 });
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const statusStyles = {
    active: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    inactive: "border-red-200 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
    pending: "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  };

  async function loadClients() {
    try {
      setLoadingClients(true);
      const response = await fetch("/api/clients", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load clients");
      }

      setClients(data.clients || []);

      // Calculate stats
      const total = (data.clients || []).length;
      const converted = (data.clients || []).filter((c) => c.source === "lead-conversion").length;
      const active = (data.clients || []).filter((c) => c.status === "active").length;

      setStats({
        totalClients: total,
        convertedFromLeads: converted,
        activeClients: active,
      });
    } catch (err) {
      toast.error(err.message || "Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const isValidityExpired = (validTo) => {
    if (!validTo) return false;
    return new Date(validTo) < new Date();
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString();
  };

  const formatDateForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  function openEdit(client) {
    setEditingClient(client._id);
    setEditForm({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      services: (client.services || []).join(", "),
      budget: client.budget || "",
      requirement: client.requirement || "",
      validFrom: formatDateForInput(client.validFrom),
      validTo: formatDateForInput(client.validTo),
      finalBudget: client.finalBudget || "",
      projectName: client.projectName || "",
      projectDescription: client.projectDescription || "",
      status: client.status || "active",
    });
    setEditError("");
  }

  function closeEdit() {
    setEditingClient(null);
    setEditForm({});
    setEditError("");
  }

  async function handleSaveEdit() {
    if (!editForm.name || !editForm.email || !editForm.phone || !editForm.finalBudget) {
      setEditError("Name, email, phone, and final budget are required.");
      return;
    }

    if (editForm.validFrom && editForm.validTo) {
      const fromDate = new Date(editForm.validFrom);
      const toDate = new Date(editForm.validTo);
      if (fromDate >= toDate) {
        setEditError("Contract ending date must be after starting date.");
        return;
      }
    }

    setIsSaving(true);
    setEditError("");

    try {
      const response = await fetch("/api/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: editingClient,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          services: editForm.services
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          budget: editForm.budget,
          requirement: editForm.requirement,
          validFrom: editForm.validFrom,
          validTo: editForm.validTo,
          finalBudget: editForm.finalBudget,
          projectName: editForm.projectName,
          projectDescription: editForm.projectDescription,
          status: editForm.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update client");
      }

      toast.success("Client updated successfully.");
      closeEdit();
      await loadClients();
    } catch (err) {
      setEditError(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-cyan-400">{stats.totalClients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Converted from Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">{stats.convertedFromLeads}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">{stats.activeClients}</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card className="border border-border bg-card text-card-foreground shadow-sm">
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>All Clients - Click Edit to modify information</CardDescription>
        </CardHeader>

        <CardContent>
          {loadingClients ? (
            <p className="text-gray-400">Loading clients...</p>
          ) : clients.length === 0 ? (
            <p className="text-gray-400">No clients found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
              <table className="min-w-full w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30 text-foreground/80">
                    <th className="py-3 pl-3 pr-2 text-xs font-semibold">Name</th>
                    <th className="py-3 pr-2 text-xs font-semibold">Contact</th>
                    <th className="py-3 pr-2 text-xs font-semibold">Services</th>
                    <th className="py-3 pr-2 text-xs font-semibold">Budget</th>
                    <th className="py-3 pr-2 text-xs font-semibold">Project</th>
                    <th className="py-3 pr-2 text-xs font-semibold">Validity</th>
                    <th className="py-3 pr-2 text-xs font-semibold">Source</th>
                    <th className="py-3 pr-2 text-xs font-semibold">Requirement</th>
                    <th className="py-3 pr-2 text-xs font-semibold">Created / Converted</th>
                    <th className="py-3 pr-2 text-xs font-semibold">Status</th>
                    <th className="py-3 pr-3 text-xs font-semibold text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {clients.map((client) => {
                    const expired = isValidityExpired(client.validTo);
                    const sourceValue = String(client.source || "manual-admin").trim();
                    const isLeadSource = sourceValue.toLowerCase() === "lead-conversion";
                    const isManualSource = sourceValue.toLowerCase() === "manual-admin";
                    const sourceLabel = isLeadSource
                      ? "From Lead"
                      : isManualSource
                        ? "Manual"
                        : sourceValue;
                    return (
                      <tr key={client._id} className="border-b border-border/60 align-top hover:bg-muted/40 transition-colors">
                        <td className="py-3 pl-3 pr-2">
                          <p className="break-words font-medium">{client.name}</p>
                        </td>
                        <td className="py-3 pr-2">
                          <p className="break-all text-xs">{client.email}</p>
                          <p className="text-xs text-muted-foreground break-all">{client.phone || "N/A"}</p>
                        </td>
                        <td className="py-3 pr-2">
                          <p className="break-words text-xs">{(client.services || []).join(", ") || "N/A"}</p>
                        </td>
                        <td className="py-3 pr-2">
                          <p className="text-xs font-semibold text-foreground">
                            {client.finalBudget || "N/A"}
                          </p>
                          {client.budget && (
                            <p className="text-xs text-muted-foreground">Initial: {client.budget}</p>
                          )}
                        </td>
                        <td className="py-3 pr-2">
                          <p className="text-xs break-words">
                            {client.projectName ? (
                              <>
                                <span className="font-medium">{client.projectName}</span>
                                {client.projectDescription && (
                                  <p className="text-xs text-muted-foreground mt-1">{client.projectDescription.substring(0, 50)}...</p>
                                )}
                              </>
                            ) : (
                              "N/A"
                            )}
                          </p>
                        </td>
                        <td className="py-3 pr-2">
                          <p className={`text-xs ${expired ? "text-red-400" : "text-emerald-400"}`}>
                            {formatDate(client.validFrom)}
                            <br />
                            to
                            <br />
                            {formatDate(client.validTo)}
                          </p>
                          {expired && <p className="text-xs text-red-400 font-semibold">EXPIRED</p>}
                        </td>
                        <td className="py-3 pr-2">
                          <p className="text-xs">
                            <span
                              className={`inline-block rounded-full px-2 py-1 ${
                                isLeadSource
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : isManualSource
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "bg-slate-500/20 text-slate-200"
                              }`}
                            >
                              {sourceLabel || "Manual"}
                            </span>
                          </p>
                        </td>
                        <td className="py-3 pr-2">
                          <p className="text-xs text-muted-foreground">
                            {client.requirement ? `${client.requirement.substring(0, 60)}${client.requirement.length > 60 ? "..." : ""}` : "N/A"}
                          </p>
                        </td>
                        <td className="py-3 pr-2">
                          <p className="text-xs text-muted-foreground">
                            Created: {client.createdBy?.name || client.createdBy?.email || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Converted: {client.convertedBy?.name || client.convertedBy?.email || "N/A"}
                          </p>
                        </td>
                        <td className="py-3 pr-2">
                          {(() => {
                            const status = String(client.status || (client.isActive ? "active" : "inactive")).toLowerCase();
                            const statusClass = statusStyles[status] || statusStyles.inactive;

                            return (
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass}`}>
                                {status}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 border-border bg-popover text-popover-foreground">
                              <DropdownMenuItem onClick={() => openEdit(client)} className="cursor-pointer gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteUser(client._id)} className="cursor-pointer gap-2 text-red-500 focus:text-red-500">
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border bg-card text-card-foreground shadow-2xl">
            <CardHeader>
              <CardTitle>Edit Client Information</CardTitle>
              <CardDescription>Update client details</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name*</Label>
                  <Input
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Email*</Label>
                  <Input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Phone*</Label>
                  <Input
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <select
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    value={editForm.status || "active"}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Services (comma separated)</Label>
                <Input
                  value={editForm.services || ""}
                  onChange={(e) => setEditForm({ ...editForm, services: e.target.value })}
                />
              </div>

              <div>
                <Label>Initial Budget</Label>
                <Input
                  value={editForm.budget || ""}
                  onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                />
              </div>

              <div>
                <Label>Final Budget*</Label>
                <Input
                  value={editForm.finalBudget || ""}
                  onChange={(e) => setEditForm({ ...editForm, finalBudget: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Project Name (optional)</Label>
                <Input
                  value={editForm.projectName || ""}
                  onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })}
                />
              </div>

              <div>
                <Label>Project Description (optional)</Label>
                <textarea
                  value={editForm.projectDescription || ""}
                  onChange={(e) => setEditForm({ ...editForm, projectDescription: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contract Valid From</Label>
                  <Input
                    type="date"
                    value={editForm.validFrom || ""}
                    onChange={(e) => setEditForm({ ...editForm, validFrom: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Contract Valid To</Label>
                  <Input
                    type="date"
                    value={editForm.validTo || ""}
                    onChange={(e) => setEditForm({ ...editForm, validTo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Requirement / Notes</Label>
                <textarea
                  value={editForm.requirement || ""}
                  onChange={(e) => setEditForm({ ...editForm, requirement: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>

              {editError && <p className="text-sm text-red-400">{editError}</p>}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
