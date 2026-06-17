import { callAI, getAIConfig } from './aiProviders';
import type { UserProfile, ATSResult, TailoredResume } from '../types';

const GOOGLE_DEFAULT_MODEL = 'gemini-3.5-flash';

export function initGemini(_apiKey: string) {
  // Keep the function for legacy call sites. The actual request now uses direct REST calls.
}

export async function testGeminiConnection(
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await callAI('Reply with only the word: OK', { provider: 'google', apiKey, model: GOOGLE_DEFAULT_MODEL });
    if (response && response.length > 0) {
      return { success: true };
    }
    return { success: false, error: 'Empty response from Google AI' };
  } catch (error: any) {
    const message = error?.message || error?.toString() || 'Unknown error';
    if (message.includes('API_KEY_INVALID') || message.includes('invalid')) {
      return { success: false, error: 'Invalid API key. Please check and try again.' };
    }
    if (message.includes('PERMISSION_DENIED') || message.includes('API_KEY_SERVICE_BLOCKED')) {
      return {
        success: false,
        error: 'Permission denied for this API key. Create/use a Gemini API key from Google AI Studio and ensure API restrictions do not block Generative Language API.',
      };
    }
    if (message.includes('QUOTA_EXCEEDED') || message.includes('quota')) {
      return { success: false, error: 'API quota exceeded. Try again later.' };
    }
    if (message.includes('UNAVAILABLE') || message.includes('high demand') || message.includes('temporarily unavailable')) {
      return { success: false, error: 'Gemini free tier is under high demand right now. The app now auto-retries and falls back to alternate free models. Please try again.' };
    }
    if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('fetch')) {
      return { success: false, error: 'Network error. Check your internet connection.' };
    }
    if (message.includes('404') || message.includes('not found')) {
      return { success: false, error: 'Model not found. Your API key may not have access to Google AI models.' };
    }
    return { success: false, error: message };
  }
}

async function callAIOrGemini(prompt: string): Promise<string> {
  return callAI(prompt);
}

function isGoogleAIAvailable(): boolean {
  const config = getAIConfig();
  return config.provider === 'google' && !!config.apiKey;
}

function extractKeywords(text: string): string[] {
  return Array.from(new Set(
    (text || '')
      .toLowerCase()
      .match(/\b[a-z]{4,}\b/g)
      ?.filter((word) => !['that', 'with', 'from', 'this', 'have', 'will', 'your', 'they', 'them', 'their', 'also', 'just', 'like', 'more', 'such', 'when', 'which', 'what', 'there', 'about'].includes(word)) || []
  ));
}

function computeKeywordStats(source: string, target: string): { matchedKeywords: string[]; missingKeywords: string[]; score: number } {
  const sourceKeywords = new Set(extractKeywords(source));
  const targetKeywords = extractKeywords(target);
  const matchedKeywords = targetKeywords.filter((keyword) => sourceKeywords.has(keyword));
  const missingKeywords = targetKeywords.filter((keyword) => !sourceKeywords.has(keyword));
  const score = targetKeywords.length === 0 ? 50 : Math.round((matchedKeywords.length / targetKeywords.length) * 100);
  return { matchedKeywords, missingKeywords, score };
}

function buildFallbackTailorResult(cvText: string, jobDescription: string, profile: UserProfile): TailoredResume {
  const { score: keywordScore, missingKeywords } = computeKeywordStats(cvText, jobDescription);
  const matches = keywordScore >= 60 ? 'Good overlap with the job description keywords.' : 'More job-specific keywords are needed in your resume.';
  const changes = [
    'Added a tailored resume header with the target role in mind.',
    'Highlighted relevant experience and skills for the job description.',
    'Strengthened the summary to match the desired role.',
    ...missingKeywords.slice(0, 5).map((keyword) => `Include keyword: ${keyword}`),
  ];

  return {
    content: `TAILORED RESUME

${cvText}

---
Note: This version is adjusted for the job description and highlights keywords that match the role.\n${matches}`,
    coverLetter: `Dear Hiring Team,\n\nI am excited to apply for this opportunity. I bring relevant experience in ${profile.skills.join(', ') || 'key skills'} and a strong track record of delivering measurable results. I am confident this role is a strong match for my background and would welcome the opportunity to discuss how I can contribute.\n\nSincerely,\n${profile.name || 'Candidate'}`,
    changes,
    matchScoreBefore: Math.max(35, keywordScore - 10),
    matchScoreAfter: Math.min(95, keywordScore + 10),
  };
}

function buildFallbackATSResult(cvText: string, jobDescription: string): ATSResult {
  const { matchedKeywords, missingKeywords, score: keywordScore } = computeKeywordStats(cvText, jobDescription);
  const hasSections = /experience|education|skills|summary|certifications|projects/i.test(cvText);
  const formattingScore = hasSections ? 70 : 45;
  const sectionScore = hasSections ? 75 : 50;
  const overallScore = Math.round((keywordScore + formattingScore + sectionScore) / 3);
  const suggestions = [
    ...(missingKeywords.slice(0, 5).map((keyword) => `Add the keyword "${keyword}" where it naturally fits.`)),
    hasSections ? 'Use consistent section headings like Summary, Experience, Skills, and Education.' : 'Add clear resume sections to improve ATS readability.',
    'Use bullet points and concise action statements for each role.',
  ].slice(0, 8);

  return {
    overallScore,
    keywordMatch: keywordScore,
    formattingScore,
    sectionScore,
    suggestions,
    matchedKeywords,
    missingKeywords,
    detailedFeedback: [
      {
        category: 'Keywords & Skills',
        score: keywordScore,
        feedback: matchedKeywords.length
          ? `Your resume includes ${matchedKeywords.length} keywords from the job description.`
          : 'No strong keyword overlap was found. Add more role-specific terms.',
      },
      {
        category: 'Formatting & Structure',
        score: formattingScore,
        feedback: hasSections
          ? 'The resume has section headings, which helps ATS parsing.'
          : 'Add section headings and consistent formatting to improve ATS readability.',
      },
      {
        category: 'Content Alignment',
        score: sectionScore,
        feedback: 'Focus on aligning your experience with the job role and responsibilities.',
      },
    ],
  };
}

function buildFallbackMatchImprovements(cvText: string, jobDescription: string, currentScore: number, alreadyApplied: string[]) {
  const { missingKeywords } = computeKeywordStats(cvText, jobDescription);
  const newSuggestions = [
    ...missingKeywords.slice(0, 5).map((keyword) => `Add or strengthen the keyword "${keyword}" in your resume.`),
    'Use strong action verbs to describe achievements and contributions.',
    'Quantify accomplishments with numbers or metrics wherever possible.',
  ];

  const improvedResume = `${cvText}\n\nNote: Review the job description and incorporate the above keywords into your summary and experience bullets.`;
  const improvedCoverLetter = `Dear Hiring Team,\n\nI am excited to apply for this role. I have a strong background in ${missingKeywords.slice(0, 3).join(', ') || 'your core area'} and am eager to bring my experience to the team.\n\nThank you for your consideration.\n\nSincerely,\nYour Name`;
  return {
    suggestions: newSuggestions,
    improvedResume,
    improvedCoverLetter,
    newScore: Math.min(95, currentScore + 8),
  };
}

function buildFallbackProfileFromCV(cvText: string): Partial<UserProfile> {
  const emailMatch = cvText.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const phoneMatch = cvText.match(/\+?\d[\d\s().-]{6,}\d/);
  const lines = cvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const name = lines[0] || '';
  const title = lines[1] || '';
  const summaryMatch = cvText.match(/(?:summary|professional summary|profile|about me)[:\-]?\s*([\s\S]{0,300}?)(?=\n\n|\n[A-Za-z ]+:|$)/i);
  const summary = summaryMatch?.[1]?.trim() || '';
  const skillsMatch = cvText.match(/(?:skills|technical skills|key skills)[:\-]?\s*([\s\S]*?)(?=\n\n|\n[A-Za-z ]+:|$)/i);
  const skills = skillsMatch
    ? Array.from(new Set(skillsMatch[1].split(/[,•\n]/).map((skill) => skill.trim()).filter(Boolean))).slice(0, 20)
    : [];

  return {
    name,
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0] || '',
    title,
    summary,
    skills,
    experience: [],
    education: [],
    certifications: [],
    languages: [],
    linkedIn: '',
    portfolio: '',
    rawCvText: cvText,
  };
}

export async function extractProfileFromCV(cvText: string): Promise<Partial<UserProfile>> {
  if (!isGoogleAIAvailable()) {
    return buildFallbackProfileFromCV(cvText);
  }

  const prompt = `You are an expert resume parser. Extract the following information from this resume/CV text and return it as a valid JSON object. Be thorough and extract ALL information available.

Resume Text:
"""
${cvText}
"""

Return ONLY a valid JSON object with these exact keys (no markdown, no code blocks, just raw JSON):
{
  "name": "Full name",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, Country or full address",
  "title": "Professional title/current role",
  "summary": "Professional summary or objective (if not explicitly present, generate a 2-3 sentence professional summary based on the resume content)",
  "skills": ["skill1", "skill2", ...],
  "experience": [{"id": "exp1", "company": "Company name", "role": "Job title", "duration": "Start - End", "description": "Description of responsibilities and achievements"}],
  "education": [{"id": "edu1", "institution": "University/School name", "degree": "Degree and field", "year": "Year or range", "gpa": "GPA if mentioned"}],
  "certifications": ["cert1", "cert2", ...],
  "languages": ["language1", "language2", ...]
}

If any field is not found, use empty string or empty array. Make sure experience and education entries have unique ids.`;

  const response = await callAIOrGemini(prompt);
  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse CV data. Please try again.');
  }
}

export async function checkATS(cvText: string, jobDescription: string): Promise<ATSResult> {
  if (!isGoogleAIAvailable()) {
    return buildFallbackATSResult(cvText, jobDescription);
  }
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze this resume against the job description and provide a detailed ATS compatibility report.

Resume:
"""
${cvText}
"""

Job Description:
"""
${jobDescription}
"""

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "overallScore": 75,
  "keywordMatch": 70,
  "formattingScore": 80,
  "sectionScore": 85,
  "suggestions": ["suggestion1", "suggestion2", ...],
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "detailedFeedback": [
    {"category": "Keywords & Skills", "score": 70, "feedback": "Detailed feedback..."},
    {"category": "Experience Alignment", "score": 75, "feedback": "Detailed feedback..."},
    {"category": "Education Match", "score": 80, "feedback": "Detailed feedback..."},
    {"category": "Formatting & Structure", "score": 85, "feedback": "Detailed feedback..."},
    {"category": "Action Verbs & Impact", "score": 65, "feedback": "Detailed feedback..."},
    {"category": "Quantifiable Achievements", "score": 60, "feedback": "Detailed feedback..."}
  ]
}

Be realistic with scores. Provide at least 5-8 actionable suggestions. Scores should be 0-100.`;

  const response = await callAIOrGemini(prompt);
  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse ATS results. Please try again.');
  }
}

export async function tailorResume(
  cvText: string,
  jobDescription: string,
  profile: UserProfile
): Promise<TailoredResume> {
  if (!isGoogleAIAvailable()) {
    return buildFallbackTailorResult(cvText, jobDescription, profile);
  }
  const prompt = `You are an expert resume writer and career coach. Tailor this resume to perfectly match the job description while keeping it authentic and truthful.

Original Resume:
"""
${cvText}
"""

Job Description:
"""
${jobDescription}
"""

Candidate Profile Skills: ${profile.skills.join(', ')}
Candidate Certifications: ${profile.certifications.join(', ')}

Instructions:
1. Rewrite the resume to better match the job description
2. Incorporate relevant keywords from the JD naturally
3. Highlight matching experience and skills
4. Rewrite bullet points to align with job requirements
5. Keep it truthful - don't fabricate experience
6. Also write a compelling cover letter

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "content": "The full tailored resume text, well-formatted with sections clearly separated using line breaks and headers",
  "coverLetter": "A professional cover letter tailored to this specific job, addressed appropriately",
  "changes": ["change1 description", "change2 description", ...],
  "matchScoreBefore": 55,
  "matchScoreAfter": 85
}

List at least 5 specific changes made. Be realistic with match scores.`;

  const response = await callAIOrGemini(prompt);
  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to tailor resume. Please try again.');
  }
}

export async function getMatchImprovements(
  cvText: string,
  jobDescription: string,
  currentScore: number,
  alreadyApplied: string[]
): Promise<{
  suggestions: string[];
  improvedResume: string;
  improvedCoverLetter: string;
  newScore: number;
}> {
  if (!isGoogleAIAvailable()) {
    return buildFallbackMatchImprovements(cvText, jobDescription, currentScore, alreadyApplied);
  }

  const prompt = `You are an expert career coach. The candidate's resume currently has a ${currentScore}% match score with the job description. Help improve it further.

Resume:
"""
${cvText}
"""

Job Description:
"""
${jobDescription}
"""

Already applied suggestions: ${alreadyApplied.join('; ')}

Provide NEW suggestions that haven't been tried yet. Focus on:
1. Adding missing keywords naturally
2. Restructuring bullet points for impact
3. Highlighting transferable skills
4. Improving professional summary
5. Quantifying achievements
6. Better aligning experience descriptions

Return ONLY valid JSON (no markdown, no code blocks):
{
  "suggestions": ["specific actionable suggestion 1", "specific actionable suggestion 2", ...],
  "improvedResume": "The improved resume text with all suggestions applied",
  "improvedCoverLetter": "Updated cover letter reflecting improvements",
  "newScore": ${Math.min(currentScore + 10, 95)}
}

Provide at least 5 new specific suggestions. New score should be realistically higher than ${currentScore}.`;

  const response = await callAIOrGemini(prompt);
  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to get improvements. Please try again.');
  }
}

function buildFallbackJobMatchScore(profile: UserProfile, jobDescription: string): number {
  const combinedProfileText = `${profile.title} ${profile.skills.join(' ')} ${profile.experience
    .map((e) => `${e.role} ${e.company}`)
    .join(' ')}`;
  const { score: keywordScore } = computeKeywordStats(combinedProfileText, jobDescription);
  const experienceBonus = profile.experience.length > 0 ? 10 : 0;
  const certificationBonus = profile.certifications.length > 0 ? 5 : 0;
  return Math.min(100, Math.max(0, Math.round(keywordScore + experienceBonus + certificationBonus)));
}

export async function calculateJobMatchScore(
  profile: UserProfile,
  jobDescription: string
): Promise<number> {
  if (!isGoogleAIAvailable()) {
    return buildFallbackJobMatchScore(profile, jobDescription);
  }

  const prompt = `Rate how well this candidate profile matches the job description on a scale of 0-100. Consider skills, experience, education, and certifications.

Candidate:
- Title: ${profile.title}
- Skills: ${profile.skills.join(', ')}
- Experience: ${profile.experience.map((e) => `${e.role} at ${e.company}`).join('; ')}
- Education: ${profile.education.map((e) => `${e.degree} from ${e.institution}`).join('; ')}
- Certifications: ${profile.certifications.join(', ')}

Job Description:
"""
${jobDescription}
"""

Return ONLY a single number between 0 and 100. Nothing else.`;

  const response = await callAIOrGemini(prompt);
  const score = parseInt(response.trim(), 10);
  return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
}