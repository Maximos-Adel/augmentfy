import { useCallback, useEffect, useState } from 'react';
import supabase from '../supabase';
import trash from '../assets/trash.svg';
import rename from '../assets/rename.svg';

const UploadedModel = ({ setProxyUrl }) => {
  const [mediaData, setMediaData] = useState([]);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 8; // Number of items per page
  const [totalItems, setTotalItems] = useState(0);

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

  console.log('user', user);

  const [loading, setLoading] = useState(false);

  const fetchMedia = useCallback(
    async (page) => {
      setLoading(true); // Start loading
      try {
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        const { data, count, error } = await supabase
          .from('media')
          .select('*', { count: 'exact' })
          .eq('user_id', user?.id)
          .eq('type', '3d-model')
          .range(start, end);

        if (error) {
          setError(error.message);
        } else {
          setMediaData(data);
          setTotalItems(count);
        }
      } catch (err) {
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setLoading(false); // Stop loading after fetch
      }
    },
    [user?.id, pageSize],
  );

  useEffect(() => {
    if (!user?.id) return;

    fetchMedia(page);

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

  // const deleteMedia = async (id) => {
  //   const { error } = await supabase.from('media').delete().eq('id', id);

  //   if (error) {
  //     console.error('Error deleting media:', error.message);
  //   } else {
  //     setMediaData((prev) => prev.filter((item) => item.id !== id));
  //   }
  // };

  const deleteMedia = async (id, userId, fileName) => {
    if (!id || !userId || !fileName) {
      console.error('Missing required parameters');
      return;
    }

    const filePath = `uploads/${userId}/${fileName}`; // Path to the file
    console.log('filePath', filePath);

    // 1️⃣ Delete from Supabase Storage (Bucket)
    const { error: storageError } = await supabase.storage
      .from('images') // Bucket name
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError.message);
      return;
    }

    console.log('File deleted from bucket:', filePath);

    // 2️⃣ Delete from `media` Table
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting media from table:', dbError.message);
    } else {
      console.log('Deleted from table:', id);
      setMediaData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // const renameFile = async (bucketName, oldPath, newPath) => {
  //   console.log('Renaming:', oldPath, '→', newPath);

  //   // Check if file exists before renaming
  //   const { data: fileData, error: fileError } = await supabase.storage
  //     .from(bucketName)
  //     .list(`uploads/${user.id}`);

  //   if (fileError) {
  //     console.error('Error listing files:', fileError.message);
  //     return;
  //   }

  //   const fileExists = fileData.some((file) => file.name === 'model (12).glb');
  //   if (!fileExists) {
  //     console.error('File does not exist:', oldPath);
  //     return;
  //   }

  //   // Copy the file to the new path
  //   const { error: copyError } = await supabase.storage
  //     .from(bucketName)
  //     .copy(oldPath, newPath);

  //   if (copyError) {
  //     console.error('Error copying file:', copyError.message);
  //     return;
  //   }

  //   // Delete the old file after copying
  //   const { error: removeError } = await supabase.storage
  //     .from(bucketName)
  //     .remove([oldPath]);

  //   if (removeError) {
  //     console.error('Error deleting original file:', removeError.message);
  //     return;
  //   }

  //   console.log('File renamed successfully!');
  // };

  const renameFile = async (bucketName, oldPath, newPath, userId) => {
    console.log('Renaming:', oldPath, '→', newPath);

    // 🗑️ Step 1: Try deleting the target file first (if it already exists)
    await supabase.storage.from(bucketName).remove([newPath]);

    // 📂 Step 2: Copy the file to the new path
    const { error: copyError } = await supabase.storage
      .from(bucketName)
      .copy(oldPath, newPath);

    if (copyError) {
      console.error('Error copying file:', copyError.message);
      return;
    }

    // 🗑️ Step 3: Delete the old file after successful copy
    const { error: removeError } = await supabase.storage
      .from(bucketName)
      .remove([oldPath]);

    if (removeError) {
      console.error('Error deleting original file:', removeError.message);
      return;
    }

    // ✅ Step 4: Extract just the filename (e.g., "uploads/user123/model.glb" → "model.glb")
    const oldFileName = oldPath.split('/').pop();
    const newFileName = newPath.split('/').pop();

    // 🛠 Step 5: Update the filename in the `media` table
    const { error: dbError } = await supabase
      .from('media')
      .update({ name: newFileName })
      .eq('name', oldFileName) // Match by the old file name
      .eq('user_id', userId); // Ensure only the correct user's file is updated

    if (dbError) {
      console.error('Error updating database:', dbError.message);
      return;
    }

    console.log('File renamed successfully in storage & database!');
  };

  const [renamingId, setRenamingId] = useState(null); // Track which item is being renamed
  const [updatedName, setUpdatedName] = useState(''); // Store the new name

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <ul className="flex h-full w-full cursor-pointer flex-col gap-3 rounded-lg p-[1px]">
          {loading && <p>loading</p>}

          {mediaData?.map((data) => (
            <li
              className="flex items-center justify-between"
              key={data.id}
              onClick={() => setProxyUrl(data?.thumbnail)}
            >
              {/* Show input if renaming, otherwise show the name */}
              {renamingId === data.id ? (
                <input
                  type="text"
                  className="rouned-md text-black outline-none"
                  value={updatedName}
                  onChange={(e) => setUpdatedName(e.target.value)}
                  autoFocus
                />
              ) : (
                <p>{data.name}</p>
              )}
              <div className="flex h-full items-center gap-1">
                {/* Rename button */}
                {renamingId === data.id ? (
                  <button
                    className="flex items-center gap-1 rounded-lg bg-[#252527] p-1 px-2 text-xs"
                    onClick={() => {
                      renameFile(
                        'images',
                        `uploads/${user.id}/${data.name}`,
                        `uploads/${user.id}/${updatedName}`,
                        user.id,
                      );
                      setRenamingId(null); // Hide input after renaming
                    }}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    className="flex items-center gap-1 rounded-lg bg-[#252527] p-1 px-2 text-xs"
                    onClick={() => {
                      setRenamingId(data.id); // Show input field
                      setUpdatedName(data.name); // Pre-fill with old name
                    }}
                  >
                    <img src={rename} alt="rename" className="w-4" />
                    <p>Rename</p>
                  </button>
                )}

                {/* Delete button */}
                <button
                  className="flex items-center gap-1 rounded-lg bg-[#252527] p-1 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMedia(data.id, user.id, data.name);
                  }}
                >
                  <img src={trash} alt="trash" className="w-4" />
                  <p>Delete</p>
                </button>
              </div>
            </li>
          ))}
        </ul>
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
    </>
  );
};

export default UploadedModel;
