import axiosInstance from "./axiosInstance";

export interface ChatHistory {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantResponse {
  question: string;
  answer: string;
  strategy: string;
  sources: any[];
}

export const askAssistant = async (
  question: string,
  history: ChatHistory[]
) => {
  const response = await axiosInstance.post<AssistantResponse>(
    "/assistant/ask",
    {
      question,
      history,
    }
  );

  return response.data;
};