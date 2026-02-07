-- Phase 1: Projects, People, Skills, and Retrospectives
-- Run this in your Supabase SQL Editor

-- ============================================
-- PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'scoping', 'proposed', 'active', 'paused', 'complete', 'cancelled')) DEFAULT 'draft',
  type TEXT CHECK (type IN ('new_build', 'redesign', 'fix', 'audit', 'retainer', 'strategy')),
  estimated_hours DECIMAL,
  actual_hours DECIMAL,
  estimated_cost DECIMAL,
  actual_cost DECIMAL,
  start_date DATE,
  end_date DATE,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(org_id, status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage projects in their org"
  ON projects FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub')
  );

-- ============================================
-- PHASES (project breakdown)
-- ============================================

CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  estimated_hours DECIMAL,
  actual_hours DECIMAL,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('planned', 'active', 'complete')) DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phases_project_id ON phases(project_id);

ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage phases for their org projects"
  ON phases FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- ============================================
-- SKILLS (shared taxonomy)
-- ============================================

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IN ('design', 'engineering', 'strategy', 'ops', 'marketing', 'data')) NOT NULL,
  market_rate_p25 DECIMAL,
  market_rate_p50 DECIMAL,
  market_rate_p75 DECIMAL,
  rate_geography TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Skills are readable by all authenticated users (shared taxonomy)
CREATE POLICY "Skills are readable by authenticated users"
  ON skills FOR SELECT TO authenticated USING (true);

-- ============================================
-- PEOPLE (talent network)
-- ============================================

CREATE TABLE IF NOT EXISTS people (
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

CREATE INDEX IF NOT EXISTS idx_people_org_id ON people(org_id);
CREATE INDEX IF NOT EXISTS idx_people_availability ON people(org_id, availability_status);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage people in their org"
  ON people FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub')
  );

-- ============================================
-- PERSON_SKILLS (junction table)
-- ============================================

CREATE TABLE IF NOT EXISTS person_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency TEXT CHECK (proficiency IN ('junior', 'mid', 'senior', 'expert')) NOT NULL,
  years_exp INTEGER,
  verified_by_projects UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_person_skills_person ON person_skills(person_id);
CREATE INDEX IF NOT EXISTS idx_person_skills_skill ON person_skills(skill_id);

ALTER TABLE person_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage person_skills for their org people"
  ON person_skills FOR ALL USING (
    person_id IN (
      SELECT id FROM people WHERE org_id IN (
        SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- ============================================
-- ROLE_REQUIREMENTS (staffing slots per phase)
-- ============================================

CREATE TABLE IF NOT EXISTS role_requirements (
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

CREATE INDEX IF NOT EXISTS idx_role_requirements_phase_id ON role_requirements(phase_id);

ALTER TABLE role_requirements ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- RETROSPECTIVES
-- ============================================

CREATE TABLE IF NOT EXISTS retrospectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
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

CREATE INDEX IF NOT EXISTS idx_retrospectives_project_id ON retrospectives(project_id);

ALTER TABLE retrospectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage retrospectives for their org projects"
  ON retrospectives FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- ============================================
-- ESTIMATION_MODELS (learned adjustments)
-- ============================================

CREATE TABLE IF NOT EXISTS estimation_models (
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

CREATE INDEX IF NOT EXISTS idx_estimation_models_org_id ON estimation_models(org_id);

ALTER TABLE estimation_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage estimation_models in their org"
  ON estimation_models FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub')
  );

-- ============================================
-- SEED DATA: Common Skills
-- ============================================

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
('Data Visualization', 'data', 65, 95, 140)
ON CONFLICT (name) DO NOTHING;
