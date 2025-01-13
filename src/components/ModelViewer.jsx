/* eslint-disable react/prop-types */
// import { useState } from 'react';
import '@google/model-viewer';

const ModelViewer = ({ glbUrl }) => {
  //   const [embedCode, setEmbedCode] = useState('');

  //   const generateEmbedCode = () => {
  //     // Generate the embed code dynamically
  //     const iframeCode = `
  // <iframe
  //   src="${window.location.origin}/model-viewer?src=${encodeURIComponent(
  //     glbUrl,
  //   )}"
  //   width="600"
  //   height="500"
  //   frameborder="0"
  //   allowfullscreen>
  // </iframe>`;
  //     setEmbedCode(iframeCode);
  //   };

  return (
    <div>
      {/* 3D Model Viewer */}
      <model-viewer
        src={`/model${glbUrl}`} // Proxy to the target server
        alt="A 3D model"
        auto-rotate
        camera-controls
        style={{ width: '100%', height: '500px' }}
        crossorigin="anonymous" // Ensure CORS is handled correctly
      ></model-viewer>

      {/* Button to Generate Embed Code */}
      {/* <button
        onClick={generateEmbedCode}
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      >
        Generate Embed Code
      </button> */}

      {/* Display Embed Code */}
      {/* {embedCode && (
        <div className="mt-4">
          <h3 className="mb-2 font-bold">Embed Code:</h3>
          <textarea
            readOnly
            value={embedCode}
            className="w-full rounded border border-gray-300 p-2"
          />
          <button
            onClick={() => navigator.clipboard.writeText(embedCode)}
            className="mt-2 rounded bg-green-500 px-4 py-2 text-white"
          >
            Copy to Clipboard
          </button>
        </div>
      )} */}
    </div>
  );
};

export default ModelViewer;
