# SAGAF — Agent Context

> **Every agent must read this file before starting any task.**
> For full requirements, use cases, class diagram, and test plan → see `/Contexto/CONTEXTO.md`.

---

## Project Overview

**SAGAF** (Sistema Automatizado de Gestión de Análisis Financiero) is a full-stack web application built for the **Financial Analysis Unit (UAF) of Panama**, developed as an academic project at Universidad Tecnológica de Panamá (UTP), course *Ingeniería de Software Aplicada IV*, 2026.

**Problem solved**: Digitizes and standardizes the reception, analysis, and follow-up of **Suspicious Operation Reports (ROS)** related to money laundering and terrorism financing (PLA/FT).

**Legal framework**:
- **Ley 23 de 2015** — Anti-money laundering / counter-terrorism financing
- **Ley 81 de 2019** — Personal data protection (Privacy by Design)
- **GAFI/FATF** international standards

---

## Tech Stack

- **Next.js 14** (App Router, Server Components, Server Actions, Route Handlers)
- **TypeScript 5** (strict mode throughout)
- **React 18** + **Tailwind CSS 3**
- **SQLite** via `better-sqlite3` (WAL mode, file: `db/sagaf.db`)
- **NextAuth v5** (beta) for authentication
- **TOTP MFA** via `otplib` (RFC 6238) + `qrcode`
- **Zod 3** for input validation
- **bcryptjs** for password hashing
- **lucide-react** for icons

---

## Project Structure

```
sagaf-app/
├── app/
│   ├── login/            # Step 1: Email + password
│   ├── mfa/
│   │   ├── setup/        # TOTP QR enrollment
│   │   └── verify/       # TOTP code entry
│   ├── portal/           # sujeto_obligado: register ROS, manage docs
│   │   ├── ros/nuevo/    # New ROS form (dynamic by sector)
│   │   ├── ros/[id]/     # ROS detail + document resubmission
│   │   └── subsanaciones/ # Remediation inbox
│   ├── uaf/              # analista/supervisor: analyze ROS
│   │   ├── ros/[id]/     # Case expedient (5 tabs)
│   │   ├── vinculos/     # Intersectoral links
│   │   ├── reportes/     # Reports + CSV export
│   │   └── auditoria/    # Audit log view
│   ├── auditor/          # auditor: read-only audit log
│   ├── admin/            # admin: users, orgs, templates
│   └── api/              # REST endpoints
│       ├── ros/          # Create, list, classify
│       ├── mfa/          # TOTP setup and verify
│       ├── personas/verify/ # Identity lookup (public: name only)
│       ├── documentos/   # File upload and management
│       ├── usuarios/     # User CRUD
│       ├── sujetos-obligados/ # Organization CRUD
│       ├── reportes/     # Report generation + CSV export
│       ├── auditoria/    # Audit log retrieval
│       └── vinculos/     # Intersectoral linking
├── lib/
│   ├── db.ts             # SQLite singleton (WAL + foreign keys)
│   ├── totp.ts           # RFC 6238 TOTP (window: 1, ±30s)
│   ├── audit.ts          # Immutable audit logging
│   ├── permissions.ts    # RBAC: requirePermission(), requireRole(), canAccessROS()
│   ├── masking.ts        # Ley 81 masking (identifiers, emails, amounts)
│   ├── persons.ts        # Identity verification (public vs internal lookup)
│   └── ros-number.ts     # Atomic sequential ROS number generation
├── types/
│   ├── index.ts          # Domain types: Role, RosEstado, RiesgoNivel, DocumentoEstado...
│   └── next-auth.d.ts    # NextAuth session/JWT extensions
├── components/           # Reusable UI components
├── db/
│   ├── schema.sql        # Full relational schema (16+ tables, triggers)
│   ├── seed.ts           # Initial data
│   ├── init.ts           # DB initialization
│   └── reset.ts          # Full DB reset
├── auth.ts               # NextAuth v5 config + MFA flow
├── middleware.ts         # Route protection by role + MFA state
└── Contexto/             # ← FULL PROJECT DOCUMENTATION
    ├── CONTEXTO.md       # Requirements, use cases, class diagram, defect matrix
    └── *.png / *.pdf     # UML diagrams, academic specification
```

---

## Domain Types (types/index.ts)

```typescript
type Role = 'sujeto_obligado' | 'analista' | 'supervisor' | 'auditor' | 'admin'
type RosEstado = 'recibido' | 'en_analisis' | 'revision_documental' | 'subsanacion' | 'escalado' | 'cerrado' | 'vinculado'
type RiesgoNivel = 'bajo' | 'medio' | 'alto'
type DocumentoEstado = 'pendiente' | 'cargado' | 'observado' | 'validado' | 'no_aplica'
```

---

## System Roles & Access

| Role | Route | Permissions |
|------|-------|-------------|
| `sujeto_obligado` | `/portal` | Create ROS, upload docs, respond to remediation |
| `analista` | `/uaf` | View/filter ROS, classify risk, manage links |
| `supervisor` | `/uaf` | Same as analista + export CSV reports |
| `auditor` | `/auditor` | Read-only audit log access |
| `admin` | `/admin` | Manage users, organizations, templates |

---

## Authentication Flow

1. Login (`/login`) → email + bcrypt password
2. If `mfa_activo = false` → redirect to `/mfa/setup` (QR enrollment)
3. If `mfa_activo = true` → redirect to `/mfa/verify` (TOTP code)
4. After `mfaVerified = true` in session → access to protected routes

Route protection is enforced in `middleware.ts` via `auth.config.ts` callbacks.

---

## Critical Security Rules

These rules must be respected in all code changes:

1. **Backend permissions always**: use `requirePermission()` or `requireRole()` from `lib/permissions.ts` in every API route. Never rely on frontend-only guards.
2. **IDOR prevention**: use `canAccessROS()` to ensure sujetos obligados only access their own ROS.
3. **Audit logging**: call `logAuditEvent()` from `lib/audit.ts` for every significant action.
4. **Ley 81 masking**: display identifiers/emails masked using `lib/masking.ts`. Never expose raw data.
5. **Atomic ROS creation**: always wrap ROS creation in `db.transaction()`. Never partial inserts.
6. **Server timestamps**: audit log uses `CURRENT_TIMESTAMP` from SQLite. Never client-side dates.
7. **Zod validation**: validate all user input with Zod before touching the database.
8. **Identity lookup privacy**: `verifyPublic()` returns `{found, nombre}` only. Full data only via `lookupInternal()` for authorized UAF roles.

---

## Database Key Tables

| Table | Purpose |
|-------|---------|
| `usuario` | System users (email, hashed password, TOTP secret, role) |
| `sujeto_obligado` | Reporting organizations (banks, real estates) |
| `plantilla_ros` | Dynamic form templates per sector |
| `ros` | Suspicious Operation Reports (lifecycle state machine) |
| `parte_involucrada` | Parties in ROS (masked identifier, visible name) |
| `operacion_sospechosa` | Transaction details (amount as REAL, not text) |
| `documento_adjunto` | Individual file uploads (per required document slot) |
| `caso_analisis` | Analysis case wrapper per ROS |
| `riesgo_caso` | Risk classification (bajo/medio/alto + justification ≥15 chars) |
| `vinculo_intersectorial` | Cross-case links (requires manual confirmation) |
| `solicitud_subsanacion` | Remediation requests |
| `evento_auditoria` | Immutable audit log (DB triggers block UPDATE/DELETE) |

---

## Functional Requirements Summary

| RF | What | Where |
|----|------|-------|
| RF-01 | ROS registration (dynamic form, atomic, unique number) | `portal/ros/nuevo/`, `api/ros/` |
| RF-02 | Search/filter/classify ROS with risk justification | `uaf/`, `api/ros/[id]/riesgo/` |
| RF-03 | Immutable audit trail (server timestamp, IP, UA) | `lib/audit.ts`, `api/auditoria/` |
| RF-04 | Reports and CSV export (supervisor only, masked) | `uaf/reportes/`, `api/reportes/` |
| RF-05 | Role-based access + mandatory MFA TOTP | `auth.ts`, `middleware.ts` |
| RF-06 | Secure identity verification (name only, public) | `lib/persons.ts`, `api/personas/verify/` |
| RF-07 | Individual document slots + remediation workflow | `api/documentos/`, `portal/subsanaciones/` |

---

## Use Cases Summary

| CU | Name | Main Actor |
|----|------|-----------|
| CU-01 | ROS Reception and Registration | Sujeto Obligado |
| CU-02 | Search, Filter, and Classification | Analista / Supervisor |
| CU-03 | Audit and Access Control | Auditor |
| CU-04 | Reports and Financial Intelligence | Supervisor |
| CU-05 | User Management and MFA | Admin |
| CU-06 | Obligated Subject Management | Admin |
| CU-07 | Intersectoral Links | Analista / Supervisor |
| CU-08 | Document Management and Remediation | Sujeto Obligado + Analista |

---

## Credentials

All accounts use password: `password123`

| Email | Role |
|-------|------|
| `cumplimiento@banconacional.com.pa` | sujeto_obligado (bank) |
| `cumplimiento@inmobiliariaistmo.com.pa` | sujeto_obligado (real estate) |
| `analista@uaf.gob.pa` | analista |
| `supervisor@uaf.gob.pa` | supervisor |
| `auditor@uaf.gob.pa` | auditor |
| `admin@uaf.gob.pa` | admin |

---

## Development Commands

```bash
npm install           # Install dependencies
npx tsx db/init.ts    # Initialize database
npx tsx db/seed.ts    # Load demo data
npm run dev           # Dev server → http://localhost:3000
npx tsx db/reset.ts   # Full database reset
```

---

## Where to Find More Context

| What you need | Where to look |
|---------------|--------------|
| Full RF/RNF specs | `/Contexto/CONTEXTO.md` → "Requisitos de Software" |
| Complete use case descriptions + alternate flows | `/Contexto/CONTEXTO.md` → "Casos de Uso" |
| Class diagram (16+ entities) | `/Contexto/Diagrama de clases.png` |
| UML use case diagrams | `/Contexto/Caso de uso *.png` |
| Defect matrix (DEF-01 to DEF-40) | `/Contexto/CONTEXTO.md` → "Matriz de Defectos" |
| Test plan (Alpha/Beta/UX) | `/Contexto/CONTEXTO.md` → "Plan de Pruebas" |
| Acceptance criteria (Gherkin) | `/Contexto/CONTEXTO.md` → "Criterios de Aceptación" |
| Academic specification | `/Contexto/Parcial ISA 4 V2.0.pdf` |
| Reference prototype | `/Contexto/Prototipo.html` |
