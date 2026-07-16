export interface AuthResponse {
  access: string;
  refresh: string;
  // If your Django backend sends back user info too, you can add it here:
  // user_id?: number;
  // username?: string;
}


export interface PlatformPrice {
  vendor: string;
  price: number;
  currency: string;
  url: string;
  inStock: boolean;
  deliveryDays: number;
  rating: number; // 1-5
  stock?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  prices: PlatformPrice[];
  tags: string[]; // e.g., "microcontroller", "sensor", "iot"
  chart_history?: any[];
}

export interface KitItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface ProjectKit {
  id: string;
  name: string;
  description: string;
  items: KitItem[];
  totalEstimatedCost: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}


export enum AnalysisType {
  FEASIBILITY = 'Feasibility',
  COMPETITORS = 'Competitors',
  IMPROVEMENTS = 'Improvements',
  FEATURES = 'New Features',
  PROBLEMS = 'Potential Problems'
}

export interface AnalysisMetric {
  label: string;
  value: number; // 0-100
  comment: string;
}

export interface AnalysisKeyPoint {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'info';
  text: string;
}

// Extended for richer UI
export interface AnalysisReport {
  title: string;
  summary: string;
  overallScore: number;
  marketOutlook: 'Positive' | 'Neutral' | 'Negative';
  estimatedTimeline: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  metrics: AnalysisMetric[];
  keyPoints: AnalysisKeyPoint[];
  // Optional extras for specific views
  competitors?: { name: string; strength: string; weakness: string }[];
  roadmap?: { phase: string; duration: string; features: string[] }[];
}

export interface SuggestedProduct {
  id: number;
  name: string;
  category: string;
  estimated_price: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
  // 👇 Add this optional field for the interactive UI cards
  structuredData?: {
    type: 'product_recommendation';
    message: string;
    products: SuggestedProduct[];
  };
}