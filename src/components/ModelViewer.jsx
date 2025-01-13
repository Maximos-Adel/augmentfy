/* eslint-disable react/prop-types */

import '@google/model-viewer';

const ModelViewer = ({ glbUrl }) => {
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
    </div>
  );
};

export default ModelViewer;
