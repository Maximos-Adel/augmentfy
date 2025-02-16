import axios from 'axios';
import ModelViewer from '../components/ModelViewer';

import Header from '../components/Header';

import cubic from '../assets/cubic.svg';
import x from '../assets/x.svg';

import download from '../assets/download.svg';
import downloadBlack from '../assets/download-black.svg';
import { useState, useCallback, useEffect } from 'react';
import supabase from '../supabase';
import ImageTo3D from '../components/ImageTo3D';
import Upload3D from '../components/Upload3D';
import UploadVideo from '../components/UploadVideo';
import trash from '../assets/trash.svg';
// import ModelsStored from '../components/ModelsStored';

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
  // console.log('proxy', proxyUrl);
  // // console.log('modelDetails', modelDetails);

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

  const handleGlbUpload = (e) => {
    const file = e.target.files[0];

    if (file && file.name.toLowerCase().endsWith('.glb')) {
      const objectUrl = URL.createObjectURL(file); // Convert file to Blob URL

      // Reset downloadUrl and set proxyUrl
      setDownloadUrl({ fbx: '', glb: '', obj: '', usdz: '' });
      setProxyUrl(objectUrl);

      console.log('Reset downloadUrl:', downloadUrl);
      console.log('Uploaded GLB URL:', objectUrl);
    } else {
      alert('Please upload a valid .glb file');
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

  const [mediaData, setMediaData] = useState([]);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 8; // Number of items per page
  const [totalItems, setTotalItems] = useState(0);

  const fetchMedia = useCallback(
    async (page) => {
      try {
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        // Fetch paginated media
        const { data, error, count } = await supabase
          .from('media')
          .select('*', { count: 'exact' }) // Fetch count of total rows
          .eq('user_id', user?.id)
          .range(start, end);

        if (error) {
          setError(error.message);
        } else {
          setMediaData(data);
          setTotalItems(count); // Update total rows count
        }
      } catch (err) {
        setError(`An unexpected error occurred: ${err.message}`);
      }
    },
    [user?.id, pageSize],
  );

  useEffect(() => {
    if (!user?.id) return;

    // Fetch media initially
    fetchMedia(page);

    // Set up real-time subscription
    const subscription = supabase
      .channel('media-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMediaData((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setMediaData((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new : item,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            setMediaData((prev) =>
              prev.filter((item) => item.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    console.log('Subscription created:', subscription);

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchMedia, user?.id, page]);

  // Pagination Controls
  const totalPages = Math.ceil(totalItems / pageSize);

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  console.log('error', error);
  console.log('data', mediaData);

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
  const [select, setSelect] = useState(1);
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
        return (
          <Upload3D
            imageUrl={imageUrl}
            loading={loading}
            handleImageUploadAndConvertTo3D={handleImageUploadAndConvertTo3D}
            errorUploading={errorUploading}
            fileData={fileData}
            handleFetchDetails={handleFetchDetails}
            generateLoading={generateLoading}
            progress={progress}
            errorGenerating={errorGenerating}
            handleGlbUpload={handleGlbUpload}
          />
        );
      case 3:
        return <UploadVideo />;

      default:
        return <div>Unknown step</div>;
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  const deleteMedia = async (id) => {
    const { error } = await supabase.from('media').delete().eq('id', id);

    if (error) {
      console.error('Error deleting media:', error.message);
    } else {
      setMediaData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <Header />
      <div className="flex h-full items-center gap-8 bg-[#060405] p-8 text-white">
        <div className="flex h-full w-1/4 flex-col gap-2 bg-[#060405] text-gray-400">
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
        <div className="flex h-full w-2/4 flex-col gap-2 bg-[#060405] text-gray-200">
          <div className="h-full rounded-xl bg-purple-gradient p-[1px]">
            <div className="flex h-full flex-col rounded-xl bg-[#060405] p-4">
              <ModelViewer glbUrl={downloadUrl.glb || proxyUrl} />
              {downloadUrl.glb && (
                <div className="relative mt-auto flex w-full items-stretch justify-end gap-2 rounded-lg bg-[#141416] p-2 text-xs">
                  <button className="flex items-center rounded-lg border border-[#3f3f44] bg-[#252527] p-1 px-2 hover:bg-[#1c1c1f]">
                    Get Pro
                  </button>
                  <button className="flex items-center rounded-lg border border-[#3f3f44] bg-[#252527] p-1 px-2 hover:bg-[#1c1c1f]">
                    Embded
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

        <div className="flex h-full w-1/4 flex-col gap-2 bg-[#060405] text-gray-200">
          {/* <ModelsStored /> */}
          <p>Your 3D Models</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {mediaData?.map((data) => (
              <div
                className="group relative h-28 w-28 cursor-pointer overflow-hidden rounded-lg bg-purple-gradient p-[1px]"
                key={data.id}
                onClick={() => setDownloadUrl(data.meta_data)}
              >
                <img
                  src={data.thumbnail}
                  alt="Model Thumbnail"
                  className="h-full w-full rounded-lg bg-[#060405] object-contain p-2"
                />

                {/* Delete Button with Hover Animation */}
                <button
                  className="absolute bottom-0 flex w-full translate-y-2 items-center gap-1 rounded-lg rounded-t-none bg-[#252527] p-1 px-2 text-xs opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent parent click
                    deleteMedia(data.id);
                  }}
                >
                  <img src={trash} alt="trash" className="w-4" />
                  <p>Delete</p>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-auto flex w-full items-center justify-between gap-4">
            <button
              onClick={handlePreviousPage}
              disabled={page === 1}
              className="rounded-lg bg-background-header p-2 px-4"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="rounded-lg bg-background-header p-2 px-4"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
