import logo from '../assets/logo.png';
import upload from '../assets/upload.svg';
import stars from '../assets/stars.svg';

const ImageTo3D = ({
  imageUrl,
  loading,
  handleImageUploadAndConvertTo3D,
  errorUploading,
  fileData,
  handleFetchDetails,
  generateLoading,
  progress,
  errorGenerating,
}) => {
  return (
    <>
      <div className="flex h-72 w-full flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-800 p-4">
        {!imageUrl && !loading && (
          <label
            htmlFor="file-input"
            className="flex w-full cursor-pointer flex-col items-center"
          >
            <div className="flex flex-col items-center justify-center space-y-1 text-center">
              <img className="h-12 w-12" src={upload} alt="upload" />
              <p className="font-medium text-gray-300">Click to upload</p>
              <p className="text-sm text-[#4B4B4B]">
                Supported formats: .png, .jpg, .jpeg, .webp
              </p>
              <p className="text-sm text-[#4B4B4B]">Max size: 20MB</p>
            </div>
          </label>
        )}

        {loading && (
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Uploading...</p>
          </div>
        )}

        {imageUrl && !loading && (
          <>
            <img
              src={imageUrl}
              alt="Uploaded Preview"
              className="h-full w-full object-contain"
            />
          </>
        )}
        <input
          id="file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUploadAndConvertTo3D}
        />
      </div>
      {errorUploading && (
        <p className="text-sm text-red-400">{errorUploading}</p>
      )}
      <p className="mt-4 text-sm font-medium text-gray-300">Name with AI</p>
      <textarea
        className="h-40 w-full resize-none rounded-lg bg-[#111111] p-3 outline-none placeholder:text-[#363636]"
        placeholder="Give your generation a name"
        value={fileData?.fileName}
      />
      <div className="mt-2 flex items-start justify-center gap-2 text-sm text-gray-300">
        <p>1 min</p>
        <img src={logo} className="w-8" />
        <p>-10</p>
      </div>
      <button
        className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-purple-gradient p-2 py-3 text-lg font-medium text-black disabled:cursor-not-allowed"
        onClick={handleFetchDetails}
        disabled={generateLoading}
      >
        <img src={stars} className="w-6" />
        {generateLoading ? 'Generating ... ' : 'Generate 3D Model'}
      </button>
      {generateLoading && (
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-300">
            Processing your model ... Please wait.
          </p>
          <div className="mt-1 flex w-[95%] items-center gap-2">
            <div
              className="progress-container"
              style={{
                width: '100%',
                background: '#D1D5DB',
                borderRadius: '4px',
              }}
            >
              <div
                className="progress-bar bg-purple-gradient"
                style={{
                  width: `${progress}%`,
                  height: '10px',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }}
              ></div>
            </div>
            <p>{progress}%</p>
          </div>
        </div>
      )}
      {errorGenerating && (
        <p className="text-sm text-red-400">{errorGenerating}</p>
      )}
    </>
  );
};

export default ImageTo3D;
