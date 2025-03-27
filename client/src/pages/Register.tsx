import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState<string>('');
  
  const { register, loading, error } = useAuth();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    console.log('Form Submitted:', { name: formData.name, email: formData.email, password: formData.password });
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setFormError('Please fill in all fields');
      console.log('Validation failed: Missing fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      console.log('Validation failed: Passwords mismatch');
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      console.log('Validation failed: Password too short');
      return;
    }
    
    try {
      console.log('Starting registration...');
      const userProfile = await authService.register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password 
      });
      console.log('Registered User:', userProfile);
      const tokenResult = await authService.getToken();
      console.log('Firebase ID Token:', tokenResult);
      console.log('Calling useAuth register...');
      await register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password 
      });
      console.log('Registration complete');
    } catch (err: any) {
      console.error('Registration error:', err.message);
      setFormError(err.message || 'Failed to register');
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
          value={formData.name}
          onChange={handleChange}
          required
        />
        <Input
          label="Email Address"
          type="email"
          id="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Password"
          type="password"
          id="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
          helper="Password must be at least 6 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
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