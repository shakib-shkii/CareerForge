import { jsPDF } from 'jspdf';
import type { UserProfile } from '../types';

export function generateResumePDF(content: string, profile: UserProfile, filename: string = 'tailored_resume.pdf'): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Helper to add text with word wrap
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.5;

    for (const line of lines) {
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    }
  };

  // Header with name
  if (profile.name) {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(profile.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // Contact info
  if (profile.email || profile.phone || profile.location) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    const contactParts = [profile.email, profile.phone, profile.location].filter(Boolean);
    doc.text(contactParts.join(' • '), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }

  // LinkedIn & Portfolio
  if (profile.linkedIn || profile.portfolio) {
    doc.setFontSize(9);
    doc.setTextColor(124, 58, 237);
    const links = [profile.linkedIn, profile.portfolio].filter(Boolean);
    doc.text(links.join(' | '), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Parse and add content sections
  const sections = content.split(/\n(?=[A-Z]{2,})/);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim();

    // Check if it's a section header (all caps or mostly caps)
    if (firstLine === firstLine.toUpperCase() && firstLine.length > 2 && firstLine.length < 50) {
      yPosition += 5;
      addText(firstLine, 12, true, [124, 58, 237]);
      yPosition += 2;

      // Add underline
      doc.setDrawColor(124, 58, 237);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, margin + 40, yPosition);
      yPosition += 5;

      // Add remaining content
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          if (line.startsWith('•') || line.startsWith('-')) {
            addText(line, 10, false);
          } else if (line.includes(' at ') || line.includes(' - ')) {
            addText(line, 11, true);
          } else {
            addText(line, 10, false);
          }
          yPosition += 1;
        }
      }
    } else {
      // Regular content
      for (const line of lines) {
        if (line.trim()) {
          addText(line.trim(), 10, false);
          yPosition += 1;
        }
      }
    }
  }

  // Save
  doc.save(filename);
}

export function generateCoverLetterPDF(content: string, profile: UserProfile, _company: string, filename: string = 'cover_letter.pdf'): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const maxWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Header with sender info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  
  if (profile.name) {
    doc.text(profile.name, margin, yPosition);
    yPosition += 5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);

  if (profile.email) {
    doc.text(profile.email, margin, yPosition);
    yPosition += 4;
  }
  if (profile.phone) {
    doc.text(profile.phone, margin, yPosition);
    yPosition += 4;
  }
  if (profile.location) {
    doc.text(profile.location, margin, yPosition);
    yPosition += 4;
  }

  yPosition += 8;

  // Date
  doc.setTextColor(55, 65, 81);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin, yPosition);
  yPosition += 15;

  // Body
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);

  const paragraphs = content.split('\n\n');

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    const lines = doc.splitTextToSize(trimmed, maxWidth);
    const lineHeight = 5.5;

    for (const line of lines) {
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    }
    yPosition += 4;
  }

  // Save
  doc.save(filename);
}

export function generateATSReportPDF(
  result: {
    overallScore: number;
    keywordMatch: number;
    formattingScore: number;
    sectionScore: number;
    suggestions: string[];
    matchedKeywords: string[];
    missingKeywords: string[];
  },
  jobTitle: string,
  filename: string = 'ats_report.pdf'
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(124, 58, 237);
  doc.text('ATS Compatibility Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`For: ${jobTitle}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Overall Score Box
  const boxWidth = 60;
  const boxHeight = 40;
  const boxX = (pageWidth - boxWidth) / 2;

  doc.setFillColor(result.overallScore >= 70 ? 16 : result.overallScore >= 50 ? 245 : 239,
                   result.overallScore >= 70 ? 185 : result.overallScore >= 50 ? 158 : 68,
                   result.overallScore >= 70 ? 129 : result.overallScore >= 50 ? 11 : 68);
  doc.roundedRect(boxX, yPosition, boxWidth, boxHeight, 5, 5, 'F');

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${result.overallScore}%`, pageWidth / 2, yPosition + 22, { align: 'center' });
  doc.setFontSize(10);
  doc.text('OVERALL SCORE', pageWidth / 2, yPosition + 32, { align: 'center' });
  yPosition += boxHeight + 15;

  // Score breakdown
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Score Breakdown', margin, yPosition);
  yPosition += 10;

  const scores = [
    { label: 'Keyword Match', score: result.keywordMatch },
    { label: 'Formatting', score: result.formattingScore },
    { label: 'Sections', score: result.sectionScore },
  ];

  doc.setFontSize(11);
  for (const { label, score } of scores) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(label, margin, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(score >= 70 ? 16 : score >= 50 ? 245 : 239,
                     score >= 70 ? 185 : score >= 50 ? 158 : 68,
                     score >= 70 ? 129 : score >= 50 ? 11 : 68);
    doc.text(`${score}%`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 7;
  }

  yPosition += 10;

  // Keywords
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Keywords Analysis', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(`✓ Matched (${result.matchedKeywords.length}): ${result.matchedKeywords.slice(0, 10).join(', ')}${result.matchedKeywords.length > 10 ? '...' : ''}`, margin, yPosition);
  yPosition += 6;

  doc.setTextColor(239, 68, 68);
  doc.text(`✗ Missing (${result.missingKeywords.length}): ${result.missingKeywords.slice(0, 10).join(', ')}${result.missingKeywords.length > 10 ? '...' : ''}`, margin, yPosition);
  yPosition += 15;

  // Suggestions
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Improvement Suggestions', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  for (let i = 0; i < Math.min(result.suggestions.length, 8); i++) {
    const lines = doc.splitTextToSize(`${i + 1}. ${result.suggestions[i]}`, pageWidth - margin * 2);
    for (const line of lines) {
      doc.text(line, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 2;
  }

  doc.save(filename);
}
