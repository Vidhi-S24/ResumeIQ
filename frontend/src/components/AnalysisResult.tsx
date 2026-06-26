import { motion } from 'framer-motion';
import { Loader2, Sparkles, CheckCircle, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';
import '../styles/analysis.css';

interface AnalysisResultProps {
  isAnalyzing: boolean;
  result: AnalysisData | null;
}

export interface AnalysisData {
  overallScore: number;
  matchLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  verdict: 'QUALIFIED' | 'NOT_QUALIFIED' | 'PARTIALLY_QUALIFIED';
  summary: string;
  strengths: string[];
  gaps: string[];
  skills: { name: string; matched: boolean }[];
  recommendation: string;
  dimensionScores: {
    skills: number;
    experience: number;
    education: number;
    domain_relevance: number;
  } | null;
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="score-ring">
      <svg width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <motion.circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="score-ring-text">
        <motion.span
          className="score-ring-value"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="score-ring-label">/ 100</span>
      </div>
    </div>
  );
}

function DimensionBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
        <span style={{ color: '#6b7280' }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>{score}%</span>
      </div>
      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          style={{ height: '100%', background: color, borderRadius: 99 }}
        />
      </div>
    </div>
  );
}

export default function AnalysisResult({ isAnalyzing, result }: AnalysisResultProps) {
  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card analysis-loading"
      >
        <div className="analysis-loading-icon">
          <Loader2 />
        </div>
        <h3 className="analysis-loading-title">Analyzing Resume</h3>
        <p className="analysis-loading-subtitle">Our AI is evaluating the candidate's profile against your requirements...</p>
        <div className="analysis-loading-steps">
          {['Parsing resume content', 'Matching skills & experience', 'Computing relevance score', 'Generating insights'].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.4 }}
              className="analysis-loading-step"
            >
              <div className="analysis-loading-step-dot" />
              {step}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  const matchColors: Record<string, string> = {
    Excellent: 'excellent',
    Good: 'good',
    Fair: 'fair',
    Poor: 'poor',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="card p-5">
        <div className="analysis-header">
          <ScoreRing score={result.overallScore} />
          <div className="flex-1">
            <div className="flex gap-3 mb-2">
              <h3 className="analysis-title">AI Screening Result</h3>
              <span className="analysis-badge" style={{
                background: result.verdict === 'QUALIFIED' ? '#ecfdf5' : result.verdict === 'NOT_QUALIFIED' ? '#fef2f2' : '#fffbeb',
                color: result.verdict === 'QUALIFIED' ? '#065f46' : result.verdict === 'NOT_QUALIFIED' ? '#991b1b' : '#92400e',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                {result.verdict === 'QUALIFIED' && <CheckCircle size={14} />}
                {result.verdict === 'NOT_QUALIFIED' && <XCircle size={14} />}
                {result.verdict === 'PARTIALLY_QUALIFIED' && <AlertTriangle size={14} />}
                {result.verdict === 'QUALIFIED' ? 'Qualified' : result.verdict === 'NOT_QUALIFIED' ? 'Not Qualified' : 'Partially Qualified'}
              </span>
            </div>
            <p className="analysis-summary">{result.summary}</p>
            <div className="analysis-recommendation">
              <Sparkles />
              <p className="analysis-recommendation-text">{result.recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {result.dimensionScores && (
        <div className="card p-5">
          <div className="analysis-section-title" style={{ marginBottom: 16 }}>
            <TrendingUp size={16} />
            <span>Score Breakdown</span>
          </div>
          <DimensionBar label="Skills Match" score={result.dimensionScores.skills} />
          <DimensionBar label="Experience Match" score={result.dimensionScores.experience} />
          <DimensionBar label="Education Match" score={result.dimensionScores.education} />
          <DimensionBar label="Domain Relevance" score={result.dimensionScores.domain_relevance} />
        </div>
      )}
    </motion.div>
  );
}
