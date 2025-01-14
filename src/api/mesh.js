import axios from 'axios';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await axios.get(decodeURIComponent(url), {
      responseType: 'stream', // Stream the file for large responses
    });

    // Set headers to handle content type and CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', response.headers['content-type']);

    // Pipe the response data to the client
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching the GLB file:', error.message);
    res.status(500).send('Failed to fetch the GLB file');
  }
}
