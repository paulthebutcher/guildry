# Phase 1: Core Project Loop - Cursor Build Guide

## Overview

Phase 1 builds the core value prop: **scope → staff → deliver → learn → improve**. This creates the feedback loop that makes Guildry valuable.

**Products in Phase 1:**
- **Blueprint** - Conversational project scoping + SOW/proposal generation
- **Bench** - Talent CRM with skills, rates, and availability matching
- **Retro** - Async retrospectives + estimation model learning

**Timeline:** Weeks 4-10
**Milestone:** Closed feedback loop where estimates improve over time.

---

## Prerequisites

- Phase 0 complete and working
- Can create clients via conversation
- Auth + org scoping working

---

## Database Schema Extensions

Before building products, extend the database schema with new entities.

### PR 1: People & Skills Schema

```
Add database schema for Person, Skill, and PersonSkill entities.

Create these tables in Supabase (run in SQL Editor):

-- Skills taxonomy
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('design', 'engineering', 'strategy', 'ops', 'marketing', 'data')) NOT NULL,
  market_rate_p25 DECIMAL,
  market_rate_p50 DECIMAL,
  market_rate_p75 DECIMAL,
  rate_geography TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- People (employees, contractors, referrals)
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('employee', 'contractor', 'referral')) NOT NULL,
  email TEXT,
  location TEXT,
  hourly_rate DECIMAL,
  currency TEXT DEFAULT 'USD',
  availability_status TEXT CHECK (availability_status IN ('available', 'partial', 'booked', 'unavailable')) DEFAULT 'available',
  rating DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Person-Skill junction
CREATE TABLE person_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency TEXT CHECK (proficiency IN ('junior', 'mid', 'senior', 'expert')) NOT NULL,
  years_exp INTEGER,
  verified_by_projects UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, skill_id)
);

-- Indexes
CREATE INDEX idx_people_org_id ON people(org_id);
CREATE INDEX idx_people_availability ON people(org_id, availability_status);
CREATE INDEX idx_person_skills_person ON person_skills(person_id);
CREATE INDEX idx_person_skills_skill ON person_skills(skill_id);

-- RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_skills ENABLE ROW LEVEL SECURITY;

-- Skills are readable by all authenticated users (shared taxonomy)
CREATE POLICY "Skills are readable by authenticated users"
  ON skills FOR SELECT TO authenticated USING (true);

-- People are scoped to org
CREATE POLICY "Users can view people in their org"
  ON people FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can insert people in their org"
  ON people FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can update people in their org"
  ON people FOR UPDATE USING (
    org_id IN (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub')
  );

-- PersonSkills follow person permissions
CREATE POLICY "Users can manage person_skills for their org people"
  ON person_skills FOR ALL USING (
    person_id IN (
      SELECT id FROM people WHERE org_id IN (
        SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

Then add TypeScript types to packages/database/src/types.ts:

export type SkillCategory = 'design' | 'engineering' | 'strategy' | 'ops' | 'marketing' | 'data';
export type PersonType = 'employee' | 'contractor' | 'referral';
export type AvailabilityStatus = 'available' | 'partial' | 'booked' | 'unavailable';
export type Proficiency = 'junior' | 'mid' | 'senior' | 'expert';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  market_rate_p25: number | null;
  market_rate_p50: number | null;
  market_rate_p75: number | null;
  rate_geography: string;
  created_at: string;
}

export interface Person {
  id: string;
  org_id: string;
  name: string;
  type: PersonType;
  email: string | null;
  location: string | null;
  hourly_rate: number | null;
  currency: string;
  availability_status: AvailabilityStatus;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonSkill {
  id: string;
  person_id: string;
  skill_id: string;
  proficiency: Proficiency;
  years_exp: number | null;
  verified_by_projects: string[] | null;
  created_at: string;
}
```

### PR 2: Projects & Phases Schema

```
Add database schema for Project, Phase, and RoleRequirement entities.

Run in Supabase SQL Editor:

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'scoping', 'proposed', 'active', 'paused', 'complete', 'cancelled')) DEFAULT 'draft',
  type TEXT CHECK (type IN ('new_build', 'redesign', 'fix', 'audit', 'retainer', 'strategy')),
  estimated_hours DECIMAL,
  actual_hours DECIMAL,
  estimated_cost DECIMAL,
  actual_cost DECIMAL,
  start_date DATE,
  end_date DATE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases within projects
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  estimated_hours DECIMAL,
  actual_hours DECIMAL,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('planned', 'active', 'complete')) DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role requirements (staffing slots)
CREATE TABLE role_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id),
  person_id UUID REFERENCES people(id),
  seniority TEXT CHECK (seniority IN ('junior', 'mid', 'senior', 'lead')),
  hours DECIMAL NOT NULL,
  rate_override DECIMAL,
  is_gap BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(org_id, status);
CREATE INDEX idx_phases_project_id ON phases(project_id);
CREATE INDEX idx_role_requirements_phase_id ON role_requirements(phase_id);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage projects in their org"
  ON projects FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can manage phases for their org projects"
  ON phases FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can manage role_requirements for their org projects"
  ON role_requirements FOR ALL USING (
    phase_id IN (
      SELECT id FROM phases WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
      )
    )
  );

Then add TypeScript types to packages/database/src/types.ts:

export type ProjectStatus = 'draft' | 'scoping' | 'proposed' | 'active' | 'paused' | 'complete' | 'cancelled';
export type ProjectType = 'new_build' | 'redesign' | 'fix' | 'audit' | 'retainer' | 'strategy';
export type PhaseStatus = 'planned' | 'active' | 'complete';
export type Seniority = 'junior' | 'mid' | 'senior' | 'lead';

export interface Project {
  id: string;
  org_id: string;
  client_id: string | null;
  name: string;
  status: ProjectStatus;
  type: ProjectType | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  start_date: string | null;
  end_date: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  status: PhaseStatus;
  created_at: string;
  updated_at: string;
}

export interface RoleRequirement {
  id: string;
  phase_id: string;
  skill_id: string | null;
  person_id: string | null;
  seniority: Seniority | null;
  hours: number;
  rate_override: number | null;
  is_gap: boolean;
  created_at: string;
  updated_at: string;
}
```

### PR 3: Retrospective & Learning Schema

```
Add database schema for Retrospective, PhasePerformance, and EstimationModel.

Run in Supabase SQL Editor:

-- Retrospectives
CREATE TABLE retrospectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  hours_variance_pct DECIMAL,
  cost_variance_pct DECIMAL,
  scope_changes_count INTEGER DEFAULT 0,
  client_satisfaction INTEGER CHECK (client_satisfaction BETWEEN 1 AND 5),
  what_worked TEXT,
  what_didnt TEXT,
  lessons TEXT[],
  would_repeat BOOLEAN,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase performance (actuals vs estimates per phase)
CREATE TABLE phase_performances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retro_id UUID NOT NULL REFERENCES retrospectives(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
  phase_name TEXT NOT NULL,
  estimated_hours DECIMAL,
  actual_hours DECIMAL,
  variance_pct DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimation models (learned coefficients)
CREATE TABLE estimation_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_type TEXT,
  industry TEXT,
  team_size_range TEXT,
  avg_hours_variance DECIMAL,
  avg_cost_variance DECIMAL,
  phase_adjustments JSONB DEFAULT '{}',
  confidence_level DECIMAL,
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_retrospectives_project_id ON retrospectives(project_id);
CREATE INDEX idx_phase_performances_retro_id ON phase_performances(retro_id);
CREATE INDEX idx_estimation_models_org_id ON estimation_models(org_id);

-- RLS
ALTER TABLE retrospectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimation_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage retrospectives for their org projects"
  ON retrospectives FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can manage phase_performances for their org retros"
  ON phase_performances FOR ALL USING (
    retro_id IN (
      SELECT id FROM retrospectives WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
      )
    )
  );

CREATE POLICY "Users can manage estimation_models in their org"
  ON estimation_models FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub')
  );

Add TypeScript types to packages/database/src/types.ts:

export interface Retrospective {
  id: string;
  project_id: string;
  completed_at: string | null;
  hours_variance_pct: number | null;
  cost_variance_pct: number | null;
  scope_changes_count: number;
  client_satisfaction: number | null;
  what_worked: string | null;
  what_didnt: string | null;
  lessons: string[] | null;
  would_repeat: boolean | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface PhasePerformance {
  id: string;
  retro_id: string;
  phase_id: string | null;
  phase_name: string;
  estimated_hours: number | null;
  actual_hours: number | null;
  variance_pct: number | null;
  notes: string | null;
  created_at: string;
}

export interface EstimationModel {
  id: string;
  org_id: string;
  project_type: string | null;
  industry: string | null;
  team_size_range: string | null;
  avg_hours_variance: number | null;
  avg_cost_variance: number | null;
  phase_adjustments: Record<string, number>;
  confidence_level: number | null;
  sample_size: number;
  last_updated: string;
  created_at: string;
}
```

### PR 4: Seed Skills Data

```
Seed the skills table with common service industry skills.

Run in Supabase SQL Editor:

INSERT INTO skills (name, category, market_rate_p25, market_rate_p50, market_rate_p75) VALUES
-- Engineering
('Frontend Development', 'engineering', 75, 100, 150),
('Backend Development', 'engineering', 85, 120, 175),
('Full Stack Development', 'engineering', 90, 125, 180),
('Mobile Development (iOS)', 'engineering', 90, 130, 185),
('Mobile Development (Android)', 'engineering', 85, 125, 175),
('DevOps / Infrastructure', 'engineering', 100, 140, 200),
('QA / Testing', 'engineering', 50, 75, 110),
('Technical Architecture', 'engineering', 150, 200, 300),

-- Design
('UI Design', 'design', 60, 90, 140),
('UX Design', 'design', 70, 100, 160),
('Product Design', 'design', 80, 120, 175),
('Brand Design', 'design', 65, 95, 150),
('Motion Design', 'design', 70, 100, 150),
('Design Systems', 'design', 90, 130, 190),

-- Strategy
('Product Strategy', 'strategy', 125, 175, 275),
('Business Analysis', 'strategy', 80, 110, 160),
('User Research', 'strategy', 70, 100, 150),
('Content Strategy', 'strategy', 65, 90, 140),
('Growth Strategy', 'strategy', 100, 150, 225),

-- Marketing
('SEO', 'marketing', 50, 80, 125),
('Paid Media', 'marketing', 60, 90, 140),
('Content Marketing', 'marketing', 50, 75, 120),
('Email Marketing', 'marketing', 45, 70, 110),
('Analytics', 'marketing', 70, 100, 150),

-- Ops
('Project Management', 'ops', 60, 90, 140),
('Scrum Master', 'ops', 70, 100, 150),
('Technical Writing', 'ops', 50, 75, 115),
('Customer Success', 'ops', 45, 65, 100),

-- Data
('Data Engineering', 'data', 100, 140, 200),
('Data Analysis', 'data', 70, 100, 150),
('Machine Learning', 'data', 120, 170, 250),
('Data Visualization', 'data', 65, 95, 140);
```

---

## Blueprint Product

Blueprint handles project scoping via conversation and generates SOWs/proposals.

### PR 5: Projects API Routes

```
Create API routes for Projects CRUD.

Create apps/web/app/api/projects/route.ts:

import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

const createProjectSchema = z.object({
  name: z.string().min(1),
  client_id: z.string().uuid().optional(),
  type: z.enum(['new_build', 'redesign', 'fix', 'audit', 'retainer', 'strategy']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { orgId } = await getAuthContext();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("client_id");

    const db = getDb();
    let query = db
      .from("projects")
      .select("*, client:clients(id, name)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (clientId) query = query.eq("client_id", clientId);

    const { data: projects, error } = await query;

    if (error) {
      console.error("Failed to fetch projects:", error);
      return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch projects", 500);
    }

    return apiSuccess(projects || []);
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { orgId } = await getAuthContext();
    const body = await req.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, validation.error.message, 400);
    }

    const data = validation.data;
    const db = getDb();

    const { data: project, error } = await db
      .from("projects")
      .insert({
        org_id: orgId,
        name: data.name,
        client_id: data.client_id || null,
        type: data.type || null,
        status: "draft",
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create project:", error);
      return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to create project", 500);
    }

    return apiSuccess(project, 201);
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Internal server error", 500);
  }
}

Create apps/web/app/api/projects/[id]/route.ts with GET, PATCH, DELETE handlers following the same pattern as clients.
```

### PR 6: Blueprint Conversation Tools

```
Add AI tools for project scoping in packages/ai/src/tools/project.ts:

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const ProjectInputSchema = z.object({
  name: z.string().min(1),
  client_id: z.string().uuid().optional(),
  type: z.enum(['new_build', 'redesign', 'fix', 'audit', 'retainer', 'strategy']),
  description: z.string().optional(),
  estimated_timeline_weeks: z.number().optional(),
  budget_range: z.string().optional(),
});

export const PhaseInputSchema = z.object({
  name: z.string(),
  estimated_hours: z.number(),
  skills_needed: z.array(z.object({
    skill_name: z.string(),
    seniority: z.enum(['junior', 'mid', 'senior', 'lead']),
    hours: z.number(),
  })),
});

export const createProjectTool: Anthropic.Tool = {
  name: "create_project",
  description: "Create a new project with phases and role requirements. Use this when you have gathered enough information about the project scope.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Project name" },
      client_id: { type: "string", description: "UUID of the client (optional)" },
      type: {
        type: "string",
        enum: ["new_build", "redesign", "fix", "audit", "retainer", "strategy"],
        description: "Type of project",
      },
      description: { type: "string", description: "Brief project description" },
      phases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            estimated_hours: { type: "number" },
            skills_needed: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill_name: { type: "string" },
                  seniority: { type: "string", enum: ["junior", "mid", "senior", "lead"] },
                  hours: { type: "number" },
                },
                required: ["skill_name", "seniority", "hours"],
              },
            },
          },
          required: ["name", "estimated_hours"],
        },
        description: "Project phases with estimated hours and roles",
      },
    },
    required: ["name", "type"],
  },
};

export const suggestPhasesTool: Anthropic.Tool = {
  name: "suggest_phases",
  description: "Suggest a phase breakdown for the project based on the type and scope discussed.",
  input_schema: {
    type: "object",
    properties: {
      project_type: { type: "string" },
      complexity: { type: "string", enum: ["simple", "moderate", "complex"] },
      phases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            typical_hours_range: { type: "string" },
          },
        },
      },
    },
    required: ["project_type", "complexity", "phases"],
  },
};

Update packages/ai/src/tools/index.ts to include project tools:

import { createProjectTool, suggestPhasesTool } from "./project";

export function getToolsForSchema(schema: string): Anthropic.Tool[] {
  const commonTools = [askClarifyingQuestionTool, markCompleteTool];

  switch (schema.toLowerCase()) {
    case "client":
      return [createClientTool, ...commonTools];
    case "project":
      return [createProjectTool, suggestPhasesTool, ...commonTools];
    default:
      return commonTools;
  }
}
```

### PR 7: Blueprint System Prompt

```
Create packages/ai/src/prompts/project.ts:

export function getProjectPrompt(): string {
  return `You are helping scope a new project for a services firm.

Your goal is to understand:
1. What the client needs (website, app, audit, etc.)
2. The complexity and scale
3. Timeline constraints
4. Budget range (if any)

Then help build a realistic scope with:
- Project phases (e.g., Discovery, Design, Development, QA, Launch)
- Hours per phase
- Role requirements (what skills at what seniority)

Standard phase templates by project type:
- **new_build**: Discovery (10-20h) → Design (40-80h) → Development (80-200h) → QA (20-40h) → Launch (10-20h)
- **redesign**: Audit (10-20h) → Design (30-60h) → Development (60-150h) → QA (15-30h) → Launch (10-20h)
- **fix**: Assessment (5-10h) → Implementation (20-80h) → QA (10-20h)
- **audit**: Analysis (20-40h) → Report (10-20h) → Recommendations (5-10h)

Be realistic about hours. It's better to slightly overestimate than underestimate.
Ask clarifying questions when needed. Don't assume scope.

When ready to create the project, use the create_project tool with all gathered information.`;
}

Update packages/ai/src/prompts/index.ts:

import { getProjectPrompt } from "./project";

export function getPromptForSchema(schema: string): string {
  const basePrompt = getBaseSystemPrompt();

  switch (schema.toLowerCase()) {
    case "client":
      return \`\${basePrompt}\n\n\${getClientPrompt()}\`;
    case "project":
      return \`\${basePrompt}\n\n\${getProjectPrompt()}\`;
    default:
      return basePrompt;
  }
}
```

### PR 8: Projects UI Pages

```
Create the projects list page at apps/web/app/(dashboard)/projects/page.tsx:

- Server component that fetches projects from API
- Shows project cards with name, client, status, dates
- Filter by status (draft, active, complete)
- "New Project" button that goes to /projects/new

Create apps/web/app/(dashboard)/projects/new/page.tsx:

- Client component with conversation UI
- Creates conversation with target_schema: "project"
- AI guides through scoping process
- On completion, redirects to /projects/[id]

Create apps/web/app/(dashboard)/projects/[id]/page.tsx:

- Project detail view showing:
  - Header with name, client, status
  - Phases section with hours breakdown
  - Role requirements per phase
  - Actions: Edit, Generate SOW, Start Project

Follow the same patterns used for clients pages.
Add "Projects" link to the sidebar navigation in apps/web/components/layout/sidebar.tsx.
```

---

## Bench Product

Bench handles the talent network and staffing matching.

### PR 9: People API Routes

```
Create API routes for People (talent network).

Create apps/web/app/api/people/route.ts:

import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

const createPersonSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['employee', 'contractor', 'referral']),
  email: z.string().email().optional(),
  location: z.string().optional(),
  hourly_rate: z.number().optional(),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { orgId } = await getAuthContext();
    const { searchParams } = new URL(req.url);
    const availability = searchParams.get("availability");
    const skillId = searchParams.get("skill_id");

    const db = getDb();
    let query = db
      .from("people")
      .select("*, skills:person_skills(skill:skills(id, name, category), proficiency, years_exp)")
      .eq("org_id", orgId)
      .order("name");

    if (availability) query = query.eq("availability_status", availability);

    const { data: people, error } = await query;

    if (error) {
      console.error("Failed to fetch people:", error);
      return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch people", 500);
    }

    // Filter by skill if requested
    let filteredPeople = people || [];
    if (skillId) {
      filteredPeople = filteredPeople.filter(p =>
        p.skills?.some(s => s.skill?.id === skillId)
      );
    }

    return apiSuccess(filteredPeople);
  } catch (error) {
    console.error("Error in GET /api/people:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { orgId } = await getAuthContext();
    const body = await req.json();
    const validation = createPersonSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, validation.error.message, 400);
    }

    const data = validation.data;
    const db = getDb();

    const { data: person, error } = await db
      .from("people")
      .insert({
        org_id: orgId,
        name: data.name,
        type: data.type,
        email: data.email || null,
        location: data.location || null,
        hourly_rate: data.hourly_rate || null,
        currency: data.currency,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create person:", error);
      return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to create person", 500);
    }

    return apiSuccess(person, 201);
  } catch (error) {
    console.error("Error in POST /api/people:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Internal server error", 500);
  }
}

Also create apps/web/app/api/people/[id]/route.ts with GET, PATCH, DELETE.
Create apps/web/app/api/people/[id]/skills/route.ts for managing person skills.
Create apps/web/app/api/skills/route.ts to list available skills.
```

### PR 10: Staffing Matcher Service

```
Create a staffing matcher service that matches people to role requirements.

Create packages/ai/src/staffing/matcher.ts:

import { createServiceClient } from "@guildry/database";

interface RoleRequirement {
  id: string;
  skill_id: string | null;
  seniority: string | null;
  hours: number;
}

interface Person {
  id: string;
  name: string;
  hourly_rate: number | null;
  availability_status: string;
  skills: Array<{
    skill: { id: string; name: string };
    proficiency: string;
  }>;
}

interface StaffingMatch {
  role_requirement_id: string;
  person_id: string;
  person_name: string;
  match_score: number;
  hourly_rate: number | null;
  reasons: string[];
}

const PROFICIENCY_SCORES: Record<string, number> = {
  junior: 1,
  mid: 2,
  senior: 3,
  expert: 4,
};

const SENIORITY_SCORES: Record<string, number> = {
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
};

export async function findMatchesForRole(
  orgId: string,
  requirement: RoleRequirement
): Promise<StaffingMatch[]> {
  const db = createServiceClient();

  // Get available people with the required skill
  const { data: people, error } = await db
    .from("people")
    .select("*, skills:person_skills(skill:skills(id, name), proficiency)")
    .eq("org_id", orgId)
    .in("availability_status", ["available", "partial"]);

  if (error || !people) {
    console.error("Failed to fetch people for matching:", error);
    return [];
  }

  const matches: StaffingMatch[] = [];

  for (const person of people) {
    const matchingSkill = person.skills?.find(
      (s: any) => s.skill?.id === requirement.skill_id
    );

    if (!matchingSkill && requirement.skill_id) continue;

    let score = 50; // Base score for available person
    const reasons: string[] = [];

    // Skill proficiency match
    if (matchingSkill) {
      const profScore = PROFICIENCY_SCORES[matchingSkill.proficiency] || 0;
      const reqScore = SENIORITY_SCORES[requirement.seniority || "mid"] || 2;

      if (profScore >= reqScore) {
        score += 30;
        reasons.push(`Skill proficiency: ${matchingSkill.proficiency}`);
      } else if (profScore === reqScore - 1) {
        score += 15;
        reasons.push(`Slightly under seniority (${matchingSkill.proficiency})`);
      }
    }

    // Availability bonus
    if (person.availability_status === "available") {
      score += 20;
      reasons.push("Fully available");
    } else {
      reasons.push("Partially available");
    }

    matches.push({
      role_requirement_id: requirement.id,
      person_id: person.id,
      person_name: person.name,
      match_score: score,
      hourly_rate: person.hourly_rate,
      reasons,
    });
  }

  // Sort by score descending
  return matches.sort((a, b) => b.match_score - a.match_score);
}

export async function autoStaffProject(
  orgId: string,
  projectId: string
): Promise<{ assignments: any[]; gaps: any[] }> {
  const db = createServiceClient();

  // Get all role requirements for the project
  const { data: requirements, error } = await db
    .from("role_requirements")
    .select("*, phase:phases!inner(project_id)")
    .eq("phase.project_id", projectId);

  if (error || !requirements) {
    console.error("Failed to fetch requirements:", error);
    return { assignments: [], gaps: [] };
  }

  const assignments: any[] = [];
  const gaps: any[] = [];
  const assignedPeople = new Set<string>();

  for (const req of requirements) {
    const matches = await findMatchesForRole(orgId, req);

    // Find best available match not already assigned
    const bestMatch = matches.find(m => !assignedPeople.has(m.person_id));

    if (bestMatch && bestMatch.match_score >= 50) {
      assignments.push({
        requirement: req,
        match: bestMatch,
      });
      assignedPeople.add(bestMatch.person_id);
    } else {
      gaps.push({
        requirement: req,
        reason: matches.length === 0
          ? "No one in network has this skill"
          : "All qualified people are assigned to other roles",
      });
    }
  }

  return { assignments, gaps };
}
```

### PR 11: Bench UI Pages

```
Create the people/talent network pages.

Create apps/web/app/(dashboard)/people/page.tsx:

- Server component listing all people in the org
- Cards showing name, type, skills, availability, rate
- Filters for availability status and skill
- "Add Person" button

Create apps/web/app/(dashboard)/people/new/page.tsx:

- Form to add a new person
- Fields: name, type, email, location, hourly_rate, notes
- Multi-select for skills with proficiency

Create apps/web/app/(dashboard)/people/[id]/page.tsx:

- Person detail view
- Edit skills and proficiency
- View project history (from role_requirements)
- Update availability

Add "People" link to sidebar navigation.

Create a staffing view on the project detail page:
- Show role requirements with current assignment status
- "Auto-Staff" button that calls the matcher
- Manual override to assign specific people
- Show gaps that need external hiring
```

---

## Retro Product

Retro handles post-project retrospectives and feeds the learning loop.

### PR 12: Retrospective API Routes

```
Create API routes for Retrospectives.

Create apps/web/app/api/projects/[id]/retro/route.ts:

import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

const retroSchema = z.object({
  client_satisfaction: z.number().min(1).max(5).optional(),
  what_worked: z.string().optional(),
  what_didnt: z.string().optional(),
  lessons: z.array(z.string()).optional(),
  would_repeat: z.boolean().optional(),
  phase_performances: z.array(z.object({
    phase_id: z.string().uuid(),
    actual_hours: z.number(),
    notes: z.string().optional(),
  })).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id: projectId } = await params;

    const db = getDb();

    // Verify project belongs to org
    const { data: project } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", orgId)
      .single();

    if (!project) {
      return apiError(ApiErrorCode.NOT_FOUND, "Project not found", 404);
    }

    // Get retrospective with phase performances
    const { data: retro, error } = await db
      .from("retrospectives")
      .select("*, phase_performances(*)")
      .eq("project_id", projectId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Failed to fetch retrospective:", error);
      return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch retrospective", 500);
    }

    return apiSuccess(retro || null);
  } catch (error) {
    console.error("Error in GET /api/projects/[id]/retro:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Internal server error", 500);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id: projectId } = await params;
    const body = await req.json();
    const validation = retroSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, validation.error.message, 400);
    }

    const data = validation.data;
    const db = getDb();

    // Verify project and get phases
    const { data: project } = await db
      .from("projects")
      .select("id, estimated_hours, estimated_cost, phases(id, name, estimated_hours)")
      .eq("id", projectId)
      .eq("org_id", orgId)
      .single();

    if (!project) {
      return apiError(ApiErrorCode.NOT_FOUND, "Project not found", 404);
    }

    // Calculate variances if we have phase performances
    let hoursVariance = null;
    let totalActual = 0;
    let totalEstimated = 0;

    if (data.phase_performances) {
      for (const pp of data.phase_performances) {
        const phase = project.phases?.find((p: any) => p.id === pp.phase_id);
        if (phase) {
          totalActual += pp.actual_hours;
          totalEstimated += phase.estimated_hours || 0;
        }
      }
      if (totalEstimated > 0) {
        hoursVariance = ((totalActual - totalEstimated) / totalEstimated) * 100;
      }
    }

    // Create retrospective
    const { data: retro, error: retroError } = await db
      .from("retrospectives")
      .insert({
        project_id: projectId,
        client_satisfaction: data.client_satisfaction,
        what_worked: data.what_worked,
        what_didnt: data.what_didnt,
        lessons: data.lessons,
        would_repeat: data.would_repeat,
        hours_variance_pct: hoursVariance,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (retroError) {
      console.error("Failed to create retrospective:", retroError);
      return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to create retrospective", 500);
    }

    // Create phase performances
    if (data.phase_performances) {
      for (const pp of data.phase_performances) {
        const phase = project.phases?.find((p: any) => p.id === pp.phase_id);
        const variance = phase?.estimated_hours
          ? ((pp.actual_hours - phase.estimated_hours) / phase.estimated_hours) * 100
          : null;

        await db.from("phase_performances").insert({
          retro_id: retro.id,
          phase_id: pp.phase_id,
          phase_name: phase?.name || "Unknown",
          estimated_hours: phase?.estimated_hours,
          actual_hours: pp.actual_hours,
          variance_pct: variance,
          notes: pp.notes,
        });
      }
    }

    // Update project status to complete
    await db
      .from("projects")
      .update({ status: "complete", actual_hours: totalActual })
      .eq("id", projectId);

    // Trigger estimation model update
    await updateEstimationModel(orgId, project, retro);

    return apiSuccess(retro, 201);
  } catch (error) {
    console.error("Error in POST /api/projects/[id]/retro:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Internal server error", 500);
  }
}

async function updateEstimationModel(orgId: string, project: any, retro: any) {
  const db = getDb();

  // Find or create estimation model for this project type
  const { data: existingModel } = await db
    .from("estimation_models")
    .select("*")
    .eq("org_id", orgId)
    .eq("project_type", project.type)
    .single();

  if (existingModel) {
    // Update running averages
    const newSampleSize = existingModel.sample_size + 1;
    const newAvgVariance =
      (existingModel.avg_hours_variance * existingModel.sample_size + retro.hours_variance_pct) /
      newSampleSize;

    await db
      .from("estimation_models")
      .update({
        avg_hours_variance: newAvgVariance,
        sample_size: newSampleSize,
        confidence_level: Math.min(0.95, 0.5 + newSampleSize * 0.05),
        last_updated: new Date().toISOString(),
      })
      .eq("id", existingModel.id);
  } else {
    // Create new model
    await db.from("estimation_models").insert({
      org_id: orgId,
      project_type: project.type,
      avg_hours_variance: retro.hours_variance_pct,
      sample_size: 1,
      confidence_level: 0.55,
    });
  }
}
```

### PR 13: Retro Conversation Flow

```
Add AI-guided retrospective conversation.

Create packages/ai/src/tools/retro.ts with tools:

- gather_retro_data: Collect satisfaction, what worked/didn't, lessons
- record_phase_actuals: Record actual hours per phase
- complete_retro: Finalize the retrospective

Create packages/ai/src/prompts/retro.ts:

export function getRetroPrompt(): string {
  return `You are guiding a project retrospective. Your goal is to capture actionable insights that will improve future projects.

Ask about:
1. Overall client satisfaction (1-5)
2. What went well? (concrete examples)
3. What could have been better? (specific issues)
4. Key lessons learned
5. Would you work with this client again?
6. Actual hours per phase vs. estimate

Be empathetic but focused on extracting useful data. Encourage specific examples over vague statements.

When you have enough information, use the complete_retro tool to save the retrospective.`;
}

Update getToolsForSchema and getPromptForSchema to include "retro".
```

### PR 14: Retro UI

```
Create the retrospective UI.

Add a "Complete Project" button to the project detail page that:
1. Opens a conversational retro flow
2. Shows phases with actual hours input
3. Captures qualitative feedback
4. On completion, updates project status and estimation model

Create apps/web/app/(dashboard)/projects/[id]/retro/page.tsx:

- Conversational UI for retro (reuse ChatContainer)
- Phase hours entry form
- Summary view after completion

Add to project detail page:
- Show retro summary if completed
- Show estimation model impact ("This project improved estimates by X%")
```

---

## Integration & Polish

### PR 15: Dashboard Updates

```
Update the dashboard to show Phase 1 data.

Modify apps/web/app/(dashboard)/dashboard/page.tsx:

Add stats cards for:
- Total projects (with status breakdown)
- People in network
- Estimation accuracy trend

Add quick actions for:
- New Project (Blueprint)
- Add Person (Bench)

Add a "Recent Projects" section showing the last 5 projects with status.
```

### PR 16: Estimation Model Integration

```
Connect the estimation model to Blueprint.

When creating a new project in Blueprint:
1. Fetch the org's estimation models
2. If a model exists for the project type, show adjustment suggestion
3. Apply variance adjustment to AI-suggested hours
4. Display confidence level

Create packages/ai/src/estimation/adjuster.ts:

export async function getEstimationAdjustment(
  orgId: string,
  projectType: string,
  baseEstimate: number
): Promise<{ adjusted: number; confidence: number; explanation: string }> {
  const db = createServiceClient();

  const { data: model } = await db
    .from("estimation_models")
    .select("*")
    .eq("org_id", orgId)
    .eq("project_type", projectType)
    .single();

  if (!model || model.sample_size < 3) {
    return {
      adjusted: baseEstimate,
      confidence: 0.5,
      explanation: "Not enough historical data yet. Estimate based on industry standards.",
    };
  }

  const adjustment = 1 + (model.avg_hours_variance / 100);
  const adjusted = Math.round(baseEstimate * adjustment);

  return {
    adjusted,
    confidence: model.confidence_level,
    explanation: \`Based on \${model.sample_size} similar projects, you typically run \${model.avg_hours_variance > 0 ? "over" : "under"} by \${Math.abs(model.avg_hours_variance).toFixed(0)}%. Adjusted estimate accounts for this.\`,
  };
}
```

### PR 17: Testing & Validation

```
Add tests for Phase 1 features.

Create tests for:
- Project CRUD operations
- People/skills management
- Staffing matcher algorithm
- Retrospective creation and model updates
- Estimation adjustment logic

Run the test suite:
pnpm test

Verify the learning loop:
1. Create a project with Blueprint
2. Staff it with Bench
3. Complete it with Retro
4. Create a new similar project
5. Verify estimation adjustment is applied
```

---

## Summary

Phase 1 PRs:
1. People & Skills Schema
2. Projects & Phases Schema
3. Retrospective & Learning Schema
4. Seed Skills Data
5. Projects API Routes
6. Blueprint Conversation Tools
7. Blueprint System Prompt
8. Projects UI Pages
9. People API Routes
10. Staffing Matcher Service
11. Bench UI Pages
12. Retrospective API Routes
13. Retro Conversation Flow
14. Retro UI
15. Dashboard Updates
16. Estimation Model Integration
17. Testing & Validation

**Milestone Check:**
- [ ] Can create projects via conversation (Blueprint)
- [ ] Can add people and match them to roles (Bench)
- [ ] Can complete retrospectives (Retro)
- [ ] Estimation model adjusts based on historical data
- [ ] The feedback loop is visible in the UI
