import { useCallback, useEffect, useState } from 'react';
import supabase from '../supabase';
import trash from '../assets/trash.svg';
import rename from '../assets/rename.svg';

const UploadedImage = ({ setDownloadUrl }) => {
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

        // Fetch paginated media
        const { data, count, error } = await supabase
          .from('media')
          .select('*', { count: 'exact' }) // Fetch count of total rows
          .eq('user_id', user?.id)
          .eq('type', 'image') // Filter where type is '3d-model'
          .range(start, end);

        if (error) {
          setError(error.message);
        } else {
          setMediaData(data);
          setTotalItems(count); // Update total rows count
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

  const deleteMedia = async (id) => {
    const { error } = await supabase.from('media').delete().eq('id', id);

    if (error) {
      console.error('Error deleting media:', error.message);
    } else {
      setMediaData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // const renameFile = async (oldPath, newPath, userId) => {
  //   console.log('Renaming in database:', oldPath, '→', newPath);

  //   // 🛠 Step: Update only the filename in the `media` table
  //   const { error: dbError } = await supabase
  //     .from('media')
  //     .update({ name: oldPath })
  //     .eq('name', newPath) // Match by the old file name
  //     .eq('user_id', userId); // Ensure only the correct user's file is updated

  //   if (dbError) {
  //     console.error('Error updating database:', dbError.message);
  //     return;
  //   }

  //   console.log('File name updated successfully in the database!');
  // };
  const renameFile = async (oldName, newName, userId) => {
    if (!newName.trim() || oldName === newName) {
      console.warn('Invalid or same name, skipping update.');
      return;
    }

    // ✅ Step 1: Update the file name in the "media" table
    const { error } = await supabase
      .from('media')
      .update({ name: newName })
      .eq('name', oldName) // Match the old file name
      .eq('user_id', userId); // Ensure it belongs to the correct user

    if (error) {
      console.error('Error updating database:', error.message);
      return;
    }

    console.log(`File renamed successfully: ${oldName} → ${newName}`);
  };

  const [editingId, setEditingId] = useState(null); // Track which item is being edited
  const [newName, setNewName] = useState(''); // Store new name input
  return (
    <>
      <div className="mt-4 h-full w-full">
        {/* <ul className="flex h-full w-full flex-wrap gap-2">
          {loading && <p>loading</p>}
          {mediaData?.map((data) => (
            <li
              className="group relative h-28 w-28 cursor-pointer overflow-hidden rounded-lg bg-purple-gradient p-[1px]"
              key={data.id}
              onClick={() => setDownloadUrl(data.meta_data)}
            >
              <img
                src={data.thumbnail}
                alt="Model Thumbnail"
                className="h-full w-full rounded-lg bg-[#060405] object-contain p-2"
              />

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
            </li>
          ))}
        </ul> */}

        <ul className="flex h-full w-full flex-wrap gap-2">
          {mediaData?.map((data) => (
            <li
              key={data.id}
              className="group relative h-28 w-28 cursor-pointer overflow-hidden rounded-lg bg-purple-gradient p-[1px]"
              onClick={() => setDownloadUrl(data.meta_data)}
            >
              <img
                src={data.thumbnail}
                alt="Model Thumbnail"
                className="h-full w-full rounded-lg bg-[#060405] object-contain p-2"
              />

              {/* Rename Input Field & Button */}
              {editingId === data.id ? (
                <div className="absolute left-0 top-0 flex w-full items-center gap-2 bg-[#252527] p-1">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded p-1 text-black outline-none"
                  />
                  <button
                    className="flex items-center gap-1 rounded-lg bg-[#252527] p-1 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent parent click
                      renameFile(data.name, newName, data.user_id);
                      setEditingId(null);
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="absolute left-1 top-1 rounded bg-black bg-opacity-50 px-2 py-1 text-xs text-white">
                  {data.name}
                </p>
              )}

              {/* Buttons Section */}
              <div className="absolute bottom-0 left-1/2 flex w-max -translate-x-1/2 translate-y-2 items-center gap-1 rounded-lg rounded-t-none p-1 px-2 text-xs opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {/* Rename Button */}
                <button
                  className="flex w-max items-center gap-1 rounded bg-[#252527] p-1 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(data.id);
                    setNewName(data.name); // Set initial value
                  }}
                >
                  <img src={rename} alt="rename" className="w-4" />

                  {/* <p>Rename</p> */}
                </button>

                {/* Delete Button */}
                <button
                  className="flex w-max items-center gap-1 rounded bg-[#252527] p-1 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMedia(data.id);
                  }}
                >
                  <img src={trash} alt="trash" className="w-4" />
                  {/* <p>Delete</p> */}
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

export default UploadedImage;
