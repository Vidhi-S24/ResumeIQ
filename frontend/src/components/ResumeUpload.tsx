import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, X, CheckCircle, Loader2, AlertCircle, File
} from 'lucide-react';
import axios from "axios";
import '../styles/upload.css';

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

interface ResumeUploadProps {
  onFileReady: (file: File | null, parsed?: object | null) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function ResumeUpload({ onFileReady }: ResumeUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uiProgress, setUiProgress] = useState(0);

  const uploadToBackend = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "http://localhost:8000/upload-resume",
        formData,
      );

      console.log("✅ Backend Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Upload failed:", error);
      throw error;
    }
  };

  const handleFile = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    const isValid = validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx');
    if (!isValid) {
      alert('Only PDF and DOCX files are supported.');
      return;
    }

    const id = Math.random().toString(36).slice(2);

    // Flag 1: file is being sent to backend
    setUploadedFile({ file, id, status: 'uploading' });
    onFileReady(null);

    try {
      // Flag 2: file received, model is now extracting
      setUploadedFile((prev) => prev ? { ...prev, status: 'processing' } : null);
      await uploadToBackend(file);

      // Flag 3: everything done
      const data = await uploadToBackend(file);
      setUploadedFile((prev) => prev ? { ...prev, status: 'done' } : null);
      onFileReady(file, data?.parsed_resume ?? null);

    } catch (error: unknown) {
      console.error('❌ Upload failed:', error);

      let errorMessage = 'Upload failed. Please try again.';

      if (axios.isAxiosError(error)) {
        if (!error.response) {
          errorMessage = 'Cannot connect to server. Make sure the backend is running.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error while processing resume. Check backend logs.';
        } else if (error.response.status === 422) {
          errorMessage = 'Invalid file format sent to server.';
        } else if (error.response.status === 503) {
          errorMessage = 'Ollama is not running. Start Ollama and try again.';
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Flag 4: error with specific message
      setUploadedFile((prev) => prev ? { ...prev, status: 'error', errorMessage } : null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setUploadedFile(null);
    onFileReady(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const fileExt = uploadedFile?.file.name.split('.').pop()?.toUpperCase() ?? '';

  useEffect(() => {
    if (!uploadedFile) return;

    let interval: ReturnType<typeof setInterval>;

    if (uploadedFile.status === 'uploading') {
      setUiProgress(10);

      interval = setInterval(() => {
        setUiProgress((prev) => Math.min(prev + 5, 70));
      }, 250);
    }

    if (uploadedFile.status === 'processing') {
      setUiProgress(70);

      interval = setInterval(() => {
        setUiProgress((prev) => Math.min(prev + 2, 95));
      }, 400);
    }

    if (uploadedFile.status === 'done') {
      setUiProgress(100);
    }

    if (uploadedFile.status === 'error') {
      setUiProgress(0);
    }

    return () => clearInterval(interval);
  }, [uploadedFile?.status]);

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`upload-zone ${isDragging ? 'dragging' : 'default'}`}
          >
            <div className="upload-icon">
              <UploadCloud />
            </div>

            <div className="upload-text">
              <p className="upload-main">
                {isDragging ? 'Drop to upload' : 'Drag & drop your resume here'}
              </p>
              <p className="upload-sub">or click to browse files</p>
            </div>

            <div className="upload-formats">
              <span className="badge bg-sage-100">PDF</span>
              <span className="badge bg-sage-100">DOCX</span>
              <span className="text-gray-400">Max 10MB</span>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              className="upload-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="file-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="upload-file-card"
          >
            <div className={`upload-file-icon ${fileExt === 'PDF' ? 'pdf' : 'docx'}`}>
              <File />
              <span>{fileExt}</span>
            </div>

            <div className="upload-file-info">
              <p className="upload-file-name">{uploadedFile.file.name}</p>
              <p className="upload-file-size">{formatBytes(uploadedFile.file.size)}</p>

              {(uploadedFile.status === 'uploading' || uploadedFile.status === 'processing') && (
                <div className="upload-file-progress">
                  <div className="upload-progress-header">
                    <span className="upload-progress-label">
                      {uploadedFile.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                    </span>

                    <span className="upload-progress-percent">
                      {Math.round(uiProgress)}%
                    </span>
                  </div>

                  <div className="upload-progress-bar">
                    <motion.div
                      className="upload-progress-fill"
                      animate={{ width: `${uiProgress}%` }}
                      transition={{ ease: 'linear', duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {uploadedFile.status === 'done' && (
                <div className="upload-file-status done">
                  <CheckCircle />
                  <span className="upload-file-status-text">Ready to analyze</span>
                </div>
              )}

              {uploadedFile.status === 'error' && (
                <div className="upload-file-status error">
                  <AlertCircle size={14} />
                  <span className="upload-file-status-text">
                    {uploadedFile.errorMessage ?? 'Upload failed. Please try again.'}
                  </span>
                </div>
              )}
            </div>

            {(uploadedFile.status === 'done' || uploadedFile.status === 'error') && (
              <button onClick={handleRemove} className="upload-file-remove">
                <X />
              </button>
            )}
            
            {(uploadedFile.status === 'uploading' || uploadedFile.status === 'processing') && (
              <Loader2 className="upload-file-loading animate-spin" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}