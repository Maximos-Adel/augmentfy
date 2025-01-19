import { Buffer } from 'buffer';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter." });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer msy_PXoWn0c4SlXYgAkihRGdGDhKh5dPuUscU4h1`, // Replace with your actual API key
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching GLB file: ${response.statusText}`);
    }

    // Forward the fetched file to the client
    res.setHeader('Content-Type', 'model/gltf-binary');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer)); // Use the imported Buffer
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
