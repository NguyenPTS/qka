import { NextResponse } from 'next/server';
import FormData from 'form-data';
import fetch from 'node-fetch';

interface WordPressMediaResponse {
  id: number;
  guid: {
    rendered: string;
  };
  source_url: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // WordPress credentials
    const username = 'thanhqt';
    const password = 'pharmatech76';
    const wpUrl = 'https://wordpress.pharmatech.vn';

    // Create form data for WordPress
    const form = new FormData();
    form.append('file', buffer, {
      filename: file.name,
      contentType: file.type
    });

    try {
      console.log('Uploading to WordPress...', {
        url: `${wpUrl}/wp-json/wp/v2/media`,
        fileSize: buffer.length,
        fileName: file.name,
        fileType: file.type
      });

      const response = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        body: form,
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WordPress returned ${response.status}: ${errorText}`);
      }

      const data = await response.json() as WordPressMediaResponse;
      console.log('WordPress response:', data);

      return NextResponse.json({ url: data.source_url });
    } catch (wpError: any) {
      console.error('WordPress upload error:', {
        message: wpError.message,
        status: wpError.status,
        statusText: wpError.statusText
      });
      
      return NextResponse.json({ 
        error: 'Failed to upload to WordPress',
        details: wpError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Upload error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 