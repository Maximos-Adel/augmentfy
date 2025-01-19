const ModelViewer = ({ glbUrl }) => {
  return (
    <div>
      {/* 3D Model Viewer */}
      {/* <model-viewer
        alt="3D Model"
        src={`/mesh${glbUrl}`}
        ar
        auto-rotate
        crossorigin="anonymous"
        camera-controls
        style={{ width: '100%', height: '500px' }}
      ></model-viewer> */}
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
