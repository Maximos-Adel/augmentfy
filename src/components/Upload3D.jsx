import upload from '../assets/upload.svg';

import { useState, useEffect } from 'react';
import supabase from '../supabase';

const Upload3D = ({ setProxyUrl }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error.message);
      } else {
        console.log('User ID:', data?.user?.id); // Log the user ID
        setUser(data?.user);
      }
    };

    fetchUser();
  }, []);

  const [fileData, setFileData] = useState();
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Get the selected file
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setProxyUrl(objectUrl);
    setFileData({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    uploadImage(file, user.id);
  };

  const [uploading, setUploading] = useState(false); // Loading state
  // const [errorMessage, setErrorMessage] = useState(""); // Error state

  const uploadImage = async (file, userId) => {
    if (!file || !userId) {
      setErrorMessage('File or user ID is missing.');
      return;
    }

    setUploading(true);
    setErrorMessage(''); // Reset error before upload

    const filePath = `uploads/${userId}/${file.name}`;

    // Upload image to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        upsert: false,
        metadata: { owner: userId },
      });

    if (error) {
      setErrorMessage(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    if (!urlData) {
      setErrorMessage('Failed to retrieve image URL.');
      setUploading(false);
      return;
    }

    const imageUrl = urlData.publicUrl;
    console.log('File uploaded successfully:', imageUrl);

    // Save the image URL in the media table
    const { error: dbError } = await supabase.from('media').insert([
      {
        user_id: userId,
        meta_data: imageUrl,
        thumbnail: imageUrl,
        type: '3d-model',
        name: file.name,
      },
    ]);

    if (dbError) {
      setErrorMessage(`Error saving image in media table: ${dbError.message}`);
    } else {
      console.log('Image saved in media table');
    }

    setUploading(false);
  };

  console.log('errormasg', errorMessage);
  // const uploadImage = async (file, userId) => {
  //   if (!file || !userId) {
  //     console.error('File or user ID missing');
  //     return;
  //   }
  //   setLoading(true);

  //   const filePath = `uploads/${userId}/${file.name}`; // Unique path for each user

  //   // 1️⃣ Upload image to Supabase Storage
  //   const { data, error } = await supabase.storage
  //     .from('images') // Replace with your bucket name
  //     .upload(filePath, file);

  //   if (error) {
  //     console.error('Upload failed:', error.message);
  //     return;
  //   }

  //   // 2️⃣ Get the public URL (or use private with auth rules)
  //   const imageUrl = supabase.storage.from('images').getPublicUrl(filePath)
  //     .data.publicUrl;

  //   console.log('File uploaded successfully:', imageUrl);

  //   // 3️⃣ Save the image URL in the media table
  //   const { error: dbError } = await supabase.from('media').insert([
  //     {
  //       user_id: userId, // Link to the user
  //       meta_data: imageUrl,
  //       thumbnail: imageUrl,
  //       type: '3d-model',
  //       name: file.name,
  //     },
  //   ]);

  //   if (dbError) {
  //     console.error('Error saving image in media table:', dbError.message);
  //   } else {
  //     console.log('Image saved in media table');
  //     setLoading(false);
  //   }
  // };

  return (
    <>
      <div className="flex h-72 w-full flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-800 p-4">
        <label
          htmlFor="file-input"
          className="flex w-full cursor-pointer flex-col items-center"
        >
          <div className="flex flex-col items-center justify-center space-y-1 text-center">
            <img className="h-12 w-12" src={upload} alt="upload" />
            <p className="font-medium text-gray-300">Click to upload</p>
            <p className="text-sm text-[#4B4B4B]">Supported formats: .glb</p>
            <p className="text-sm text-[#4B4B4B]">Max size: 20MB</p>
          </div>
        </label>

        <input
          id="file-input"
          type="file"
          // accept="image/*" // Restrict to images only
          className="hidden"
          onChange={(e) => handleFileChange(e)}
        />
      </div>

      <p className="mt-4 text-sm font-medium text-gray-300">Name with AI</p>
      <textarea
        className="h-40 w-full resize-none rounded-lg bg-[#111111] p-3 outline-none placeholder:text-[#363636]"
        placeholder="Give your generation a name"
        value={fileData?.fileName}
      />
      {uploading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="ml-2 text-gray-500">Uploading model...</p>
        </div>
      )}
      {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
    </>
  );
};

export default Upload3D;
