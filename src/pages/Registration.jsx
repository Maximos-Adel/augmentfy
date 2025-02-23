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
      } else if (data.user) {
        console.log('User signed up:', data.user);

        // ✅ Insert user data into the "users" table
        const { error: insertError } = await supabase.from('users').insert([
          {
            id: data.user.id, // Store the auth user ID
            email: data.user.email,
            created_at: new Date(),
          },
        ]);

        if (insertError) {
          console.error('Error saving user to database:', insertError.message);
        } else {
          console.log('User saved in database');
        }

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
        className="flex w-full flex-col gap-4 text-black md:w-1/2 lg:w-1/4"
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
