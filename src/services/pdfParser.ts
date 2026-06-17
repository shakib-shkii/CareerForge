// Import pdfjs locally to avoid external worker fetch latency
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pagePromises = Array.from({ length: pdf.numPages }, (_value, index) =>
    pdf.getPage(index + 1).then(async (page) => {
      const textContent = await page.getTextContent();
      return textContent.items.map((item: any) => item.str).join(' ');
    })
  );

  const pages = await Promise.all(pagePromises);
  return pages.filter(Boolean).join('\n').trim();
}

export function extractTextFromTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
