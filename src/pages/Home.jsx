import axios from 'axios';
import ModelViewer from '../components/ModelViewer';

import Header from '../components/Header';

import cubic from '../assets/cubic.svg';
import x from '../assets/x.svg';

import download from '../assets/download.svg';
import downloadBlack from '../assets/download-black.svg';
import { useState, useEffect } from 'react';
import supabase from '../supabase';
import ImageTo3D from '../components/ImageTo3D';
import Upload3D from '../components/Upload3D';
import UploadVideo from '../components/UploadVideo';
import UploadedImage from '../components/UploadedImage';
import UploadedModel from '../components/UploadedModel';
import UploadedVideo from '../components/UploadedVideo';

const Home = () => {
  const [fileData, setFileData] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [progress, setProgress] = useState();
  const [modelId, setModelId] = useState('');
  // const [modelDetails, setModelDetails] = useState(null);
  const [errorUploading, setErrorUploading] = useState(null);
  const [errorGenerating, setErrorGenerating] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState({
    fbx: '',
    glb: '',
    obj: '',
    usdz: '',
  });

  const [user, setUser] = useState(null);
  const [proxyUrl, setProxyUrl] = useState(''); // Default to the first item's URL

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error.message);
      } else {
        setUser(data?.user);
      }
    };

    fetchUser();
  }, []);
  console.log('user', user);

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
          Authorization: `Bearer msy_vIzERkacegAOdOxeRcE7TpEY2E8HnWa6NESx`,
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

  const pollTaskStatus = async (taskId) => {
    const headers = {
      Authorization: `Bearer msy_vIzERkacegAOdOxeRcE7TpEY2E8HnWa6NESx`,
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
            // setModelDetails(data);
            setDownloadUrl(data.model_urls);
            // setProxyUrl(data?.model_urls?.glb);

            // supabase insertion
            await supabase.from('media').insert({
              user_id: user.id,
              meta_data: data.model_urls,
              thumbnail: data.thumbnail_url,
            });
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

  const tabs = [
    {
      id: 1,
      name: 'Image to 3D',
    },
    {
      id: 2,
      name: 'Upload 3D File',
    },
    {
      id: 3,
      name: 'Upload Video',
    },
  ];

  const previewTabs = [
    {
      id: 1,
      name: 'Images',
    },
    {
      id: 2,
      name: '3d Models',
    },
    {
      id: 3,
      name: 'Videos',
    },
  ];
  const [select, setSelect] = useState(1);
  const [selectPreview, setSelectPreview] = useState(1);

  const renderStep = () => {
    switch (select) {
      case 1:
        return (
          <ImageTo3D
            imageUrl={imageUrl}
            loading={loading}
            handleImageUploadAndConvertTo3D={handleImageUploadAndConvertTo3D}
            errorUploading={errorUploading}
            fileData={fileData}
            handleFetchDetails={handleFetchDetails}
            generateLoading={generateLoading}
            progress={progress}
            errorGenerating={errorGenerating}
          />
        );
      case 2:
        return <Upload3D setProxyUrl={setProxyUrl} />;
      case 3:
        return <UploadVideo />;

      default:
        return <div>Unknown step</div>;
    }
  };

  const renderPreviewStep = () => {
    switch (selectPreview) {
      case 1:
        return <UploadedImage setDownloadUrl={setDownloadUrl} />;
      case 2:
        return <UploadedModel setProxyUrl={setProxyUrl} />;
      case 3:
        return <UploadedVideo />;

      default:
        return <div>Unknown step</div>;
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const glbUrl = downloadUrl.glb || proxyUrl;
    const proxyUrl = `/api/glb-proxy?url=${encodeURIComponent(glbUrl)}`;
    const modelSrc = glbUrl?.includes('meshy') ? proxyUrl : glbUrl;

    try {
      await navigator.clipboard.writeText(modelSrc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:h-screen">
      <Header />
      <div className="flex h-full flex-col items-stretch gap-8 bg-[#060405] p-8 text-white lg:flex-row">
        <div className="flex h-full w-full flex-col gap-2 bg-[#060405] text-gray-400 lg:w-1/4">
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
          {/* <p className="mt-4 text-sm font-medium text-gray-300">Image</p> */}
          <div className="relative mb-4 flex items-center justify-between gap-2 rounded-lg bg-[#141416] py-3 text-sm text-white">
            <div
              className="absolute left-0 top-0 h-full rounded-lg bg-[#252527] transition-transform duration-300"
              style={{
                width: `${100 / tabs.length}%`,
                transform: `translateX(${tabs.findIndex((tab) => tab.id === select) * 100}%)`,
              }}
            ></div>
            {tabs?.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setSelect(tab.id)}
                className="relative z-10 flex-1 cursor-pointer rounded-lg text-center text-white"
              >
                {tab.name}
              </div>
            ))}
          </div>

          {renderStep()}
        </div>
        <div className="flex h-full w-full flex-col gap-2 bg-[#060405] text-gray-200 lg:w-2/4">
          <div className="h-full rounded-xl bg-purple-gradient p-[1px]">
            <div className="flex h-full flex-col rounded-xl bg-[#060405] p-4">
              <ModelViewer glbUrl={downloadUrl.glb || proxyUrl} />
              {downloadUrl.glb && (
                <div className="relative mt-auto flex w-full items-stretch justify-end gap-2 rounded-lg bg-[#141416] p-2 text-xs">
                  <button className="flex items-center rounded-lg border border-[#3f3f44] bg-[#252527] p-1 px-2 hover:bg-[#1c1c1f]">
                    Get Pro
                  </button>
                  <button
                    className="flex items-center rounded-lg border border-[#3f3f44] bg-[#252527] p-1 px-2 hover:bg-[#1c1c1f]"
                    onClick={copyToClipboard}
                  >
                    {copied ? 'Copied!' : 'Copy Embded Link'}
                  </button>
                  {/* <button
                    className="flex items-center gap-1 rounded-lg border border-[#3f3f44] bg-[#252527] p-1 px-2 hover:bg-[#1c1c1f]"
                    // onClick={() => deleteMedia(modelDetails.id)}
                  >
                    <img src={trash} alt="trash" className="w-4" />
                    <p>Delete</p>
                  </button> */}
                  <div className="w-max rounded-lg bg-purple-gradient p-[1px]">
                    <div className="group w-max rounded-lg bg-[#060405] p-2 text-center text-xs text-white hover:bg-purple-gradient hover:text-black">
                      <button
                        // href={downloadUrl.glb}
                        className="flex items-center gap-1"
                        onClick={() => setIsOpen(!isOpen)}
                      >
                        {/* Default SVG */}
                        <img
                          src={download}
                          className="w-4 group-hover:hidden"
                          alt="Download Icon"
                        />
                        {/* Hover SVG */}
                        <img
                          src={downloadBlack} // Replace with your hover SVG
                          className="hidden w-4 group-hover:block"
                          alt="Download Icon on Hover"
                        />
                        Download
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-3 rounded-lg bg-[#141416] p-4">
                      <p className="font-semibold">Download Settings</p>
                      <div className="flex items-stretch gap-4">
                        <a
                          href={downloadUrl.glb}
                          className="cursor-pointer rounded-lg border border-[#3f3f44] p-4 text-center hover:bg-[#1c1c1f]"
                        >
                          <p className="my-4 text-2xl font-semibold text-[#6E32A5]">
                            GLB
                          </p>
                          <p>Best for E-commerce and web</p>
                        </a>
                        <a
                          href={downloadUrl.usdz}
                          className="cursor-pointer rounded-lg border border-[#3f3f44] p-4 text-center hover:bg-[#1c1c1f]"
                        >
                          <p className="my-4 text-2xl font-semibold text-[#6E32A5]">
                            USDZ
                          </p>
                          <p>Best for Ar View on Ios Device</p>
                        </a>
                      </div>
                      <div>
                        <p className="my-2 font-semibold">Format</p>
                        <div className="flex w-full items-center gap-1 text-gray-400">
                          <a
                            href={downloadUrl.fbx}
                            className="cursor-pointer rounded-lg px-5 py-2 hover:bg-[#252527]"
                          >
                            fbx
                          </a>
                          |
                          <a
                            href={downloadUrl.glb}
                            className="cursor-pointer rounded-lg px-5 py-2 hover:bg-[#252527]"
                          >
                            glb
                          </a>
                          |
                          <a
                            href={downloadUrl.obj}
                            className="cursor-pointer rounded-lg px-5 py-2 hover:bg-[#252527]"
                          >
                            obj
                          </a>
                          |
                          <a
                            href={downloadUrl.usdz}
                            className="cursor-pointer rounded-lg px-5 py-2 hover:bg-[#252527]"
                          >
                            usdz
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex h-full w-full flex-col gap-2 bg-[#060405] lg:w-1/4">
          <p>Uploaded</p>

          <div className="relative mb-4 flex items-center justify-between gap-2 rounded-lg bg-[#141416] py-3 text-sm text-white">
            <div
              className="absolute left-0 top-0 h-full rounded-lg bg-[#252527] transition-transform duration-300"
              style={{
                width: `${100 / previewTabs.length}%`,
                transform: `translateX(${previewTabs.findIndex((tab) => tab.id === selectPreview) * 100}%)`,
              }}
            ></div>
            {previewTabs?.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setSelectPreview(tab.id)}
                className="relative z-10 flex-1 cursor-pointer rounded-lg text-center text-white"
              >
                {tab.name}
              </div>
            ))}
          </div>
          {renderPreviewStep()}
        </div>
      </div>
    </div>
  );
};

export default Home;
