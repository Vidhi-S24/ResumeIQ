export const mockCandidates = Array.from({ length: 20 }, (_, i) => ({
  id: `mock-${i + 1}`,
  candidate_name: [
    'John Doe',
    'Jane Smith',
    'Michael Brown',
    'Sarah Wilson',
    'David Lee',
    'Emily Davis',
    'Chris Taylor',
    'Olivia Martin',
    'James Anderson',
    'Sophia Clark',
    'Daniel Thomas',
    'Emma White',
    'Ryan Harris',
    'Ava Lewis',
    'Noah Walker',
    'Mia Hall',
    'Ethan Young',
    'Charlotte King',
    'Liam Scott',
    'Amelia Green',
  ][i],
  job_description: {
    job_title: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Engineer',
      'React Developer',
      'Node.js Developer',
      'DevOps Engineer',
      'QA Engineer',
      'UI/UX Designer',
      'Data Analyst',
      'Product Manager',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Engineer',
      'React Developer',
      'Node.js Developer',
      'DevOps Engineer',
      'QA Engineer',
      'UI/UX Designer',
      'Data Analyst',
      'Product Manager',
    ][i],
  },
  verdict:
    i % 3 === 0
      ? 'QUALIFIED'
      : i % 3 === 1
      ? 'PARTIALLY_QUALIFIED'
      : 'NOT_QUALIFIED',
  overall_score: Math.floor(Math.random() * 40) + 60,
  created_at: new Date(
    Date.now() - i * 86400000
  ).toISOString(),
}));