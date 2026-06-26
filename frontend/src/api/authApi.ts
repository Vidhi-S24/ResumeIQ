import axiosInstance from "./axiosInstance";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  company_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterPayload) => {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (data: LoginPayload) => {
  const res = await axiosInstance.post("/auth/login", data);
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await axiosInstance.get("/auth/me");
  return res.data;
};