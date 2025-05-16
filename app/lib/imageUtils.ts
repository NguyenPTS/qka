// Hu00e0m xu1eed lu00fd URL hu00ecnh u1ea3nh 
// Import file nu00e0y vu00e0o trong page.tsx bu1eb1ng cu00e1ch thu00eam du00f2ng: 
// import { getImageUrl } from '../lib/imageUtils';

export function getImageUrl(url: string | undefined): string | null {
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
} 