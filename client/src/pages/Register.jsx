import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { authService } from '../services/authService';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const { register, loading, error } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    console.log('Form Submitted:', { name, email, password });
    
    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      console.log('Validation failed: Missing fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      console.log('Validation failed: Passwords mismatch');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      console.log('Validation failed: Password too short');
      return;
    }
    
    try {
      console.log('Starting registration...');
      const userProfile = await authService.register({ name, email, password });
      console.log('Registered User:', userProfile);
      const tokenResult = await authService.getToken();
      console.log('Firebase ID Token:', tokenResult);
      console.log('Calling useAuth register...');
      await register({ name, email, password });
      console.log('Registration complete');
    } catch (err) {
      console.error('Registration error:', err.message);
      setFormError(err.message);
    }
  };
  
  return (
    <Card padding="lg" className="animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create an Account</h1>
        <p className="text-gray-600 dark:text-gray-400">Join the Top Chef Fantasy community</p>
      </div>
      
      {(error || formError) && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error || formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Name"
          type="text"
          id="name"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email Address"
          type="email"
          id="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          id="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helper="Password must be at least 6 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div className="mb-6">
          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              I agree to the{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Privacy Policy
              </a>
            </label>
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={loading}
        >
          Create Account
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
};

export default Register;