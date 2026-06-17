import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store/useStore';
import { tailorResume } from '../services/gemini';
import { extractTextFromPDF, extractTextFromTxt } from '../services/pdfParser';
import { generateResumePDF, generateCoverLetterPDF } from '../services/pdfGenerator';
import {
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  Copy,
  Download,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Upload,
  File,
  X,
} from 'lucide-react';
import type { TailoredResume } from '../types';

export default function TailorResume() {
  const { profile, selectedJob, setProfile } = useStore();
  const [jobDescription, setJobDescription] = useState(
    selectedJob
      ? `${selectedJob.title} at ${selectedJob.company}\n\n${selectedJob.description}\n\nRequirements:\n${selectedJob.requirements.map((r) => `• ${r}`).join('\n')}`
      : ''
  );
  const [cvText, setCvText] = useState(profile.rawCvText || '');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [result, setResult] = useState<TailoredResume | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'cover'>('resume');
  const [showChanges, setShowChanges] = useState(false);
  const [copied, setCopied] = useState(false);
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
        // Also update profile's rawCvText
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
      // Build from profile data
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
      if (profile.certifications.length > 0) {
        cv += `\nCERTIFICATIONS\n${profile.certifications.join('\n')}\n`;
      }
      setCvText(cv);
      setUploadedFileName('From Profile');
    }
  };

  const handleTailor = async () => {
    if (!cvText.trim()) {
      alert('Please upload or paste your CV!');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Please paste a job description!');
      return;
    }

    setTailoring(true);
    setResult(null);

    try {
      const tailored = await tailorResume(cvText, jobDescription, profile);
      setResult(tailored);
    } catch (error: any) {
      alert('Error tailoring resume: ' + error.message);
    } finally {
      setTailoring(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = (type: 'resume' | 'cover') => {
    if (!result) return;
    const company = selectedJob?.company || 'Company';
    if (type === 'resume') {
      generateResumePDF(result.content, profile, `tailored_resume_${company.replace(/\s+/g, '_')}.pdf`);
    } else {
      generateCoverLetterPDF(result.coverLetter, profile, company, `cover_letter_${company.replace(/\s+/g, '_')}.pdf`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="text-lg font-bold">AI Resume & Cover Letter Tailor</h3>
            <p className="text-white/80 text-sm">
              Upload your CV and job description to get a perfectly tailored resume and cover letter
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
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
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50/50'
                }`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="text-violet-600 animate-spin" />
                    <p className="text-sm text-gray-600">Reading file...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Upload size={24} className="text-violet-600" />
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
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm resize-none transition-all"
                  placeholder="Or paste your CV text here..."
                />
              </div>
            )}
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Job Description
            </h4>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm resize-none transition-all"
              placeholder="Paste the full job description here including requirements, responsibilities, and qualifications..."
            />

            <button
              onClick={handleTailor}
              disabled={tailoring || !cvText.trim() || !jobDescription.trim()}
              className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all font-medium shadow-lg shadow-violet-200"
            >
              {tailoring ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Tailoring with AI...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Tailor Resume & Generate Cover Letter
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Score Comparison */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h4 className="font-bold text-gray-900 mb-4">Match Score Improvement</h4>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-red-600">{result.matchScoreBefore}%</span>
                    </div>
                    <p className="text-xs text-gray-500">Before</p>
                  </div>
                  <ArrowRight size={24} className="text-gray-400" />
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-emerald-600">{result.matchScoreAfter}%</span>
                    </div>
                    <p className="text-xs text-gray-500">After</p>
                  </div>
                </div>

                {/* Changes */}
                <button
                  onClick={() => setShowChanges(!showChanges)}
                  className="w-full mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-sm"
                >
                  <span className="font-medium text-gray-700">
                    {result.changes.length} Changes Made
                  </span>
                  {showChanges ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showChanges && (
                  <div className="mt-3 space-y-2">
                    {result.changes.map((change, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-gray-600">{change}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('resume')}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                      activeTab === 'resume'
                        ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Tailored Resume
                  </button>
                  <button
                    onClick={() => setActiveTab('cover')}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                      activeTab === 'cover'
                        ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Cover Letter
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() =>
                        copyToClipboard(activeTab === 'resume' ? result.content : result.coverLetter)
                      }
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all"
                    >
                      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() =>
                        downloadAsText(
                          activeTab === 'resume' ? result.content : result.coverLetter,
                          activeTab === 'resume' ? 'tailored_resume.txt' : 'cover_letter.txt'
                        )
                      }
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all"
                    >
                      <Download size={14} /> TXT
                    </button>
                    <button
                      onClick={() => downloadAsPDF(activeTab)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 text-sm font-medium shadow-lg transition-all"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {activeTab === 'resume' ? result.content : result.coverLetter}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={36} className="text-violet-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Ready to Tailor</h4>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Upload your CV and paste a job description to get a tailored resume and cover letter
                powered by Google AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
