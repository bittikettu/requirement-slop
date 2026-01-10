# ReqTool

A lightweight and powerful requirement management tool designed for modern engineering workflows.

## Features

- **Requirement Management**: Create, edit, and organize requirements with ease.
- **Hierarchical Organization**: Group requirements by project and build parent-child relationships.
- **Traceability Matrix**: Manage incoming and outgoing traces between requirements.
- **EARS Verification**: Real-time checking of requirements against the Easy Approach to Requirements Syntax (EARS) patterns.
- **History & Audit Logs**: Full tracking of change history for every requirement and a global system audit feed.
- **Export Capabilities**:
  - **AsciiDoc**: Generate comprehensive documentation with hierarchy and traceability.
  - **ReqIF**: Export requirements in the standard Requirements Interchange Format for tool interoperability.

## Technology Stack

- **Backend**: FastAPI (Python), SQLAlchemy, SQLite.
- **Frontend**: React, Vite, TypeScript, Lucide Icons.
- **Build Tools**: Bun (Frontend), Python venv (Backend).

## Development

Developed using **Antigravity**, a powerful agentic AI coding assistant.

## Setup & Running

### Backend

1. Navigate to `backend/`
2. Create and activate a virtual environment.
3. Install dependencies: `pip install -r requirements.txt`
4. Start the server: `python -m uvicorn main:app --reload`

### Frontend

1. Navigate to `frontend/`
2. Install dependencies: `bun install`
3. Start the dev server: `bun dev`
