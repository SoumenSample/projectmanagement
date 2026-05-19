export function normalizeListValues(values) {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export function calculateProjectProgress(tasks = []) {
  const checkpoints = [];

  for (const task of tasks || []) {
    checkpoints.push(Boolean(task?.isDone));

    for (const subtask of task?.subtasks || []) {
      checkpoints.push(Boolean(subtask?.isDone));
    }
  }

  const completedCount = checkpoints.filter(Boolean).length;
  const totalCount = checkpoints.length;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    completedCount,
    totalCount,
    progress,
  };
}

export function deriveProjectStatus(progress, currentStatus = "planning") {
  if (progress >= 100) {
    return "completed";
  }

  // If progress drops below 100, a completed project should no longer stay completed.
  if (currentStatus === "completed") {
    return progress > 0 ? "in-progress" : "planning";
  }

  if (!currentStatus || currentStatus === "planning") {
    return progress > 0 ? "in-progress" : "planning";
  }

  return currentStatus;
}

export function buildProjectVisibilityQuery(sessionUser) {
  if (!sessionUser?.id) {
    return null;
  }

  if (sessionUser.role === "admin") {
    return {};
  }

  if (sessionUser.role === "employee") {
    return { assignedEmployees: sessionUser.id };
  }

  if (sessionUser.role === "client") {
    return { client: sessionUser.id };
  }

  return null;
}

export function canAccessProject(project, sessionUser) {
  if (!project || !sessionUser?.id) return false;
  if (sessionUser.role === "admin") return true;

  const clientId = project.client?._id?.toString?.() || project.client?.toString?.() || project.client;
  const assignedEmployees = (project.assignedEmployees || []).map((employee) =>
    employee?._id?.toString?.() || employee?.toString?.() || employee
  );

  if (sessionUser.role === "employee") {
    return assignedEmployees.includes(sessionUser.id);
  }

  if (sessionUser.role === "client") {
    return clientId === sessionUser.id;
  }

  return false;
}

export function getProjectAudience(project, actorId) {
  const recipients = new Set();

  for (const employee of project?.assignedEmployees || []) {
    const employeeId = employee?._id?.toString?.() || employee?.toString?.() || employee;
    if (employeeId && employeeId !== actorId) {
      recipients.add(employeeId);
    }
  }

  const clientId = project?.client?._id?.toString?.() || project?.client?.toString?.() || project?.client;
  if (clientId && clientId !== actorId) {
    recipients.add(clientId);
  }

  const creatorId = project?.createdBy?._id?.toString?.() || project?.createdBy?.toString?.() || project?.createdBy;
  if (creatorId && creatorId !== actorId) {
    recipients.add(creatorId);
  }

  return Array.from(recipients);
}

export function ensureTaskOrder(tasks = []) {
  return tasks.map((task, index) => ({
    ...task,
    order: typeof task.order === "number" ? task.order : index,
    subtasks: (task.subtasks || []).map((subtask, subtaskIndex) => ({
      ...subtask,
      order: typeof subtask.order === "number" ? subtask.order : subtaskIndex,
    })),
  }));
}
