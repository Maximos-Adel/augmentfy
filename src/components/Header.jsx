import arrow from '../assets/left-arrow.svg';
import logo from '../assets/logo.png';
import fy from '../assets/fy.svg';
import electric from '../assets/electric.svg';
import gift from '../assets/gift.svg';
import pic from '../assets/Capture.jpg';
import supabase from '../supabase';
import { useNavigate } from 'react-router';

const Header = () => {
  // const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const { data, error } = await supabase.auth.getUser();
  //     if (error) {
  //       console.error('Error fetching user:', error.message);
  //     } else {
  //       setUser(data?.user);
  //     }
  //   };

  //   fetchUser();
  // }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
    else navigate('/login');
  };

  return (
    <div className="flex items-center justify-between bg-background-header p-4 text-sm text-white">
      <div className="flex items-center justify-center">
        <img src={arrow} alt="logo" className="mr-1 w-4" />
        <p>| Exit to home page</p>
      </div>

      <div className="flex items-center">
        <img src={logo} className="-mr-1 w-14" />
        <img src={fy} />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <img src={logo} className="w-8" />
          <p>25</p>
        </div>
        <div className="flex items-center rounded-md bg-[#250B43] px-2 py-1 text-sm">
          <img src={electric} className="w-6" />
          <p>Get Credits</p>
        </div>
        <div className="rounded-md bg-[#250B43] px-2 py-1 text-sm">
          <img src={gift} className="w-5" />
        </div>
        <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-600 text-center">
          <img src={pic} className="h-full w-full object-cover" />
        </div>

        <button onClick={signOut}>sign out</button>
      </div>
    </div>
  );
};

export default Header;
