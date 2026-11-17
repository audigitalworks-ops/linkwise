-- 1. Sites Table
CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  wp_username text NOT NULL,
  wp_password_encrypted text NOT NULL, -- AES-256-GCM ciphertext:iv:authTag
  min_relevance numeric(3,2) DEFAULT 0.75 NOT NULL,
  scan_frequency text DEFAULT 'weekly' NOT NULL CHECK (scan_frequency IN ('weekly', 'manual')),
  require_approval boolean DEFAULT true NOT NULL,
  ignore_patterns text[] DEFAULT ARRAY[]::text[] NOT NULL,
  last_scanned_at timestamptz,
  connected boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_sites_user_id ON public.sites(user_id);

-- 2. Scans Table
CREATE TABLE IF NOT EXISTS public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  status text DEFAULT 'queued' NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed')),
  total_pages integer DEFAULT 0 NOT NULL,
  processed_pages integer DEFAULT 0 NOT NULL,
  step text DEFAULT 'fetching' NOT NULL CHECK (step IN ('fetching', 'indexing', 'finding')),
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_site_id ON public.scans(site_id);

-- 3. Pages Table
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  wp_id integer NOT NULL,
  wp_type text NOT NULL CHECK (wp_type IN ('post', 'page')),
  url text NOT NULL,
  path text NOT NULL,
  title text NOT NULL,
  excerpt text,
  content_text text,
  word_count integer DEFAULT 0 NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_text, ''))
  ) STORED,
  inbound_count integer DEFAULT 0 NOT NULL,
  outbound_count integer DEFAULT 0 NOT NULL,
  depth integer DEFAULT 1 NOT NULL,
  is_orphan boolean DEFAULT false NOT NULL,
  monthly_clicks integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(site_id, wp_id, wp_type)
);

CREATE INDEX IF NOT EXISTS idx_pages_site_id ON public.pages(site_id);
CREATE INDEX IF NOT EXISTS idx_pages_search_vector ON public.pages USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_pages_is_orphan ON public.pages(site_id, is_orphan);

-- 4. Page Links Table
CREATE TABLE IF NOT EXISTS public.page_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  source_page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  target_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  target_url text NOT NULL,
  anchor_text text NOT NULL,
  is_internal boolean DEFAULT true NOT NULL,
  http_status integer,
  is_broken boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_page_links_target ON public.page_links(site_id, target_page_id);
CREATE INDEX IF NOT EXISTS idx_page_links_is_broken ON public.page_links(site_id, is_broken);

-- 5. Suggestions Table
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  source_page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  target_page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  anchor_text text NOT NULL,
  source_paragraph text NOT NULL,
  relevance numeric(3,2) NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'applied', 'dismissed')),
  applied_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(source_page_id, target_page_id, anchor_text)
);

CREATE INDEX IF NOT EXISTS idx_suggestions_site_status ON public.suggestions(site_id, status);

-- 6. Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('link_applied', 'link_undone', 'link_dismissed', 'broken_fixed', 'scan_completed')),
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_site_id ON public.activity_log(site_id);

-- 7. Report Snapshots Table
CREATE TABLE IF NOT EXISTS public.report_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  health_score integer NOT NULL,
  pages_scanned integer NOT NULL,
  orphan_count integer NOT NULL,
  broken_count integer NOT NULL,
  suggestions_ready integer NOT NULL,
  links_applied integer NOT NULL,
  orphan_score integer NOT NULL,
  depth_score integer NOT NULL,
  anchor_score integer NOT NULL,
  broken_score integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(site_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_site_date ON public.report_snapshots(site_id, week_start);

-- Row Level Security (RLS) on all tables
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;

-- Sites Policy
CREATE POLICY "Users can manage own sites"
  ON public.sites FOR ALL
  USING (auth.uid() = user_id);

-- Scans Policy
CREATE POLICY "Users can manage scans for own sites"
  ON public.scans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites WHERE sites.id = scans.site_id AND sites.user_id = auth.uid()));

-- Pages Policy
CREATE POLICY "Users can manage pages for own sites"
  ON public.pages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites WHERE sites.id = pages.site_id AND sites.user_id = auth.uid()));

-- Page Links Policy
CREATE POLICY "Users can manage links for own sites"
  ON public.page_links FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites WHERE sites.id = page_links.site_id AND sites.user_id = auth.uid()));

-- Suggestions Policy
CREATE POLICY "Users can manage suggestions for own sites"
  ON public.suggestions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites WHERE sites.id = suggestions.site_id AND sites.user_id = auth.uid()));

-- Activity Log Policy
CREATE POLICY "Users can view activity for own sites"
  ON public.activity_log FOR ALL
  USING (auth.uid() = user_id);

-- Report Snapshots Policy
CREATE POLICY "Users can manage reports for own sites"
  ON public.report_snapshots FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites WHERE sites.id = report_snapshots.site_id AND sites.user_id = auth.uid()));

