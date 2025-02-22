import { useCallback, useEffect, useState } from 'react';
import supabase from '../supabase';
import trash from '../assets/trash.svg';

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

  const fetchMedia = useCallback(
    async (page) => {
      try {
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        // Fetch paginated media
        const { data, count, error } = await supabase
          .from('media')
          .select('*', { count: 'exact' }) // Fetch count of total rows
          .eq('user_id', user?.id)
          .eq('type', '3d-model') // Filter where type is '3d-model'
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

  const deleteMedia = async (id) => {
    const { error } = await supabase.from('media').delete().eq('id', id);

    if (error) {
      console.error('Error deleting media:', error.message);
    } else {
      setMediaData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <ul className="flex w-full cursor-pointer flex-col gap-2 rounded-lg p-[1px]">
          {mediaData?.map((data) => (
            <li
              className="flex items-center justify-between"
              key={data.id}
              onClick={() => setProxyUrl(data?.thumbnail)}
            >
              <p>{data.name}</p>
              <button
                className="flex translate-y-2 items-center gap-1 rounded-lg bg-[#252527] p-1 px-2 text-xs"
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
