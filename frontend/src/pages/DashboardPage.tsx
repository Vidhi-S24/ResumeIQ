import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  FileSearch,
  TrendingUp,
  CheckCircle,
  BrainCircuit,
  Loader2,
} from "lucide-react";

import { getStatsOverview, getStatsInsights } from "../api/screeningApi";
import "../styles/dashboard.css";

interface StatsOverview {
  total_screenings: number;
  average_score: number;
  shortlisted_count: number;
  total_candidates: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [statsData, insightsData] = await Promise.all([
          getStatsOverview(),
          getStatsInsights(),
        ]);

        setStats(statsData);
        setInsights(insightsData.insights ?? []);
      } catch (err) {
        console.error(err);
        setError("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="overview-container">
        <div className="dashboard-loading">
          <Loader2 className="animate-spin" size={28} />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="overview-container">
        <p style={{ color: "#ef4444" }}>
          {error ?? "Failed to load dashboard."}
        </p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Screenings",
      value: stats.total_screenings,
      icon: FileSearch,
      onClick: () => navigate("/candidates"),
    },
    {
      title: "Average ATS Score",
      value: `${stats.average_score}%`,
      icon: TrendingUp,
    },
    {
      title: "Shortlisted",
      value: stats.shortlisted_count,
      icon: CheckCircle,
    },
    {
      title: "Candidates",
      value: stats.total_candidates,
      icon: Users,
    },
  ];

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div>
          <h1>Welcome Back</h1>
          <p>
            Monitor resume screening performance and candidate insights.
          </p>
        </div>

        <button
          className="overview-primary-btn"
          onClick={() => navigate("/screening")}
        >
          New Screening
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              whileHover={{ y: -4 }}
              className={`stat-card ${item.onClick ? "clickable" : ""}`}
              onClick={item.onClick}
              style={{
                cursor: item.onClick ? "pointer" : "default",
              }}
            >
              <div className="stat-icon">
                <Icon />
              </div>

              <div className="stat-value">{item.value}</div>

              <div className="stat-label">{item.title}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="insights-card">
        <div className="insight-header">
          <BrainCircuit />
          <h3>AI Insights</h3>
        </div>

        {insights.length > 0 ? (
          <ul>
            {insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        ) : (
          <p>No insights available yet.</p>
        )}
      </div>
    </div>
  );
}