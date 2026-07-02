import axiosInstance from "./axiosInstance";
import { CANDIDATES_PER_PAGE } from "../constants";


export interface AnalyzeResumePayload {
  jd_text: string;
  parsed_resume: object;
  job_title?: string;
}

export const analyzeAndSaveScreening = async (data: AnalyzeResumePayload) => {
  const res = await axiosInstance.post("/screenings/analyze", data);
  return res.data;
};

export const getAllScreenings = async (
  page = 1,
  limit = CANDIDATES_PER_PAGE,
  verdict?: string,
  search?: string,
  sortBy?: string,
) => {
  const params: Record<string, string | number> = { page, limit };
  if (verdict) params.verdict = verdict;
  if (search) params.search = search;
  if (sortBy) params.sortBy = sortBy;
  const res = await axiosInstance.get("/screenings", { params });
  return res.data;
};

export const getScreeningById = async (screeningId: string) => {
  const res = await axiosInstance.get(`/screenings/${screeningId}`);
  return res.data;
};

export const deleteScreening = async (screeningId: string) => {
  const res = await axiosInstance.delete(`/screenings/${screeningId}`);
  return res.data;
};

export const getStatsOverview = async () => {
  const res = await axiosInstance.get("/screenings/stats/overview");
  return res.data;
};

export const getStatsInsights = async () => {
  const res = await axiosInstance.get("/screenings/stats/insights");
  return res.data;
};

export const getRecentScreenings = async () => {
  const res = await axiosInstance.get("/screenings/stats/recent");
  return res.data;
};