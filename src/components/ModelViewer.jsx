const ModelViewer = ({ glbUrl }) => {
  const proxyUrl = `/api/glb-proxy?url=${encodeURIComponent(glbUrl)}`;
  const modelSrc = glbUrl?.includes('meshy') ? proxyUrl : glbUrl;

  console.log('glbUrl', glbUrl);
  console.log('proxyUrl', proxyUrl);

  return (
    <div>
      {/* <model-viewer
        alt="3D Model"
        src={modelSrc}
        ar
        auto-rotate
        crossorigin="anonymous"
        camera-controls
        style={{ width: '100%', height: '500px' }}
      ></model-viewer> */}
      <model-viewer
        src={glbUrl}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        tone-mapping="neutral"
        poster="poster.webp"
        shadow-intensity="1"
        auto-rotate
        crossorigin="anonymous"
        style={{ width: '100%', height: '500px' }}
      ></model-viewer>
    </div>
  );
};
export default ModelViewer;
