import logo from '../assets/logo.png';
import fy from '../assets/fy.svg';
import supabase from '../supabase';
import { useState } from 'react';
import { useNavigate } from 'react-router';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const signIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error signing in:', error.message);
        setError(error.message);
      } else if (data.user) {
        console.log('User signed in:', data.user);
        navigate('/');
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
        onSubmit={signIn}
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
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      {error && <p className="text-rose-300">{error}</p>}
    </div>
  );
};

export default Login;