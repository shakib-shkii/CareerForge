import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store/useStore';
import { extractTextFromPDF, extractTextFromTxt } from '../services/pdfParser';
import { extractProfileFromCV } from '../services/gemini';
import {
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Globe,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  Edit3,
  Save,
  Trash2,
} from 'lucide-react';

export default function Profile() {
  const { profile, setProfile, setCvUploaded, saveProfileToDB } = useStore();
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState('');
  const [parseSuccess, setParseSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newLang, setNewLang] = useState('');
  const [saving, setSaving] = useState(false);

  // Save profile to DB when editMode is turned off
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await saveProfileToDB();
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setParsing(true);
      setParseSuccess(false);
      setParseMessage('Extracting resume text...');

      try {
        let text = '';
        const lowerName = file.name.toLowerCase();
        const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
        const isTxt = file.type === 'text/plain' || lowerName.endsWith('.txt');

        if (isPdf) {
          text = await extractTextFromPDF(file);
        } else if (isTxt) {
          text = await extractTextFromTxt(file);
        } else {
          alert('Only PDF and TXT resumes are supported right now. Please upload a PDF or TXT file.');
          setParseMessage('');
          setParsing(false);
          return;
        }

        if (!text.trim()) {
          alert('Could not extract text from the file. Please try a different resume or text file.');
          setParseMessage('');
          setParsing(false);
          return;
        }

        setParseMessage('Analyzing resume content...');
        const extracted = await extractProfileFromCV(text);
        setProfile({ ...extracted, rawCvText: text });
        setCvUploaded(true);
        
        setParseMessage('Saving extracted profile...');
        await saveProfileToDB();
        
        setParseSuccess(true);
        setTimeout(() => setParseSuccess(false), 3000);
      } catch (error: any) {
        alert('Error parsing CV: ' + (error.message || 'Unknown error'));
      } finally {
        setParsing(false);
      }
    },
    [setProfile, setCvUploaded, saveProfileToDB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: parsing,
  });

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ skills: profile.skills.filter((s) => s !== skill) });
  };

  const addCert = () => {
    if (newCert.trim() && !profile.certifications.includes(newCert.trim())) {
      setProfile({ certifications: [...profile.certifications, newCert.trim()] });
      setNewCert('');
    }
  };

  const removeCert = (cert: string) => {
    setProfile({ certifications: profile.certifications.filter((c) => c !== cert) });
  };

  const addLang = () => {
    if (newLang.trim() && !profile.languages.includes(newLang.trim())) {
      setProfile({ languages: [...profile.languages, newLang.trim()] });
      setNewLang('');
    }
  };

  const removeLang = (lang: string) => {
    setProfile({ languages: profile.languages.filter((l) => l !== lang) });
  };

  const removeExperience = (id: string) => {
    setProfile({ experience: profile.experience.filter((e) => e.id !== id) });
  };

  const removeEducation = (id: string) => {
    setProfile({ education: profile.education.filter((e) => e.id !== id) });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* CV Upload */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Sparkles size={24} />
            <div>
              <h3 className="text-lg font-bold">AI-Powered CV Upload</h3>
              <p className="text-white/80 text-sm">
                Upload your resume and AI will automatically extract and fill your profile
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-violet-500 bg-violet-50'
                : parsing
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50/50'
            }`}
          >
            <input {...getInputProps()} />
            {parsing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={48} className="text-violet-600 animate-spin" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">Parsing your CV with AI...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {parseMessage || 'Extracting skills, experience, education, and more'}
                  </p>
                </div>
              </div>
            ) : parseSuccess ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <div>
                  <p className="text-lg font-semibold text-emerald-700">CV Parsed & Saved Successfully!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your profile has been auto-filled and saved. Review and edit below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <Upload size={32} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {isDragActive ? 'Drop your CV here' : 'Drop your CV or click to upload'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports PDF and TXT files • AI will auto-extract your details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User size={20} className="text-violet-600" />
            Profile Details
          </h3>
          <button
            onClick={editMode ? handleSaveProfile : () => setEditMode(true)}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              editMode
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
            }`}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : editMode ? (
              <Save size={16} />
            ) : (
              <Edit3 size={16} />
            )}
            {saving ? 'Saving...' : editMode ? 'Save Profile' : 'Edit Profile'}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <User size={14} /> Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ name: e.target.value })}
                disabled={!editMode}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-gray-50 disabled:text-gray-600 transition-all"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ email: e.target.value })}
                disabled={!editMode}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-gray-50 disabled:text-gray-600 transition-all"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Phone size={14} /> Phone
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ phone: e.target.value })}
                disabled={!editMode}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-gray-50 disabled:text-gray-600 transition-all"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <MapPin size={14} /> Location
              </label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ location: e.target.value })}
                disabled={!editMode}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-gray-50 disabled:text-gray-600 transition-all"
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Briefcase size={14} /> Professional Title
              </label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ title: e.target.value })}
                disabled={!editMode}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-gray-50 disabled:text-gray-600 transition-all"
                placeholder="Senior Software Engineer"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Globe size={14} /> LinkedIn
              </label>
              <input
                type="text"
                value={profile.linkedIn}
                onChange={(e) => setProfile({ linkedIn: e.target.value })}
                disabled={!editMode}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-gray-50 disabled:text-gray-600 transition-all"
                placeholder="linkedin.com/in/johndoe"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Globe size={14} /> Portfolio
              </label>
              <input
                type="text"
                value={profile.portfolio}
                onChange={(e) => setProfile({ portfolio: e.target.value })}
                disabled={!editMode}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-gray-50 disabled:text-gray-600 transition-all"
                placeholder="https://johndoe.dev"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FileText size={14} /> Professional Summary
            </label>
            <textarea
              value={profile.summary}
              onChange={(e) => setProfile({ summary: e.target.value })}
              disabled={!editMode}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-gray-50 disabled:text-gray-600 transition-all resize-none"
              placeholder="A brief professional summary..."
            />
          </div>

          {/* Skills */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Award size={14} /> Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 text-sm font-medium"
                >
                  {skill}
                  {editMode && (
                    <button onClick={() => removeSkill(skill)} className="hover:text-red-600 ml-1">
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
              {profile.skills.length === 0 && (
                <span className="text-sm text-gray-400">No skills added yet</span>
              )}
            </div>
            {editMode && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm"
                  placeholder="Add a skill..."
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Experience */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Briefcase size={14} /> Experience
            </label>
            <div className="space-y-4">
              {profile.experience.map((exp) => (
                <div key={exp.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 relative">
                  {editMode && (
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <h4 className="font-semibold text-gray-900">{exp.role}</h4>
                  <p className="text-sm text-violet-600 font-medium">{exp.company}</p>
                  <p className="text-xs text-gray-500 mb-2">{exp.duration}</p>
                  <p className="text-sm text-gray-600">{exp.description}</p>
                </div>
              ))}
              {profile.experience.length === 0 && (
                <p className="text-sm text-gray-400 p-4 bg-gray-50 rounded-xl text-center">
                  No experience added. Upload your CV to auto-fill.
                </p>
              )}
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <GraduationCap size={14} /> Education
            </label>
            <div className="space-y-4">
              {profile.education.map((edu) => (
                <div key={edu.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 relative">
                  {editMode && (
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                  <p className="text-sm text-violet-600 font-medium">{edu.institution}</p>
                  <p className="text-xs text-gray-500">{edu.year}</p>
                  {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
                </div>
              ))}
              {profile.education.length === 0 && (
                <p className="text-sm text-gray-400 p-4 bg-gray-50 rounded-xl text-center">
                  No education added. Upload your CV to auto-fill.
                </p>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Award size={14} /> Certifications
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.certifications.map((cert) => (
                <span
                  key={cert}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium"
                >
                  {cert}
                  {editMode && (
                    <button onClick={() => removeCert(cert)} className="hover:text-red-600 ml-1">
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
              {profile.certifications.length === 0 && (
                <span className="text-sm text-gray-400">No certifications added</span>
              )}
            </div>
            {editMode && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCert()}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm"
                  placeholder="Add a certification..."
                />
                <button
                  onClick={addCert}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Languages */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Languages size={14} /> Languages
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium"
                >
                  {lang}
                  {editMode && (
                    <button onClick={() => removeLang(lang)} className="hover:text-red-600 ml-1">
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
              {profile.languages.length === 0 && (
                <span className="text-sm text-gray-400">No languages added</span>
              )}
            </div>
            {editMode && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addLang()}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm"
                  placeholder="Add a language..."
                />
                <button
                  onClick={addLang}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
