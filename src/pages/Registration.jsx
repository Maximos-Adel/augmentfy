import logo from '../assets/logo.png';
import fy from '../assets/fy.svg';
import supabase from '../supabase';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

const Registration = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const signUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        console.error('Error signing up:', error.message);
        setError(error.message);
      } else {
        const {
          user: { id, email },
        } = data;
        console.log('//////////////');
        console.log(id, email);
        console.log('//////////////');
        const test = await supabase.from('users').select();
        console.log(test);
        const createdUser = await supabase.from('users').insert({ id, email });
        console.log('creat', createdUser);
        console.log('User signed up:', data.user);
        navigate('/app');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background-header p-4 text-sm text-white">
      <div className="flex items-center">
        <img src={logo} className="-mr-1 w-14" alt="Logo" />
        <img src={fy} alt="FY Logo" />
      </div>
      <form
        className="flex w-[20%] flex-col gap-4 text-black"
        onSubmit={signUp}
      >
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded p-4 outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded p-4 outline-none"
        />
        <button
          type="submit"
          className="w-full rounded bg-gray-900 p-4 text-white"
          disabled={loading}
        >
          {loading ? 'Loading' : 'Sign Up'}
        </button>
      </form>
      {error && <p className="text-rose-300">{error}</p>}
      <Link to="/login" className="cursor-pointer hover:underline">
        Already have an account
      </Link>
    </div>
  );
};

export default Registration;
