// File Parsing Service

// Set worker source for PDF.js
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

const FileParser = {
  extractText: async (file) => {
    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'pdf') {
      return await FileParser.parsePDF(file);
    } else if (fileType === 'docx') {
      return await FileParser.parseDOCX(file);
    } else if (fileType === 'txt') {
      return await FileParser.parseTXT(file);
    } else {
      throw new Error("Unsupported file type: " + fileType);
    }
  },

  parsePDF: async (file) => {
    // PDF.js integration
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  },

  parseDOCX: async (file) => {
    // Mammoth integration
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  },

  parseTXT: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
};

window.FileParser = FileParser;
