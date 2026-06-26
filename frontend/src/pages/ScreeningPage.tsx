import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAxiosError } from "axios";
import { analyzeAndSaveScreening } from '../api/screeningApi';
import {
    FileSearch, Sparkles, Loader2, BrainCircuit, UploadCloud,
} from 'lucide-react';
import ResumeUpload from '../components/ResumeUpload';
import AnalysisResult, { type AnalysisData } from '../components/AnalysisResult';
import '../styles/screening.css';

const JD_PLACEHOLDER = `Paste the job description here...

Example:
We are looking for a Full Stack Developer with experience in React, Node.js, TypeScript, REST APIs, and cloud technologies.

Requirements:
• 4+ years of full-stack development experience
• Proficiency in React.js and Node.js
• Experience with TypeScript and REST API design
• Familiarity with AWS or GCP
• Strong problem-solving skills`;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.07 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};


export default function DashboardPage() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isResumeReady, setIsResumeReady] = useState(false);
    const [parsedResume, setParsedResume] = useState<object | null>(null); // ADD
    const [jobDescription, setJobDescription] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisData | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    const canAnalyze = uploadedFile !== null && jobDescription.trim().length > 20 && !isAnalyzing;
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);
    const handleAnalyze = async () => {
        if (!canAnalyze) return;

        setIsAnalyzing(true);
        setResult(null);
        setAnalyzeError(null);

        try {
            const data = await analyzeAndSaveScreening({
                jd_text: jobDescription,
                parsed_resume: parsedResume as object,
            });

            const matchLevel =
                data.overall_score >= 75 ? 'Excellent' :
                    data.overall_score >= 60 ? 'Good' :
                        data.overall_score >= 45 ? 'Fair' : 'Poor';

            const skills = [
                ...(data.matched_skills || []).map((s: string) => ({ name: s, matched: true })),
                ...(data.missing_skills || []).map((s: string) => ({ name: s, matched: false })),
            ];

            setResult({
                overallScore: data.overall_score,
                matchLevel,
                verdict: data.verdict,
                summary: data.ai_review,
                recommendation: data.ai_recommendation,
                skills,
                strengths: data.strengths || [],
                gaps: data.gaps || [],
                dimensionScores: data.dimension_scores || null,
            });

            setShowAnalysisModal(true); 
        } catch (error: unknown) {
            let msg = 'Analysis failed. Please try again.';

            if (isAxiosError(error)) {
                if (!error.response) {
                    msg = 'Cannot connect to server. Make sure the backend is running.';
                } else if (error.response.status === 401) {
                    msg = 'Session expired. Please log in again.';
                } else if (error.response.status === 422) {
                    msg = error.response.data?.detail || 'Job description is required.';
                } else {
                    msg = error.response.data?.detail || `Server error: ${error.response.status}`;
                }
            }

            setAnalyzeError(msg);
        }
        finally {
            setIsAnalyzing(false);
        }
    };

    const handleTextareaInput = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="dashboard-container"
        >
            <motion.div variants={itemVariants} className="dashboard-header">
                <div className="dashboard-header-top">
                    <div className="dashboard-header-icon">
                        <FileSearch />
                    </div>
                    <h2 className="dashboard-header-title">Resume Screening Workspace</h2>
                </div>
                <p className="dashboard-header-subtitle">
                    Upload resumes and evaluate candidates against job requirements using AI.
                </p>
            </motion.div>

            <div className="dashboard-content">
                <motion.div variants={itemVariants} className="dashboard-section card">
                    <div className="dashboard-section-title">
                        <UploadCloud />
                        <span>Upload Resume</span>
                    </div>

                    <ResumeUpload
                        onFileReady={async (file, parsed) => {
                            setUploadedFile(file);
                            setIsResumeReady(file !== null);
                            setParsedResume(parsed ?? null);

                            if (file === null) {
                                setParsedResume(null);
                                setResult(null);
                                setJobDescription('');
                            }
                        }}
                    />
                </motion.div>

                <motion.div variants={itemVariants} className="dashboard-section card">
                    <div className="flex justify-between items-center mb-4">
                        <div className="dashboard-section-title">
                            <Sparkles />
                            <span>Job Description</span>
                        </div>

                        <span className="text-gray-400">
                            {jobDescription.length} chars
                        </span>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={jobDescription}
                        onChange={(e) => {
                            setJobDescription(e.target.value);
                            handleTextareaInput();
                        }}
                        placeholder={isResumeReady ? JD_PLACEHOLDER : 'Upload and process a resume first...'}
                        rows={8}
                        disabled={!isResumeReady}
                        className={`input-field ${!isResumeReady ? 'disabled' : ''}`}
                    />
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="analyze-btn-wrapper"
                >
                    <motion.button
                        onClick={handleAnalyze}
                        disabled={!canAnalyze}
                        whileHover={canAnalyze ? { scale: 1.01 } : {}}
                        whileTap={canAnalyze ? { scale: 0.98 } : {}}
                        className={`analyze-btn ${canAnalyze ? "enabled" : "disabled"}`}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Analyzing Resume...
                            </>
                        ) : (
                            <>
                                <BrainCircuit />
                                Analyze Resume
                            </>
                        )}
                    </motion.button>

                    {!uploadedFile && (
                        <p className="analyze-btn-hint">
                            Upload a resume to enable AI analysis
                        </p>
                    )}

                    {uploadedFile && jobDescription.trim().length <= 20 && (
                        <p className="analyze-btn-hint">
                            Add a job description to enable AI analysis
                        </p>
                    )}

                    {analyzeError && (
                        <p className="analyze-btn-hint" style={{ color: '#ef4444' }}>{analyzeError}</p>
                    )}
                </motion.div>
            </div>
            <AnimatePresence>
                {showAnalysisModal && (
                    <motion.div
                        className="analysis-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAnalysisModal(false)}
                    >
                        <motion.div
                            className="analysis-modal"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="analysis-modal-close"
                                onClick={() => setShowAnalysisModal(false)}
                            >
                                ✕
                            </button>

                            <AnalysisResult
                                isAnalyzing={false}
                                result={result}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
}
