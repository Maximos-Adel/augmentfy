import { Buffer } from 'buffer';

export default async function handler(req, res) {
  const { glb } = req.query;

  // Full URL of the Meshy file (replace with your actual URL structure)
  const meshUrl = `https://assets.meshy.ai/${glb}`;

  try {
    const response = await fetch(meshUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch GLB file: ${response.status}`);
    }

    // Pass through the file as a stream
    const fileBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Disposition', 'inline');
    res.status(200).send(Buffer.from(fileBuffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ message: 'Failed to fetch the file' });
  }
}
