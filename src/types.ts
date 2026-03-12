export interface Story {
  id: string;
  docId?: string;
  title: string;
  summary: string;
  category: string;
  region: string;
  verified_score: number;
  editorial_scores?: {
    novelty: number;
    emotional_lift: number;
    shareability: number;
    visual_potential: number;
    audience_fit: number;
    shelf_life: number;
    explainer_needed: number;
  };
  proof_assets?: {
    claim_cards: string[];
    source_badges: string[];
    confidence_meter: number;
    verification_summary: string;
  };
  status: 'pending' | 'verified' | 'published';
  is_saved?: boolean | number;
  created_at: any;
  source_count?: number;
}

export interface Source {
  id?: number;
  story_id: string;
  url: string;
  title: string;
  content?: string;
  is_primary: boolean;
}

export interface Claim {
  id?: number;
  story_id: string;
  claim_text: string;
  evidence_status: string;
}

export interface ContentPackage {
  id?: string;
  story_id: string;
  format: '15s_hook' | '45s_reel' | '90s_explainer';
  platform: 'tiktok' | 'instagram';
  hook?: string;
  script: string;
  visual_description: string;
  performance?: {
    watch_time: number;
    completion_rate: number;
    shares: number;
    saves: number;
    comments: number;
    reposts: number;
    clicks: number;
  };
}
