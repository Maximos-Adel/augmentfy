import { useEffect, useState } from 'react';
import supabase from '../supabase';

const ModelsStored = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true); // To track loading state
  const [error, setError] = useState(null); // To track any errors
  const bucketName = 'models';
  const folderPath = 'objects'; // Path to the folder inside the bucket

  const downloadJsonFilesFromFolder = async (bucketName, folderPath) => {
    try {
      // List all files in the specific folder
      const { data: fileList, error: listError } = await supabase.storage
        .from(bucketName)
        .list(folderPath, { limit: 100 });

      if (listError) {
        throw new Error(`Error listing files: ${listError.message}`);
      }

      if (!fileList || fileList.length === 0) {
        console.log(`No files found in the folder "${folderPath}".`);
        return [];
      }

      // Filter files to include only `.json` files
      const jsonFiles = fileList.filter((file) => file.name.endsWith('.json'));

      // Download and parse each JSON file
      const allFilesContent = [];
      for (const file of jsonFiles) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucketName)
          .download(`${folderPath}/${file.name}`);

        if (downloadError) {
          console.error(
            `Error downloading file ${file.name}:`,
            downloadError.message,
          );
          continue; // Skip this file and move to the next one
        }

        // Convert the Blob to text
        const fileText = await fileData.text();

        // Parse the JSON content
        const fileContent = JSON.parse(fileText);

        allFilesContent.push({ fileName: file.name, content: fileContent });
      }

      return allFilesContent;
    } catch (error) {
      console.error('Unexpected error:', error.message);
      throw error; // Rethrow to handle it in the caller
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Start loading
        const allData = await downloadJsonFilesFromFolder(
          bucketName,
          folderPath,
        );
        if (allData) {
          setModels(allData); // Update state only if there is data
        }
      } catch (err) {
        setError(err.message || 'Failed to load models.');
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Your 3D Models</h2>

      {loading && (
        <div className="mt-2 flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
        </div>
      )}

      {/* Show Error Message */}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Show Models */}
      <div className="mt-4 flex flex-wrap gap-2">
        {models?.map((model) => (
          <div
            className="h-36 w-36 rounded-lg bg-purple-gradient p-[1px]"
            key={model?.content?.id || model?.fileName} // Fallback key if id is missing
          >
            <img
              src={model?.content?.thumbnail_url}
              alt="Model Thumbnail"
              className="h-full w-full rounded-lg bg-[#060405] object-contain p-2"
            />
          </div>
        ))}
      </div>

      {/* Show Empty State if No Models */}
      {!loading && models.length === 0 && !error && (
        <p>No models found in the folder.</p>
      )}
    </div>
  );
};

export default ModelsStored;
