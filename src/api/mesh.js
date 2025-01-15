import axios from 'axios';

export default async function handler(req, res) {
  const { url } = req.query; // Get the URL parameter from the query string

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await axios.get(decodeURIComponent(url), {
      responseType: 'stream', // Stream the response to handle large files
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Set content type and pipe the file stream to the client
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching the GLB file:', error.message);
    res.status(500).json({ error: 'Failed to fetch the GLB file' });
  }
}
