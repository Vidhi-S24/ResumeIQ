import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Briefcase,
  Calendar,
  Loader2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

import { getScreeningById } from '../api/screeningApi';
import '../styles/candidate-report.css';

interface Screening {
  id: string;
  candidate_name: string;
  job_description: { job_title: string; raw_text?: string };
  verdict: 'QUALIFIED' | 'PARTIALLY_QUALIFIED' | 'NOT_QUALIFIED';
  overall_score: number;
  dimension_scores: {
    skills: number;
    experience: number;
    education: number;
    domain_relevance: number;
  };
  score_breakdown: {
    skills_calculation: string;
    experience_calculation: string;
    education_calculation: string;
    domain_calculation: string;
  };
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  gaps: string[];
  ai_review: string;
  ai_recommendation: string;
  created_at: string;
}

const VERDICT_STYLES = {
  QUALIFIED: { label: 'Qualified', color: '#0f766e', bg: '#ecfdf5', icon: CheckCircle },
  PARTIALLY_QUALIFIED: { label: 'Partially Qualified', color: '#b45309', bg: '#fffbeb', icon: ShieldCheck },
  NOT_QUALIFIED: { label: 'Not Qualified', color: '#b91c1c', bg: '#fef2f2', icon: XCircle },
};

export default function CandidateReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Screening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScreening = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await getScreeningById(id);
        setCandidate(data);
      } catch {
        setError('Could not load this candidate report.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchScreening();
  }, [id]);

  if (isLoading) {
    return (
      <div className="report-loading">
        <Loader2 className="animate-spin" size={28} />
        <p>Loading candidate report...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="report-not-found">
        <p>{error || 'Candidate not found'}</p>
        <button className="back-btn" onClick={() => navigate('/candidates')}>
          <ArrowLeft size={18} />
          Back to Candidates
        </button>
      </div>
    );
  }

  const verdictStyle = VERDICT_STYLES[candidate.verdict] || VERDICT_STYLES.PARTIALLY_QUALIFIED;
  const VerdictIcon = verdictStyle.icon;

  const radarData = [
    { dimension: 'Skills', score: candidate.dimension_scores.skills },
    { dimension: 'Experience', score: candidate.dimension_scores.experience },
    { dimension: 'Education', score: candidate.dimension_scores.education },
    { dimension: 'Domain Fit', score: candidate.dimension_scores.domain_relevance },
  ];

  const barData = [
    { name: 'Skills', value: candidate.dimension_scores.skills },
    { name: 'Experience', value: candidate.dimension_scores.experience },
    { name: 'Education', value: candidate.dimension_scores.education },
    { name: 'Domain Fit', value: candidate.dimension_scores.domain_relevance },
  ];

  const barColor = (value: number) =>
    value >= 70 ? '#0f766e' : value >= 45 ? '#d97706' : '#dc2626';

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <motion.div
      className="candidate-report-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <button className="back-btn" onClick={() => navigate('/candidates')}>
        <ArrowLeft size={18} />
        Back to Candidates
      </button>

      {/* HERO */}
      <motion.div
        className="report-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="hero-left">
          <div className="report-avatar">
            {candidate.candidate_name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>

          <div>
            <h1>{candidate.candidate_name}</h1>

            <div className="hero-meta">
              <span>
                <Briefcase size={15} />
                {candidate.job_description?.job_title || 'No title specified'}
              </span>
              <span>
                <Calendar size={15} />
                Screened {formatDate(candidate.created_at)}
              </span>
            </div>

            <div
              className="verdict-pill"
              style={{ background: verdictStyle.bg, color: verdictStyle.color }}
            >
              <VerdictIcon size={15} />
              {verdictStyle.label}
            </div>
          </div>
        </div>

        <div className="hero-score">
          <span style={{ color: barColor(candidate.overall_score) }}>
            {candidate.overall_score}
          </span>
          <p>Overall Match Score</p>
        </div>
      </motion.div>

      {/* CHARTS ROW */}
      <div className="charts-grid">
        <motion.div
          className="report-section chart-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="section-heading">
            <TrendingUp size={16} />
            <h2>Competency Radar</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#0f766e"
                fill="#0f766e"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="report-section chart-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="section-heading">
            <Sparkles size={16} />
            <h2>Score Breakdown</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} width={90} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={barColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* SCORE REASONING */}
      <motion.div
        className="report-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="section-heading">
          <h2>How Each Score Was Calculated</h2>
        </div>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <span className="breakdown-label">Skills</span>
            <p>{candidate.score_breakdown.skills_calculation}</p>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Experience</span>
            <p>{candidate.score_breakdown.experience_calculation}</p>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Education</span>
            <p>{candidate.score_breakdown.education_calculation}</p>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Domain Relevance</span>
            <p>{candidate.score_breakdown.domain_calculation}</p>
          </div>
        </div>
      </motion.div>

      {/* SKILLS */}
      <div className="skills-grid">
        <motion.div
          className="report-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2>Matched Skills</h2>
          <div className="skill-list">
            {candidate.matched_skills.length === 0 && (
              <p className="empty-note">No matched skills found.</p>
            )}
            {candidate.matched_skills.map((skill) => (
              <div key={skill} className="skill-item success">
                <CheckCircle size={16} />
                {skill}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="report-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2>Missing Skills</h2>
          <div className="skill-list">
            {candidate.missing_skills.length === 0 && (
              <p className="empty-note">No missing skills — full match.</p>
            )}
            {candidate.missing_skills.map((skill) => (
              <div key={skill} className="skill-item danger">
                <XCircle size={16} />
                {skill}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* STRENGTHS + GAPS */}
      <div className="skills-grid">
        <motion.div
          className="report-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2>Strengths</h2>
          <ul className="reason-list">
            {candidate.strengths.map((s, i) => (
              <li key={i}>
                <CheckCircle size={14} className="reason-icon success" />
                {s}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="report-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2>Gaps</h2>
          <ul className="reason-list">
            {candidate.gaps.map((g, i) => (
              <li key={i}>
                <span className="reason-dot" />
                {g}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* AI SUMMARY */}
      <motion.div
        className="report-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <h2>AI Summary</h2>
        <p className="summary-text">{candidate.ai_review}</p>
      </motion.div>

      {/* RECOMMENDATION */}
      <motion.div
        className="recommendation-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Sparkles size={22} />
        <div>
          <h3>HR Recommendation</h3>
          <p>{candidate.ai_recommendation}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}