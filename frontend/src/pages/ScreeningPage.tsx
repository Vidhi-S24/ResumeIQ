import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAxiosError } from 'axios';
import { analyzeAndSaveScreening } from '../api/screeningApi';
import { uploadResumesBulk, analyzeResumesBulk, type RankedResult } from '../api/bulkScreeningApi';
import {
    FileSearch, Sparkles, Loader2, BrainCircuit, UploadCloud,
    X, AlertTriangle, FileStack, User,
} from 'lucide-react';
import ResumeUpload from '../components/ResumeUpload';
import AnalysisResult, { type AnalysisData } from '../components/AnalysisResult';
import '../styles/screening.css';
import '../styles/bulk-screening.css';

const JD_PLACEHOLDER = `Paste the job description here...

Example:
We are looking for a Full Stack Developer with experience in React, Node.js, TypeScript, REST APIs, and cloud technologies.

Requirements:
- 4+ years of full-stack development experience
- Proficiency in React.js and Node.js
- Experience with TypeScript and REST API design
- Familiarity with AWS or GCP
- Strong problem-solving skills`;

const BULK_JD_PLACEHOLDER = `Paste the job description here...

This single JD will be matched against every uploaded resume.`;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

type ScreeningMode = 'single' | 'bulk';
type BulkStage = 'idle' | 'uploading' | 'analyzing' | 'done';

export default function ScreeningPage() {
    // ───────── MODE TOGGLE ─────────
    const [mode, setMode] = useState<ScreeningMode>('single');

    // ───────── SINGLE SCREENING STATE ─────────
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isResumeReady, setIsResumeReady] = useState(false);
    const [parsedResume, setParsedResume] = useState<object | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisData | null>(null);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ───────── BULK SCREENING STATE ─────────
    const [bulkFiles, setBulkFiles] = useState<File[]>([]);
    const [bulkJobTitle, setBulkJobTitle] = useState('');
    const [bulkJdText, setBulkJdText] = useState('');
    const [bulkStage, setBulkStage] = useState<BulkStage>('idle');
    const [rankedResults, setRankedResults] = useState<RankedResult[]>([]);
    const [failedResults, setFailedResults] = useState<{ candidate_name: string; error: string }[]>([]);
    const [bulkError, setBulkError] = useState<string | null>(null);
    const bulkInputRef = useRef<HTMLInputElement>(null);
    const allResumesUploaded = bulkFiles.length >= 1;
    const canAnalyze = uploadedFile !== null && jobDescription.trim().length > 20 && !isAnalyzing;
    const canSubmitBulk = bulkFiles.length > 0 && bulkJdText.trim().length >= 20 && bulkStage === 'idle';

    // ───────── SINGLE SCREENING LOGIC ─────────
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
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleTextareaInput = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
    };

    // ───────── BULK SCREENING LOGIC ─────────
    const handleBulkFileSelect = (selected: FileList | null) => {
        if (!selected) return;
        const valid = Array.from(selected).filter(
            (f) => f.name.endsWith('.pdf') || f.name.endsWith('.docx')
        );
        setBulkFiles((prev) => [...prev, ...valid]);
    };

    const handleRemoveBulkFile = (index: number) => {
        setBulkFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleBulkAnalyze = async () => {
        if (!canSubmitBulk) return;

        setBulkError(null);
        setBulkStage('uploading');

        try {
            const uploadData = await uploadResumesBulk(bulkFiles);

            const successfulResumes = uploadData.results
                .filter((r) => r.status === 'success')
                .map((r) => r.parsed_resume as object);

            if (successfulResumes.length === 0) {
                setBulkError('No resumes could be parsed successfully.');
                setBulkStage('idle');
                return;
            }

            setBulkStage('analyzing');
            const analyzeData = await analyzeResumesBulk(bulkJdText, bulkJobTitle, successfulResumes);
            setRankedResults(analyzeData.ranked_results);
            setFailedResults(analyzeData.failed_results);
            setBulkStage('done');
        } catch (error: unknown) {
            let msg = 'Something went wrong. Please try again.';
            if (isAxiosError(error) && error.response) {
                msg = (error.response.data as { detail?: string })?.detail || msg;
            }
            setBulkError(msg);
            setBulkStage('idle');
        }
    };

    const handleBulkReset = () => {
        setBulkFiles([]);
        setBulkJobTitle('');
        setBulkJdText('');
        setBulkStage('idle');
        setRankedResults([]);
        setFailedResults([]);
        setBulkError(null);
    };

    const verdictColor = (verdict: string) =>
        verdict === 'QUALIFIED' ? '#0f766e' : verdict === 'PARTIALLY_QUALIFIED' ? '#d97706' : '#dc2626';

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

                {/* ───────── MODE TOGGLE ───────── */}
                <div className="screening-mode-toggle">
                    <button
                        className={mode === 'single' ? 'active' : ''}
                        onClick={() => setMode('single')}
                    >
                        <User size={15} />
                        Single Resume
                    </button>
                    <button
                        className={mode === 'bulk' ? 'active' : ''}
                        onClick={() => setMode('bulk')}
                    >
                        <FileStack size={15} />
                        Multiple Resumes
                    </button>
                </div>
            </motion.div>

            {/* ═══════════════════ SINGLE MODE ═══════════════════ */}
            {mode === 'single' && (
                <>
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
                                <span className="text-gray-400">{jobDescription.length} chars</span>
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

                        <motion.div variants={itemVariants} className="analyze-btn-wrapper">
                            <motion.button
                                onClick={handleAnalyze}
                                disabled={!canAnalyze}
                                whileHover={canAnalyze ? { scale: 1.01 } : {}}
                                whileTap={canAnalyze ? { scale: 0.98 } : {}}
                                className={`analyze-btn ${canAnalyze ? 'enabled' : 'disabled'}`}
                            >
                                {isAnalyzing ? (
                                    <><Loader2 className="animate-spin" /> Analyzing Resume...</>
                                ) : (
                                    <><BrainCircuit /> Analyze Resume</>
                                )}
                            </motion.button>

                            {!uploadedFile && (
                                <p className="analyze-btn-hint">Upload a resume to enable AI analysis</p>
                            )}
                            {uploadedFile && jobDescription.trim().length <= 20 && (
                                <p className="analyze-btn-hint">Add a job description to enable AI analysis</p>
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
                                    <button className="analysis-modal-close" onClick={() => setShowAnalysisModal(false)}>
                                        ✕
                                    </button>
                                    <AnalysisResult isAnalyzing={false} result={result} />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* ═══════════════════ BULK MODE ═══════════════════ */}
            {mode === 'bulk' && (
                <>
                    {bulkStage !== 'done' && (
                        <div className="dashboard-content">
                            <motion.div variants={itemVariants} className="dashboard-section card">
                                <div className="dashboard-section-title">
                                    <UploadCloud />
                                    <span>Upload Resumes (multiple allowed)</span>
                                </div>

                                <div
                                    className="bulk-dropzone"
                                    onClick={() => bulkInputRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleBulkFileSelect(e.dataTransfer.files);
                                    }}
                                >
                                    <UploadCloud size={28} />
                                    <p>Drag & drop multiple resumes, or click to browse</p>
                                    <span className="bulk-hint">PDF or DOCX — up to 50 files</span>
                                    <input
                                        ref={bulkInputRef}
                                        type="file"
                                        multiple
                                        accept=".pdf,.docx"
                                        className="hidden-input"
                                        onChange={(e) => handleBulkFileSelect(e.target.files)}
                                    />
                                </div>

                                {bulkFiles.length > 0 && (
                                    <div className="bulk-file-list">
                                        {bulkFiles.map((f, i) => (
                                            <div key={i} className="bulk-file-chip">
                                                <span>{f.name}</span>
                                                <button onClick={() => handleRemoveBulkFile(i)}><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            <motion.div variants={itemVariants} className="dashboard-section card">
                                <div className="dashboard-section-title">
                                    <Sparkles />
                                    <span>Job Description</span>
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={bulkJdText}
                                    onChange={(e) => {
                                        setBulkJdText(e.target.value);
                                        handleTextareaInput();
                                    }}
                                    placeholder={
                                        bulkFiles.length > 0
                                            ? BULK_JD_PLACEHOLDER
                                            : 'Upload resumes first...'
                                    }
                                    rows={8}
                                    disabled={bulkFiles.length === 0}
                                    className={`input-field ${bulkFiles.length === 0 ? 'disabled' : ''}`}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants} className="analyze-btn-wrapper">
                                <motion.button
                                    onClick={handleBulkAnalyze}
                                    disabled={!canSubmitBulk}
                                    whileHover={canSubmitBulk ? { scale: 1.01 } : {}}
                                    whileTap={canSubmitBulk ? { scale: 0.98 } : {}}
                                    className={`analyze-btn ${canSubmitBulk ? 'enabled' : 'disabled'}`}
                                >
                                    {bulkStage === 'uploading' && <><Loader2 className="animate-spin" /> Uploading & parsing resumes...</>}
                                    {bulkStage === 'analyzing' && <><BrainCircuit className="animate-spin" /> Screening {bulkFiles.length} candidates...</>}
                                    {bulkStage === 'idle' && <><BrainCircuit /> Screen All Resumes</>}
                                </motion.button>

                                {bulkFiles.length === 0 && (
                                    <p className="analyze-btn-hint">Upload at least one resume to enable AI analysis</p>
                                )}
                                {bulkFiles.length > 0 && bulkJdText.trim().length < 20 && (
                                    <p className="analyze-btn-hint">Add a job description to enable AI analysis</p>
                                )}
                                {bulkError && (
                                    <p className="analyze-btn-hint" style={{ color: '#ef4444' }}>{bulkError}</p>
                                )}
                            </motion.div>
                        </div>
                    )}

                    {/* ───────── RANKING RESULTS TABLE ───────── */}
                    <AnimatePresence>
                        {bulkStage === 'done' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bulk-results">
                                <div className="bulk-results-header">
                                    <button className="bulk-reset-btn" onClick={handleBulkReset}>Start New Batch</button>
                                </div>
                                {failedResults.length > 0 && (
                                    <div className="bulk-failed-section">
                                        <AlertTriangle size={16} />
                                        <span>{failedResults.length} resume(s) could not be screened:</span>
                                        <ul>
                                            {failedResults.map((f, i) => (
                                                <li key={i}>{f.candidate_name} — {f.error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </motion.div>
    );
}