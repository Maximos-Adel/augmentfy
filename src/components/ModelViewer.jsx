const ModelViewer = ({ glbUrl }) => {
  const proxyUrl = `/api/glb-proxy?url=${encodeURIComponent(glbUrl)}`;

  console.log('glbUrl', glbUrl);
  console.log('proxyUrl', proxyUrl);

  return (
    <div>
      <model-viewer
        alt="3D Model"
        src={glbUrl} // Ensure glbUrl contains the full absolute URL
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
