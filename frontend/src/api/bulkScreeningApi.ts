import axios from "axios";
import axiosInstance from "./axiosInstance";

const CORE_API_URL = "http://localhost:8000";

export interface BulkUploadResult {
  filename: string;
  status: "success" | "failed";
  parsed_resume?: object;
  error?: string;
}

export interface BulkUploadResponse {
  total: number;
  success_count: number;
  failed_count: number;
  results: BulkUploadResult[];
}

export const uploadResumesBulk = async (files: File[]): Promise<BulkUploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await axios.post(`${CORE_API_URL}/upload-resumes-bulk`, formData);
  return res.data;
};

export interface RankedResult {
  rank: number;
  id: string;
  candidate_name: string;
  verdict: string;
  overall_score: number;
  matched_skills: string[];
  missing_skills: string[];
  ai_recommendation: string;
}

export interface BulkAnalyzeResponse {
  total_submitted: number;
  success_count: number;
  failed_count: number;
  ranked_results: RankedResult[];
  failed_results: { candidate_name: string; status: string; error: string }[];
}

export const analyzeResumesBulk = async (
  jdText: string,
  jobTitle: string,
  parsedResumes: object[]
): Promise<BulkAnalyzeResponse> => {
  const res = await axiosInstance.post("/screenings/analyze-bulk", {
    jd_text: jdText,
    job_title: jobTitle,
    parsed_resumes: parsedResumes,
  });
  return res.data;
};