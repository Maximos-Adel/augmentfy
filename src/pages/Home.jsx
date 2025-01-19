import axios from 'axios';
import ModelViewer from '../components/ModelViewer';
import upload from '../assets/upload.svg';
import Header from '../components/Header';
import stars from '../assets/stars.svg';
import cubic from '../assets/cubic.svg';
import x from '../assets/x.svg';
import logo from '../assets/logo.png';
import download from '../assets/download.svg';
import downloadBlack from '../assets/download-black.svg';
import { useState } from 'react';
import supabase from '../supabase';
import ModelsStored from '../components/ModelsStored';
const Home = () => {
  const [fileData, setFileData] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [progress, setProgress] = useState();
  const [modelId, setModelId] = useState('');
  const [modelDetails, setModelDetails] = useState(null);
  const [errorUploading, setErrorUploading] = useState(null);
  const [errorGenerating, setErrorGenerating] = useState(null);

  const handleImageUploadAndConvertTo3D = async (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Content = reader.result;

        // Set image and file data
        setImageUrl(base64Content);
        setFileData({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileContent: base64Content, // Save the base64 content of the image
        });

        // Proceed with 3D conversion
        const headers = {
          Authorization: `Bearer msy_PXoWn0c4SlXYgAkihRGdGDhKh5dPuUscU4h1`,
        };
        const payload = {
          image_url: base64Content,
          enable_pbr: true,
        };

        try {
          setLoading(true);
          const response = await axios.post(
            'https://api.meshy.ai/v1/image-to-3d',
            payload,
            { headers },
          );
          setLoading(false);
          if (response.data?.result) {
            setModelId(response.data.result);
            console.log('Model ID:', response.data.result);
          }
        } catch (error) {
          setLoading(false);
          setErrorUploading(error.message);
          console.error('Error converting image to 3D:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToSupabase = async (bucketName, filePath, object) => {
    try {
      // Convert the object to a Blob
      const blob = new Blob([JSON.stringify(object)], {
        type: 'application/json',
      });
      // Upload the Blob to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, { contentType: 'application/json' });
      if (error) {
        console.error('Error uploading file:', error.message);
        return;
      }
      console.log('File uploaded successfully:', data);
    } catch (error) {
      console.error('Unexpected error:', error.message);
    }
  };

  const pollTaskStatus = async (taskId) => {
    const headers = {
      Authorization: `Bearer msy_PXoWn0c4SlXYgAkihRGdGDhKh5dPuUscU4h1`,
    };
    const pollingInterval = 5000; // Poll every 5 seconds

    try {
      setGenerateLoading(true);
      setProgress(0); // Reset progress

      const interval = setInterval(async () => {
        try {
          const response = await axios.get(
            `https://api.meshy.ai/v1/image-to-3d/${taskId}`,
            { headers },
          );
          const data = response.data;

          console.log('Polling Response:', data);

          if (data.status === 'SUCCEEDED') {
            setModelDetails(data);
            // Use the `data` object directly instead of `modelDetails`
            uploadToSupabase(
              'models',
              `objects/${data.id}.json`, // Use `data.id` instead of `modelDetails?.id`
              data,
            );
            setGenerateLoading(false);
            setProgress(100); // Task is fully completed
            clearInterval(interval); // Stop polling
          } else if (data.status === 'FAILED') {
            setGenerateLoading(false);
            clearInterval(interval); // Stop polling
            console.error('Model processing failed:', data.task_error);
          } else {
            setProgress(data.progress); // Update progress state
          }
        } catch (error) {
          setGenerateLoading(false);
          clearInterval(interval); // Stop polling on error
          setErrorGenerating(error.message);
          console.error('Error while polling:', error);
        }
      }, pollingInterval);
    } catch (error) {
      setGenerateLoading(false);
      console.error('Error initiating polling:', error);
    }
  };

  const handleFetchDetails = () => {
    if (!modelId) {
      console.error('Model ID not found!');
      return;
    }
    setGenerateLoading(true);
    pollTaskStatus(modelId); // Start polling for task status
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <Header />
      <div className="flex h-full items-center bg-[#060405] py-4 text-white">
        <div className="flex h-full w-1/4 flex-col gap-2 bg-[#060405] px-8 py-4 text-gray-400">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-300">
              <img src={cubic} alt="" className="w-6" />
              <p>New Model</p>
            </div>
            <img
              src={x}
              alt=""
              className="w-6 rounded-md border border-gray-500 p-1"
            />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-300">Image</p>

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
        </div>
        <div className="flex h-full w-2/4 flex-col gap-2 bg-[#060405] px-8 py-4 text-gray-200">
          <div className="h-full rounded-xl bg-purple-gradient p-[1px]">
            <div className="flex h-full flex-col rounded-xl bg-[#060405] p-4">
              {modelDetails && modelDetails?.status === 'SUCCEEDED' && (
                <>
                  <ModelViewer glbUrl={modelDetails?.model_urls?.glb} />
                  <div className="mx-auto mt-auto w-max rounded-xl bg-purple-gradient p-[1px]">
                    <div className="group w-full rounded-xl bg-[#060405] px-4 py-2 text-center text-white hover:bg-purple-gradient hover:text-black">
                      <a
                        href={modelDetails?.model_urls?.glb}
                        className="flex items-center gap-2"
                      >
                        {/* Default SVG */}
                        <img
                          src={download}
                          className="w-5 group-hover:hidden"
                          alt="Download Icon"
                        />
                        {/* Hover SVG */}
                        <img
                          src={downloadBlack} // Replace with your hover SVG
                          className="hidden w-5 group-hover:block"
                          alt="Download Icon on Hover"
                        />
                        Download 3D Model
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex h-full w-1/4 flex-col gap-2 bg-[#060405] px-8 py-4 text-gray-200">
          <ModelsStored />
        </div>
      </div>
    </div>
  );
};

export default Home;
