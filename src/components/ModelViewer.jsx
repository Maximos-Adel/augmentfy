const ModelViewer = ({ glbUrl }) => {
  return (
    <div>
      {/* 3D Model Viewer */}
      <model-viewer
        alt="Neil Armstrong's Spacesuit"
        src={`/mesh${glbUrl}`}
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
