import logo from '../assets/logo.png';
import upload from '../assets/upload.svg';
import stars from '../assets/stars.svg';
import { useState, useEffect } from 'react';
import supabase from '../supabase';

const Upload3D = ({
  imageUrl,
  loading,
  handleImageUploadAndConvertTo3D,
  errorUploading,
  fileData,
  handleFetchDetails,
  generateLoading,
  progress,
  errorGenerating,
  handleGlbUpload,
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
              <p className="text-sm text-[#4B4B4B]">Supported formats: .glb</p>
              <p className="text-sm text-[#4B4B4B]">Max size: 20MB</p>
            </div>
          </label>
        )}
        <input
          id="file-input"
          type="file"
          accept=".glb"
          className="hidden"
          onChange={handleGlbUpload}
        />
      </div>
      <p>{loading ? 'loading' : ''}</p>
      <p className="mt-4 text-sm font-medium text-gray-300">Name with AI</p>
      <textarea
        className="h-40 w-full resize-none rounded-lg bg-[#111111] p-3 outline-none placeholder:text-[#363636]"
        placeholder="Give your generation a name"
        value={fileData?.fileName}
      />
    </>
  );
};

export default Upload3D;
