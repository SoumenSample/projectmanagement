"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LeadsClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    services: "",
    requirement: "",
    budget: "",
    nextFollowUpDate: "",
  });

  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [convertingLeadId, setConvertingLeadId] = useState(null);
  const [convertDates, setConvertDates] = useState({});
  const [showConvertModal, setShowConvertModal] = useState(null);
  const [convertedCount, setConvertedCount] = useState(0);
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    services: "",
    requirement: "",
    budget: "",
    nextFollowUpDate: "",
  });
  const [editError, setEditError] = useState("");
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState(null);

  const serviceListPreview = useMemo(() => {
    return formData.services
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [formData.services]);

  async function loadLeads() {
    try {
      setLoadingLeads(true);
      setError("");

      const response = await fetch("/api/leads", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load leads");
      }

      setLeads(data.leads || []);

      // Calculate converted count
      const converted = (data.leads || []).filter((lead) => lead.convertedToClient).length;
      setConvertedCount(converted);
    } catch (err) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoadingLeads(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  function onFieldChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const services = formData.services
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (services.length === 0) {
      setError("Please provide at least one service.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          services,
          source: "manual-admin",
          nextFollowUpDate: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      setMessage("Lead added successfully.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        services: "",
        requirement: "",
        budget: "",
        nextFollowUpDate: "",
      });

      await loadLeads();
    } catch (err) {
      setError(err.message || "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConvertToClient(leadId) {
    const leadToConvert = leads.find((lead) => lead._id === leadId);
    const email = String(convertDates[leadId]?.email ?? leadToConvert?.email ?? "").trim().toLowerCase();

    const password = convertDates[leadId]?.password;
    const from = convertDates[leadId]?.from;
    const to = convertDates[leadId]?.to;
    const finalBudget = convertDates[leadId]?.finalBudget;
    const projectName = convertDates[leadId]?.projectName || "";
    const projectDescription = convertDates[leadId]?.projectDescription || "";

    if (!email) {
      setError("Email is required to convert this lead.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!from || !to) {
      setError("Please provide both valid from and valid to dates.");
      return;
    }

    if (!finalBudget || finalBudget.trim().length === 0) {
      setError("Final budget is required.");
      return;
    }

    // Compare dates - to must be after from
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    if (fromDate >= toDate) {
      setError("Valid To date must be after Valid From date.");
      return;
    }

    setConvertingLeadId(leadId);
    setError("");

    try {
      const response = await fetch(`/api/leads/convert/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          email,
          validFrom: from,
          validTo: to,
          finalBudget,
          projectName,
          projectDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert lead");
      }

      toast.success("Lead converted to client successfully.");
      setShowConvertModal(null);
      setConvertDates({});

      await loadLeads();
    } catch (err) {
      setError(err.message || "Failed to convert lead");
    } finally {
      setConvertingLeadId(null);
    }
  }

  function openEditModal(lead) {
    setEditingLead(lead);
    const followUpDate = lead?.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().split('T')[0] : "";
    setEditForm({
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      services: (lead?.services || []).join(", "),
      requirement: lead?.requirement || "",
      budget: lead?.budget || "",
      nextFollowUpDate: followUpDate,
    });
    setEditError("");
  }

  function onEditFieldChange(event) {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateLead() {
    if (!editingLead?._id) return;

    const services = editForm.services
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (services.length === 0) {
      setEditError("Please provide at least one service.");
      return;
    }

    setIsUpdatingLead(true);
    setEditError("");

    try {
      const response = await fetch(`/api/leads/${editingLead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          services,
          requirement: editForm.requirement,
          budget: editForm.budget,
          nextFollowUpDate: editForm.nextFollowUpDate ? new Date(editForm.nextFollowUpDate).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lead");
      }

      toast.success("Lead updated successfully.");
      setEditingLead(null);
      await loadLeads();
    } catch (err) {
      setEditError(err.message || "Failed to update lead");
    } finally {
      setIsUpdatingLead(false);
    }
  }

  async function handleDeleteLead(lead) {
    if (!lead?._id) return;

    const confirmed = window.confirm("Delete this lead? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingLeadId(lead._id);

    try {
      const response = await fetch(`/api/leads/${lead._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete lead");
      }

      toast.success("Lead deleted successfully.");
      await loadLeads();
    } catch (err) {
      toast.error(err.message || "Failed to delete lead");
    } finally {
      setDeletingLeadId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-cyan-400">{leads.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Converted to Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">{convertedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[30%_70%]">
        <Card>
          <CardHeader>
            <CardTitle>Add Lead</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input name="name" value={formData.name} onChange={onFieldChange} required />
              </div>

              <div>
                <Label>Email (optional)</Label>
                <Input name="email" type="email" value={formData.email} onChange={onFieldChange} />
              </div>

              <div>
                <Label>Phone</Label>
                <Input name="phone" value={formData.phone} onChange={onFieldChange} required />
              </div>

              <div>
                <Label>Services (comma separated)</Label>
                <Input
                  name="services"
                  value={formData.services}
                  onChange={onFieldChange}
                  placeholder="Web Development, UI/UX Design"
                  required
                />
                {serviceListPreview.length > 0 && (
                  <p className="mt-2 text-xs text-cyan-200/80">Selected: {serviceListPreview.join(", ")}</p>
                )}
              </div>

              <div>
                <Label>Budget</Label>
                <Input name="budget" value={formData.budget} onChange={onFieldChange} placeholder="Optional" />
              </div>

              <div>
                <Label>Next Follow-up Date (optional)</Label>
                <Input name="nextFollowUpDate" type="date" value={formData.nextFollowUpDate} onChange={onFieldChange} />
              </div>

              <div>
                <Label>Requirement</Label>
                <textarea
                  name="requirement"
                  value={formData.requirement}
                  onChange={onFieldChange}
                  rows={4}
                  className="w-full rounded-md border border-cyan-500/30 bg-black/60 px-3 py-2 text-sm text-cyan-100"
                  placeholder="Optional details"
                />
              </div>

              {message && <p className="text-sm text-emerald-400">{message}</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Add Lead"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
            <CardDescription>All leads.</CardDescription>
          </CardHeader>

          <CardContent>
            {loadingLeads ? (
              <p className="text-gray-400">Loading leads...</p>
            ) : leads.length === 0 ? (
              <p className="text-gray-400">No leads found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[920px] w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[18%]" />
                    <col className="w-[16%]" />
                    <col className="w-[10%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-cyan-500/20 text-cyan-200">
                      <th className="py-2 pr-2">Name</th>
                      <th className="py-2 pr-2">Contact</th>
                      <th className="py-2 pr-2">Services</th>
                      <th className="py-2 pr-2">Source</th>
                      <th className="py-2 pr-2">Added Date</th>
                      <th className="py-2 pr-2">Next Follow-up</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead._id} className="border-b border-cyan-500/10 align-top">
                        <td className="py-2 pr-2">
                          <p className="break-words whitespace-normal">{lead.name}</p>
                          <p className="text-xs text-cyan-100/70">{lead.budget ? `Budget: ${lead.budget}` : "Budget: N/A"}</p>
                          {lead.convertedToClient && (
                            <p className="text-xs text-emerald-400 font-semibold">✓ CONVERTED</p>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          <p className="break-all whitespace-normal">{lead.email || "N/A"}</p>
                          <p className="text-xs text-cyan-100/70 break-all">{lead.phone}</p>
                        </td>
                        <td className="py-2 pr-2">
                          <p className="break-words whitespace-normal">{(lead.services || []).join(", ") || "N/A"}</p>
                          {lead.requirement ? (
                            <p className="mt-1 text-xs text-cyan-100/70 break-words whitespace-normal">
                              Req: {lead.requirement}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-2 pr-2 uppercase break-words whitespace-normal">{lead.source}</td>
                        <td className="py-2 pr-2 break-words whitespace-normal">{new Date(lead.createdAt).toLocaleString()}</td>
                        <td className="py-2 pr-2 break-words whitespace-normal">
                          {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="py-2">
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(lead)}
                              className="text-xs h-7"
                            >
                              Edit
                            </Button>
                            {!lead.convertedToClient ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowConvertModal(lead._id)}
                                className="text-xs h-7"
                              >
                                Convert
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="text-xs h-7" disabled>
                                Converted
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteLead(lead)}
                              className="text-xs h-7"
                              disabled={deletingLeadId === lead._id}
                            >
                              {deletingLeadId === lead._id ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Convert Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Convert Lead to Client</CardTitle>
              <CardDescription>Create user account and set project details</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label>Email*</Label>
                <Input
                  type="email"
                  placeholder="Enter client email"
                  value={convertDates[showConvertModal]?.email ?? leads.find((lead) => lead._id === showConvertModal)?.email ?? ""}
                  onChange={(e) =>
                    setConvertDates({
                      ...convertDates,
                      [showConvertModal]: {
                        ...convertDates[showConvertModal],
                        email: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label>Password (min 8 characters)*</Label>
                <Input
                  type="password"
                  placeholder="Enter password for client login"
                  value={convertDates[showConvertModal]?.password || ""}
                  onChange={(e) =>
                    setConvertDates({
                      ...convertDates,
                      [showConvertModal]: {
                        ...convertDates[showConvertModal],
                        password: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label>Contract Valid From*</Label>
                <Input
                  type="date"
                  value={convertDates[showConvertModal]?.from || ""}
                  onChange={(e) =>
                    setConvertDates({
                      ...convertDates,
                      [showConvertModal]: {
                        ...convertDates[showConvertModal],
                        from: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label>Contract Valid To*</Label>
                <Input
                  type="date"
                  value={convertDates[showConvertModal]?.to || ""}
                  onChange={(e) =>
                    setConvertDates({
                      ...convertDates,
                      [showConvertModal]: {
                        ...convertDates[showConvertModal],
                        to: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label>Final Budget*</Label>
                <Input
                  placeholder="Enter final budget amount"
                  value={convertDates[showConvertModal]?.finalBudget || ""}
                  onChange={(e) =>
                    setConvertDates({
                      ...convertDates,
                      [showConvertModal]: {
                        ...convertDates[showConvertModal],
                        finalBudget: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label>Project Name (optional)</Label>
                <Input
                  placeholder="Enter project name"
                  value={convertDates[showConvertModal]?.projectName || ""}
                  onChange={(e) =>
                    setConvertDates({
                      ...convertDates,
                      [showConvertModal]: {
                        ...convertDates[showConvertModal],
                        projectName: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label>Project Description (optional)</Label>
                <textarea
                  placeholder="Enter project description"
                  value={convertDates[showConvertModal]?.projectDescription || ""}
                  onChange={(e) =>
                    setConvertDates({
                      ...convertDates,
                      [showConvertModal]: {
                        ...convertDates[showConvertModal],
                        projectDescription: e.target.value,
                      },
                    })
                  }
                  rows={3}
                  className="w-full rounded-md border border-cyan-500/30 bg-black/60 px-3 py-2 text-sm text-cyan-100"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowConvertModal(null);
                    setError("");
                  }}
                  disabled={convertingLeadId === showConvertModal}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleConvertToClient(showConvertModal)}
                  disabled={convertingLeadId === showConvertModal}
                >
                  {convertingLeadId === showConvertModal ? "Converting..." : "Convert & Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Lead</CardTitle>
              <CardDescription>Update lead details</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input name="name" value={editForm.name} onChange={onEditFieldChange} required />
              </div>

              <div>
                <Label>Email (optional)</Label>
                <Input name="email" type="email" value={editForm.email} onChange={onEditFieldChange} />
              </div>

              <div>
                <Label>Phone</Label>
                <Input name="phone" value={editForm.phone} onChange={onEditFieldChange} required />
              </div>

              <div>
                <Label>Services (comma separated)</Label>
                <Input
                  name="services"
                  value={editForm.services}
                  onChange={onEditFieldChange}
                  placeholder="Web Development, UI/UX Design"
                  required
                />
              </div>

              <div>
                <Label>Budget</Label>
                <Input name="budget" value={editForm.budget} onChange={onEditFieldChange} placeholder="Optional" />
              </div>

              <div>
                <Label>Next Follow-up Date (optional)</Label>
                <Input name="nextFollowUpDate" type="date" value={editForm.nextFollowUpDate} onChange={onEditFieldChange} />
              </div>

              <div>
                <Label>Requirement</Label>
                <textarea
                  name="requirement"
                  value={editForm.requirement}
                  onChange={onEditFieldChange}
                  rows={4}
                  className="w-full rounded-md border border-cyan-500/30 bg-black/60 px-3 py-2 text-sm text-cyan-100"
                  placeholder="Optional details"
                />
              </div>

              {editError && <p className="text-sm text-red-400">{editError}</p>}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditingLead(null);
                    setEditError("");
                  }}
                  disabled={isUpdatingLead}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateLead}
                  disabled={isUpdatingLead}
                >
                  {isUpdatingLead ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
