import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CANDIDATES_PER_PAGE } from '../constants';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
} from 'lucide-react';

import { getAllScreenings, deleteScreening } from '../api/screeningApi';
import '../styles/candidates.css';

interface Screening {
  id: string;
  candidate_name: string;
  job_description: { job_title: string };
  verdict: string;
  overall_score: number;
  created_at: string;
}

export default function CandidatesPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState<Screening[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(() => {
    return Number(localStorage.getItem('candidatePage')) || 1;
  });

  const avatarColors = [
    '#16b1a4',
    '#8299ca',
    '#7C3AED',
    '#c75387',
    '#db7741',
    '#32aa84',
    '#47acc5',
    '#9491c9',
    '#a7c77a',
    '#b894da',
    '#cf6940',
    '#af5b7e',
  ];

  const getAvatarColor = (text: string) => {
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchScreenings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllScreenings(currentPage, CANDIDATES_PER_PAGE, undefined, search);
        setCandidates(data.screenings);
        setTotalCount(data.total);
      } catch {
        setError('Failed to load candidates. Please try again.');
      } finally {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    };
    fetchScreenings();
  }, [currentPage, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    localStorage.setItem('candidatePage', String(currentPage));
  }, [currentPage]);

  const handleDelete = async () => {
    if (!candidateToDelete) return;

    try {
      setIsDeleting(true);

      await deleteScreening(candidateToDelete);

      setCandidates((prev) =>
        prev.filter((c) => c.id !== candidateToDelete)
      );

      setTotalCount((prev) => prev - 1);

      setShowDeleteModal(false);
      setCandidateToDelete(null);
    } catch {
      alert('Failed to delete this record. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / CANDIDATES_PER_PAGE);

  const getStatusClass = (verdict: string) => {
    switch (verdict) {
      case 'QUALIFIED': return 'status-shortlisted';
      case 'PARTIALLY_QUALIFIED': return 'status-review';
      case 'NOT_QUALIFIED': return 'status-rejected';
      default: return '';
    }
  };

  const formatVerdict = (verdict: string) =>
    verdict.toLowerCase().split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (isInitialLoading) {
    return (
      <div className="candidates-page">
        <div className="flex items-center justify-center" style={{ padding: '4rem' }}>
          <Loader2 className="animate-spin" />
          <span style={{ marginLeft: '0.5rem' }}>Loading candidates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidates-page">
        <p style={{ color: '#ef4444', padding: '2rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="candidates-page">
      <div className="candidates-header">
        <div>
          <div className="candidates-title-row">
            <div className="header-icon"><Users size={18} /></div>
            <h1>Candidates</h1>
          </div>
          <p>View and manage screened candidates</p>
        </div>
        <div className="candidate-count">{totalCount} Candidates</div>
      </div>

      <div className="search-container">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search candidates..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: '2rem' }}>
          <Loader2 className="animate-spin" size={20} />
          <span style={{ marginLeft: '0.5rem' }}>Searching...</span>
        </div>
      ) : error ? (
        <p style={{ color: '#ef4444', padding: '1rem' }}>{error}</p>
      ) : (

        <div className="candidate-list">
          {candidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              className="candidate-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <div className="candidate-header-row">
                <div className="candidate-info">
                  <div
                    className="candidate-avatar"
                    style={{
                      backgroundColor: getAvatarColor(candidate.candidate_name),
                    }}
                  >
                    {candidate.candidate_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <h3>{candidate.candidate_name}</h3>
                </div>

                <div className="candidate-actions-top">
                  <div className="candidate-score">{candidate.overall_score}%</div>
                  <button
                    className="delete-btn"
                    onClick={() => {
                      setCandidateToDelete(candidate.id);
                      setShowDeleteModal(true);
                    }}
                    title="Delete candidate"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="candidate-meta-row">
                <p className="candidate-role">{candidate.job_description?.job_title || 'No title specified'}</p>
                <p className="candidate-screened">Screened: {formatDate(candidate.created_at)}</p>
              </div>
              <div className="verdict-report">
                <div className="candidate-verdict">
                  <span className={`candidate-status ${getStatusClass(candidate.verdict)}`}>
                    {formatVerdict(candidate.verdict)}
                  </span>
                </div>

                <button className="view-report-btn" onClick={() => navigate(`/candidate/${candidate.id}`)}>
                  View Report
                </button></div>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={page === currentPage ? 'active-page' : ''}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Are you sure you want to delete this candidate?</h3>

            <p>
              This action cannot be undone. The candidate report will be permanently
              removed.
            </p>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCandidateToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                className="confirm-delete-btn"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}