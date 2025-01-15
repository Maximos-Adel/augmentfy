const ModelViewer = ({ glbUrl }) => {
  return (
    <div>
      {/* 3D Model Viewer */}
      {/* <model-viewer
        alt="Neil Armstrong's Spacesuit"
        // src={`/mesh${glbUrl}`}
        src={glbUrl}
        ar
        auto-rotate
        crossorigin="anonymous"
        camera-controls
        
      ></model-viewer> */}
      <model-viewer
        alt="3D Model"
        src={`/api/mesh?url=${encodeURIComponent(glbUrl)}`}
        auto-rotate
        camera-controls
        crossorigin="anonymous"
        ar
      ></model-viewer>
    </div>
  );
};

export default ModelViewer;
