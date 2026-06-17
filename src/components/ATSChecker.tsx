import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store/useStore';
import { checkATS } from '../services/gemini';
import { extractTextFromPDF, extractTextFromTxt } from '../services/pdfParser';
import { generateATSReportPDF } from '../services/pdfGenerator';
import {
  ScanSearch,
  Loader2,
  CheckCircle2,
  XCircle,
  Target,
  Sparkles,
  TrendingUp,
  Upload,
  File,
  X,
  Download,
} from 'lucide-react';

function ScoreRing({ score, size = 120, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

export default function ATSChecker() {
  const { profile, selectedJob, atsResult, setAtsResult, setProfile } = useStore();
  const [jobDescription, setJobDescription] = useState(
    selectedJob
      ? `${selectedJob.title} at ${selectedJob.company}\n\n${selectedJob.description}\n\nRequirements:\n${selectedJob.requirements.map((r) => `• ${r}`).join('\n')}`
      : ''
  );
  const [cvText, setCvText] = useState(profile.rawCvText || '');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadedFileName(file.name);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await extractTextFromTxt(file);
      }

      if (text.trim()) {
        setCvText(text);
        setProfile({ rawCvText: text });
      } else {
        alert('Could not extract text from the file.');
        setUploadedFileName('');
      }
    } catch (error: any) {
      alert('Error reading file: ' + error.message);
      setUploadedFileName('');
    } finally {
      setUploading(false);
    }
  }, [setProfile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const clearUpload = () => {
    setCvText('');
    setUploadedFileName('');
  };

  const loadFromProfile = () => {
    if (profile.rawCvText) {
      setCvText(profile.rawCvText);
      setUploadedFileName('From Profile');
    } else {
      let cv = `${profile.name}\n${profile.title}\n${profile.email} | ${profile.phone} | ${profile.location}\n\n`;
      cv += `SUMMARY\n${profile.summary}\n\n`;
      cv += `SKILLS\n${profile.skills.join(', ')}\n\n`;
      cv += `EXPERIENCE\n`;
      profile.experience.forEach((exp) => {
        cv += `${exp.role} at ${exp.company} (${exp.duration})\n${exp.description}\n\n`;
      });
      cv += `EDUCATION\n`;
      profile.education.forEach((edu) => {
        cv += `${edu.degree} - ${edu.institution} (${edu.year})\n`;
      });
      setCvText(cv);
      setUploadedFileName('From Profile');
    }
  };

  const handleCheck = async () => {
    if (!cvText.trim()) {
      alert('Please provide your resume text!');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Please provide a job description!');
      return;
    }

    setChecking(true);
    setAtsResult(null);

    try {
      const result = await checkATS(cvText, jobDescription);
      setAtsResult(result);
    } catch (error: any) {
      alert('Error checking ATS: ' + error.message);
    } finally {
      setChecking(false);
    }
  };

  const downloadReport = () => {
    if (!atsResult) return;
    const jobTitle = selectedJob?.title || 'Job Position';
    generateATSReportPDF(atsResult, jobTitle, `ats_report_${Date.now()}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <ScanSearch size={24} />
          <div>
            <h3 className="text-lg font-bold">ATS Compatibility Checker</h3>
            <p className="text-white/80 text-sm">
              Upload your CV and check how well it passes Applicant Tracking Systems
            </p>
          </div>
        </div>
      </div>

      {!atsResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CV Upload Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Upload size={18} className="text-violet-600" />
                Your CV / Resume
              </h4>
              {(profile.rawCvText || profile.summary) && (
                <button
                  onClick={loadFromProfile}
                  className="text-xs px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-all font-medium"
                >
                  Load from Profile
                </button>
              )}
            </div>

            {!cvText ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
                }`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="text-amber-600 animate-spin" />
                    <p className="text-sm text-gray-600">Reading file...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Upload size={24} className="text-amber-600" />
                    </div>
                    <p className="font-medium text-gray-700">
                      {isDragActive ? 'Drop your CV here' : 'Drop CV or click to upload'}
                    </p>
                    <p className="text-xs text-gray-500">PDF or TXT files supported</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <File size={18} className="text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 flex-1">
                    {uploadedFileName || 'CV Loaded'}
                  </span>
                  <button
                    onClick={clearUpload}
                    className="p-1 hover:bg-emerald-100 rounded-lg transition-all"
                  >
                    <X size={16} className="text-emerald-600" />
                  </button>
                </div>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-sm resize-none transition-all"
                  placeholder="Or paste your CV text here..."
                />
              </div>
            )}
          </div>

          {/* JD Input */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Target size={18} className="text-amber-600" />
              Job Description
            </h4>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-sm resize-none transition-all"
              placeholder="Paste the job description to check ATS compatibility against..."
            />
          </div>

          <div className="lg:col-span-2">
            <button
              onClick={handleCheck}
              disabled={checking || !cvText.trim() || !jobDescription.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 transition-all font-medium text-lg shadow-lg shadow-amber-200"
            >
              {checking ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing ATS Compatibility...
                </>
              ) : (
                <>
                  <ScanSearch size={20} />
                  Run ATS Check
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setAtsResult(null)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all"
            >
              Check Another
            </button>
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 font-medium shadow-lg transition-all"
            >
              <Download size={16} /> Download PDF Report
            </button>
            <button
              onClick={() => {
                useStore.getState().setCurrentPage('tailor');
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 font-medium shadow-lg shadow-violet-200 transition-all"
            >
              <Sparkles size={16} /> Tailor Resume to Fix Issues
            </button>
          </div>

          {/* Overall Score */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ScoreRing score={atsResult.overallScore} size={160} strokeWidth={14} />
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ATS Compatibility Score
                </h3>
                <p className="text-gray-500 mb-4">
                  {atsResult.overallScore >= 70
                    ? 'Good match! Your resume is well-optimized for ATS.'
                    : atsResult.overallScore >= 50
                    ? 'Fair match. Some improvements can boost your chances.'
                    : 'Needs improvement. Follow the suggestions below to increase your score.'}
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="px-4 py-2 rounded-xl bg-violet-50 border border-violet-200">
                    <p className="text-xs text-gray-500">Keywords</p>
                    <p className="text-lg font-bold text-violet-600">{atsResult.keywordMatch}%</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-xs text-gray-500">Formatting</p>
                    <p className="text-lg font-bold text-blue-600">{atsResult.formattingScore}%</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-xs text-gray-500">Sections</p>
                    <p className="text-lg font-bold text-emerald-600">{atsResult.sectionScore}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {atsResult.detailedFeedback.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-sm">{item.category}</h4>
                  <span
                    className={`text-lg font-bold ${
                      item.score >= 70 ? 'text-emerald-600' :
                      item.score >= 50 ? 'text-amber-600' :
                      'text-red-600'
                    }`}
                  >
                    {item.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      item.score >= 70 ? 'bg-emerald-500' :
                      item.score >= 50 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.feedback}</p>
              </div>
            ))}
          </div>

          {/* Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                Matched Keywords ({atsResult.matchedKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {atsResult.matchedKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <XCircle size={18} className="text-red-500" />
                Missing Keywords ({atsResult.missingKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {atsResult.missingKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-violet-600" />
              Improvement Suggestions
            </h4>
            <div className="space-y-3">
              {atsResult.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                  <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
