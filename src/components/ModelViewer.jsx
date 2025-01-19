const ModelViewer = ({ glbUrl }) => {
  const proxyUrl = `/api/glb-proxy?url=${encodeURIComponent(glbUrl)}`;

  return (
    <div>
      <model-viewer
        alt="3D Model"
        src={proxyUrl} // Ensure glbUrl contains the full absolute URL
        ar
        auto-rotate
        crossorigin="anonymous"
        camera-controls
        style={{ width: '100%', height: '500px' }}
      ></model-viewer>
    </div>
  );
};

export default ModelViewer;
