"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import {
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Clock,
  ListTodo,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import ProjectManagementWorkspace from "@/components/projects/ProjectManagementWorkspace";

// 👉 TEMP types (adjust based on your schema)
type Task = {
  id: string;
  status: "completed" | "in progress" | "pending";
};

// 👉 Dummy loader (replace with API later)
async function getTasks(): Promise<Task[]> {
  return [
    { id: "1", status: "completed" },
    { id: "2", status: "in progress" },
    { id: "3", status: "pending" },
  ];
}

export default function TaskClient({ session, users }: any) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD TASKS
  // =========================
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const taskList = await getTasks();
        setTasks(taskList);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // =========================
  // ADD TASK
  // =========================
  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  // =========================
  // STATS
  // =========================
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <>
      {/* HEADER */}
      {/* <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">
          Manage all your project tasks efficiently.
        </p>
      </div> */}

      {/* STATS */}
      
    

      {/* MAIN WORKSPACE */}
      <div className="px-4 md:px-6 mt-6">
        <ProjectManagementWorkspace
          role="admin"
          sessionUserId={session.user.id}
          users={users}
          canEditTasks
        />
      </div>
    </>
  );
}