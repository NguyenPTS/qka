// Utility functions for the app

// Hu00e0m xu1eed lu00fd URL hu00ecnh u1ea3nh 
export const getImageUrl = (url: string | undefined): string | null => {
  if (!url) {
    console.log('URL is empty');
    return null;
  }
  
  console.log('Original image URL:', url);
  try {
    // Nu1ebfu lu00e0 blob URL, bu1ecf qua khu00f4ng hiu1ec3n thu1ecb
    if (url.startsWith('blob:')) {
      console.log('URL is blob:', url);
      return null;
    }

    // Nu1ebfu URL u0111u00e3 lu00e0 URL u0111u1ea7y u0111u1ee7, tru1ea3 vu1ec1 nguyu00ean bu1ea3n
    if (url.match(/^https?:\/\//)) {
      console.log('Using original URL:', url);
      return url;
    }

    // Nu1ebfu URL bu1eaft u0111u1ea7u bu1eb1ng /wp-content, thu00eam domain
    if (url.startsWith('/wp-content')) {
      const fullUrl = `https://wordpress.pharmatech.vn${url}`;
      console.log('Converted to full URL:', fullUrl);
      return fullUrl;
    }

    // Nu1ebfu URL khu00f4ng cu00f3 schema, thu00eam domain
    const baseUrl = 'https://wordpress.pharmatech.vn';
    const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    console.log('Converted to full URL:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return null;
  }
};

// Tiu1ec7n u00edch lu1ea5y keyword du01b0u1edbi du1ea1ng mu1ea3ng
export const getKeywordsArray = (keyword: string | string[]): string[] => {
  return Array.isArray(keyword) ? keyword : keyword ? [keyword] : [];
};

// Hu00e0m su1eafp xu1ebfp cu00e2u hu1ecfi
export const sortQuestions = (a: any, b: any, sortBy: string, sortOrder: 'asc' | 'desc') => {
  if (sortBy === 'createdAt') {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
  } else if (sortBy === 'question') {
    return sortOrder === 'desc' 
      ? b.question.localeCompare(a.question)
      : a.question.localeCompare(b.question);
  } else if (sortBy === 'keyword') {
    const aKeyword = Array.isArray(a.keyword) ? a.keyword.join(',') : a.keyword || '';
    const bKeyword = Array.isArray(b.keyword) ? b.keyword.join(',') : b.keyword || '';
    return sortOrder === 'desc' 
      ? bKeyword.localeCompare(aKeyword)
      : aKeyword.localeCompare(bKeyword);
  } else if (sortBy === 'answer') {
    return sortOrder === 'desc' 
      ? b.answer.localeCompare(a.answer)
      : a.answer.localeCompare(b.answer);
  } else {
    return 0;
  }
};

// Hu00e0m lu1ecdc cu00e2u hu1ecfi theo tab
export const filterQuestionsByTab = (questions: any[], tab: string): any[] => {
  if (tab === 'pending') {
    return questions.filter(q => !q.answer || q.answer.trim() === '');
  } else if (tab === 'done') {
    return questions.filter(q => q.answer && q.answer.trim() !== '');
  }
  return questions;
};

// Kiu1ec3m tra cu00e2u hu1ecfi cu00f3 u0111u1ea7y u0111u1ee7 thu00f4ng tin hay khu00f4ng
export const isQuestionComplete = (question: any): boolean => {
  return Boolean(
    question.text && 
    question.answer && 
    question.answer.trim() !== ''
  );
}; 