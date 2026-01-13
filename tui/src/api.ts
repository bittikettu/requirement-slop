import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:8000';

export interface Project {
  id: number;
  name: string;
  prefix: string;
}

export interface Trace {
  source_id: string;
  target_id: string;
}

export interface Requirement {
  id: string;
  title: string;
  description: string | null;
  rationale: string | null;
  priority: string;
  status: string;
  parent_id: string | null;
  project_id: number | null;
  outgoing_traces?: Trace[];
  incoming_traces?: Trace[];
}

export const api = {
  async listProjects(): Promise<Project[]> {
    const response = await axios.get(`${API_BASE_URL}/projects/`);
    return response.data;
  },

  async listRequirements(): Promise<Requirement[]> {
    const response = await axios.get(`${API_BASE_URL}/requirements/`);
    return response.data;
  },

  async getRequirement(id: string): Promise<Requirement> {
    const response = await axios.get(`${API_BASE_URL}/requirements/${id}`);
    return response.data;
  },

  async createRequirement(data: Partial<Requirement>): Promise<Requirement> {
    const response = await axios.post(`${API_BASE_URL}/requirements/`, data);
    return response.data;
  },

  async deleteRequirement(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/requirements/${id}`);
  },

  async generateDescription(title: string, onToken: (token: string) => void): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/requirements/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, model: 'deepseek-r1:8b' })
    });
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onToken(decoder.decode(value));
    }
  },

  async generateRationale(title: string, description: string, onToken: (token: string) => void): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/requirements/generate-rationale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, model: 'deepseek-r1:8b' })
    });
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onToken(decoder.decode(value));
    }
  }
};
