import { authHeaders } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

async function request<T>(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Error de solicitud");
  }
  return response.json() as Promise<T>;
}

export const api = {
  campaigns: () => request<any[]>("/community/campaigns"),
  veterinarians: () => request<any[]>("/veterinary/veterinarians"),
  pets: (token: string) => request<any[]>("/veterinary/pets", { headers: authHeaders(token) }),
  createPet: (token: string, body: unknown) => request<any>("/veterinary/pets", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify(body) }),
  createAppointment: (token: string, body: unknown) => request<any>("/veterinary/appointments", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify(body) }),
  agenda: (token: string) => request<any[]>("/veterinary/agenda", { headers: authHeaders(token) }),
  createMedicalRecord: (token: string, body: unknown) => request<any>("/veterinary/medical-records", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify(body) }),
  createReport: (token: string, body: unknown) => request<any>("/rescue/reports", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify(body) }),
  reports: (token: string) => request<any[]>("/rescue/reports", { headers: authHeaders(token) }),
  donate: (token: string, body: unknown) => request<any>("/donations", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify(body) }),
  sponsor: (token: string, body: unknown) => request<any>("/donations/sponsorships", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify(body) }),
  donations: (token: string) => request<any[]>("/donations", { headers: authHeaders(token) }),
  registerCampaign: (token: string, campaignId: string) => request<any>(`/community/campaigns/${campaignId}/register`, { method: "POST", headers: authHeaders(token) }),
  metrics: (token: string) => request<any>("/admin/metrics", { headers: authHeaders(token) }),
  users: (token: string) => request<any[]>("/users", { headers: authHeaders(token) }),
  updateUserRole: (token: string, userId: string, role: string) => request<any>(`/admin/users/${userId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify({ role }) }),
  adminPets: (token: string) => request<any[]>("/admin/pets", { headers: authHeaders(token) }),
  updateAppointment: (token: string, appointmentId: string, body: unknown) => request<any>(`/admin/appointments/${appointmentId}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify(body) }),
  supplies: (token: string) => request<any[]>("/admin/supplies", { headers: authHeaders(token) }),
  upsertSupply: (token: string, body: unknown) => request<any>("/admin/supplies", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify(body) })
};