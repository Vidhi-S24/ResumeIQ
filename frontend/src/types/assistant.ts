export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface AssistantSource {
  candidate_name: string;
  overall_score: number;
  verdict: string;
  matched_skills: string[];
  missing_skills: string[];
  ai_review: string;
  ai_recommendation: string;
  score: number;
}

export interface AssistantResponse {
  question: string;
  intent: string;
  answer: string;
  sources: AssistantSource[];
}