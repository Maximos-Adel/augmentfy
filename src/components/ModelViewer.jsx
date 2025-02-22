import { useState } from 'react';

const ModelViewer = ({ glbUrl }) => {
  const proxyUrl = `/api/glb-proxy?url=${encodeURIComponent(glbUrl)}`;
  const modelSrc = glbUrl?.includes('meshy') ? proxyUrl : glbUrl;

  console.log('glbUrl', glbUrl);
  console.log('proxyUrl', proxyUrl);
  console.log('modelSrc', modelSrc);

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(modelSrc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
      console.log('copied', copied);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-between">
      <model-viewer
        src={modelSrc}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        tone-mapping="neutral"
        shadow-intensity="1"
        auto-rotate
        crossorigin="anonymous"
        style={{ width: '100%', height: '500px' }}
      ></model-viewer>
      {glbUrl && (
        <button
          className="mt-auto flex w-full items-center justify-center rounded-lg border border-[#3f3f44] bg-[#252527] p-2 px-2 text-center text-xs hover:bg-[#1c1c1f]"
          onClick={copyToClipboard}
        >
          {copied ? 'Copied!' : 'Copy Embded Link'}
        </button>
      )}
    </div>
  );
};
export default ModelViewer;
