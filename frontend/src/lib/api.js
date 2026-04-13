/**
 * API client – wraps fetch calls to the FastAPI backend.
 */
const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("access_token") || "";
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

// Auth
export const authAPI = {
  signup: (data) => request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request("/auth/me"),
  updateMe: (data) => request("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
  getMyActivity: () => request("/auth/my-activity"),
  publicVerify: (id) => request(`/auth/verify/${id}`),
};

// Student
export const studentAPI = {
  getSkills: () => request("/student/skills"),
  addSkill: (data) => request("/student/skills", { method: "POST", body: JSON.stringify(data) }),
  updateSkill: (id, data) => request(`/student/skills/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSkill: (id) => request(`/student/skills/${id}`, { method: "DELETE" }),

  getProjects: () => request("/student/projects"),
  addProject: (data) => request("/student/projects", { method: "POST", body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/student/projects/${id}`, { method: "DELETE" }),

  getCertifications: () => request("/student/certifications"),
  addCertification: (data) => request("/student/certifications", { method: "POST", body: JSON.stringify(data) }),

  getReputation: () => request("/student/reputation"),
  getReputationHistory: () => request("/student/reputation/history"),

  validatePeer: (data) => request("/student/validate", { method: "POST", body: JSON.stringify(data) }),
  getValidations: (skillId) => request(`/student/validations/${skillId}`),

  getLeaderboard: () => request("/student/leaderboard"),
  getNotifications: () => request("/student/notifications"),
  markRead: (id) => request(`/student/notifications/${id}/read`, { method: "PUT" }),
  getProfile: (id) => request(`/student/profile/${id}`),
};

// Faculty
export const facultyAPI = {
  getPending: () => request("/faculty/certifications/pending"),
  reviewCert: (id, data) => request(`/faculty/certifications/${id}/review`, { method: "PUT", body: JSON.stringify(data) }),
  getStudents: () => request("/faculty/students"),
  getAnalytics: () => request("/faculty/analytics"),
};

// Recruiter
export const recruiterAPI = {
  search: (params) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return request(`/recruiter/search?${qs}`);
  },
  getStudent: (id) => request(`/recruiter/student/${id}`),
  getDepartments: () => request("/recruiter/departments"),
  getReport: (id) => request(`/recruiter/report/${id}`),
};

// Admin
export const adminAPI = {
  getUsers: () => request("/admin/users"),
  updateRole: (id, role) => request(`/admin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params);
    return request(`/admin/audit-logs?${qs}`);
  },
  getAnalytics: () => request("/admin/analytics"),
};
