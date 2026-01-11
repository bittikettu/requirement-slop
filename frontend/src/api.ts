import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

export interface TraceHelper {
  source_id: string;
  target_id: string;
}

export interface Requirement {
  id: string;
  title: string;
  description?: string;
  rationale?: string;
  priority: string;
  status: string;
  parent_id?: string;
  project_id?: number;
  created_at?: string;
  updated_at?: string;
  children?: Requirement[]; // for tree view
}

export interface RequirementDetail extends Requirement {
  outgoing_traces: TraceHelper[];
  incoming_traces: TraceHelper[];
}

export interface Project {
    id: number;
    name: string;
    prefix: string;
    next_number: number;
}

export const getRequirements = async () => {
  const response = await api.get<Requirement[]>("/requirements/");
  return response.data;
};

export const getRequirement = async (id: string) => {
  const response = await api.get<RequirementDetail>(`/requirements/${id}`);
  return response.data;
};

export const createRequirement = async (req: Partial<Requirement>) => {
  const response = await api.post<Requirement>("/requirements/", req);
  return response.data;
};

export const updateRequirement = async (
  id: string,
  req: Partial<Requirement>
) => {
  const response = await api.put<Requirement>(`/requirements/${id}`, req);
  return response.data;
};

export const deleteRequirement = async (id: string) => {
  await api.delete(`/requirements/${id}`);
};

export const createTrace = async (source_id: string, target_id: string) => {
  const response = await api.post("/traces/", { source_id, target_id });
  return response.data;
};

export const deleteTrace = async (source_id: string, target_id: string) => {
  await api.delete("/traces/", { data: { source_id, target_id } }); // Axios delete body
};

// Projects
export const getProjects = async (): Promise<Project[]> => {
    const response = await api.get<Project[]>("/projects/");
    return response.data;
};

export const createProject = async (project: { name: string; prefix: string; }): Promise<Project> => {
    const response = await api.post<Project>("/projects/", project);
    return response.data;
};

export const getExport = async (status?: string, priority?: string) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (priority) params.append("priority", priority);
  const response = await api.get<{ content: string }>(
    `/export/asciidoc?${params.toString()}`
  );
  return response.data;
};

export const getReqIFExport = async () => {
    // Axios might try to parse XML as JSON if valid, but here we expect string XML
    const response = await api.get("/export/reqif", { responseType: 'text' });
    return response.data; 
};

export interface EARSResponse {
    is_compliant: boolean;
    pattern?: string;
    hint?: string;
}

export const verifyEARS = async (title: string): Promise<EARSResponse> => {
    const response = await api.post<EARSResponse>("/requirements/verify-ears", { title });
    return response.data;
};

export interface AuditLog {
    id: number;
    req_id?: string;
    timestamp: string;
    author: string;
    action: string;
    details: string;
}

export const getAuditLogs = async (skip: number = 0, limit: number = 100) => {
    const response = await api.get<AuditLog[]>(`/audit?skip=${skip}&limit=${limit}`);
    return response.data;
};

export const getAuditLogsForRequirement = async (reqId: string) => {
    const response = await api.get<AuditLog[]>(`/audit/requirements/${reqId}`);
    return response.data;
};

export const generateAIDescription = async (title: string) => {
    const response = await api.post<{ generated_text: string }>("/requirements/generate-description", { title });
    return response.data;
};

export const generateAIRationale = async (title: string, description: string) => {
    const response = await api.post<{ generated_text: string }>("/requirements/generate-rationale", { title, description });
    return response.data;
};

export const getAIModels = async (): Promise<string[]> => {
    const response = await api.get<string[]>("/requirements/models");
    return response.data;
};

export const streamAIDescription = async (title: string, onChunk: (chunk: string) => void, model?: string, currentDescription?: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/requirements/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, model, current_description: currentDescription })
    });
    
    if (!response.ok) {
        let detail = "Failed to generate description";
        try {
            const errorData = await response.json();
            detail = errorData.detail || detail;
        } catch {
            // ignore JSON parse error
        }
        throw new Error(detail);
    }
    
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onChunk(decoder.decode(value));
    }
};

export const streamAIRationale = async (title: string, description: string, onChunk: (chunk: string) => void, model?: string, currentRationale?: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/requirements/generate-rationale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, model, current_rationale: currentRationale })
    });
    
    if (!response.ok) {
        let detail = "Failed to generate rationale";
        try {
            const errorData = await response.json();
            detail = errorData.detail || detail;
        } catch {
            // ignore JSON parse error
        }
        throw new Error(detail);
    }
    
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onChunk(decoder.decode(value));
    }
};
