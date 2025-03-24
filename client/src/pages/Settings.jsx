// client/src/pages/Settings.jsx (partial update)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { useLeague } from '../hooks/useLeague.jsx';
import UserService from '../services/userService.js';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const Settings = () => {
  const { user, updateProfile, error: authError, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentLeague, fetchLeagueDetails } = useLeague();

  const isLeagueAdmin = currentLeague?.members?.some(
    (m) => m.user.toString() === user?._id && (m.role === 'owner' || m.role === 'admin')
  );

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: user?.emailNotifications || false,
    pushNotifications: user?.pushNotifications || false,
    leagueName: currentLeague?.name || '',
    maxMembers: currentLeague?.maxMembers || 10,
    maxRosterSize: currentLeague?.maxRosterSize || 5,
  });

  const [section, setSection] = useState('profile');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name || !formData.email) {
      setFormError('Name and email are required');
      return;
    }

    try {
      // Use the UserService directly
      await UserService.updateUserProfile({
        name: formData.name,
        email: formData.email,
      });
      setFormSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err);
      setFormError(err.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.currentPassword) {
      setFormError('Current password is required');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await updateProfile({
        password: formData.newPassword,
        currentPassword: formData.currentPassword,
      });
      setFormSuccess('Password updated successfully');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.put('/api/users/profile', {
        emailNotifications: formData.emailNotifications,
        pushNotifications: formData.pushNotifications,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFormSuccess('Preferences updated successfully');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update preferences');
    }
  };

  const handleLeagueSubmit = async (e) => {
    e.preventDefault();
    if (!isLeagueAdmin) return;

    setFormError('');
    setFormSuccess('');

    try {
      await api.put(`/api/leagues/${currentLeague?._id}`, {
        name: formData.leagueName,
        maxMembers: parseInt(formData.maxMembers, 10),
        maxRosterSize: parseInt(formData.maxRosterSize, 10),
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchLeagueDetails(currentLeague._id); // Error handling added
      setFormSuccess('League settings updated successfully');
    } catch (err) {
      console.error('League update error:', err);
      setFormError(err.response?.data?.message || 'Failed to update league settings');
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        {['profile', 'password', 'preferences', 'league'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 border-b-2 ${
              section === tab
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
            onClick={() => setSection(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Settings */}
      {section === 'profile' && (
        <Card title="Profile Settings">
          {(authError || formError) && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
              {authError || formError}
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
              {formSuccess}
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Email Address"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <Button type="submit" variant="primary" isLoading={loading}>
              Update Profile
            </Button>
          </form>
        </Card>
      )}

      {/* Password Settings */}
      {section === 'password' && (
        <Card title="Password Settings">
          {(authError || formError) && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
              {authError || formError}
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
              {formSuccess}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              required
            />
            <Input
              label="New Password"
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              helper="Password must be at least 6 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
            />
            <Button type="submit" variant="primary" isLoading={loading}>
              Update Password
            </Button>
          </form>
        </Card>
      )}

      {/* Preferences */}
      {section === 'preferences' && (
        <div className="space-y-6">
          <Card title="Theme Preferences">
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle between light and dark theme
                </p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  id="toggle"
                  name="toggle"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  className="absolute w-0 h-0 opacity-0"
                  aria-label="Toggle dark mode"
                />
                <label
                  htmlFor="toggle"
                  className={`block h-6 w-12 rounded-full cursor-pointer transition-colors ${
                    theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0 left-0 w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
          </Card>

          <Card title="Notification Preferences">
            {(authError || formError) && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                {authError || formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
              {formSuccess}
            </div>
          )}
          <form onSubmit={handlePreferencesSubmit} className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive updates via email
                </p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={handleInputChange}
                  className="absolute w-0 h-0 opacity-0"
                />
                <label
                  htmlFor="emailNotifications"
                  className={`block h-6 w-12 rounded-full cursor-pointer transition-colors ${
                    formData.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0 left-0 w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                      formData.emailNotifications ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive alerts on your device
                </p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  id="pushNotifications"
                  name="pushNotifications"
                  checked={formData.pushNotifications}
                  onChange={handleInputChange}
                  className="absolute w-0 h-0 opacity-0"
                />
                <label
                  htmlFor="pushNotifications"
                  className={`block h-6 w-12 rounded-full cursor-pointer transition-colors ${
                    formData.pushNotifications ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0 left-0 w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                      formData.pushNotifications ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Preferences
            </Button>
          </form>
        </Card>
      </div>
    )}

    {/* League Settings */}
    {section === 'league' && (
      <Card title="League Settings">
        {(authError || formError) && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {authError || formError}
          </div>
        )}
        {formSuccess && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
            {formSuccess}
          </div>
        )}
        {!currentLeague ? (
          <p className="text-gray-600 dark:text-gray-400">Select a league to edit its settings.</p>
        ) : (
          <form onSubmit={handleLeagueSubmit} className="space-y-4">
            <Input
              label="League Name"
              id="leagueName"
              name="leagueName"
              value={formData.leagueName}
              onChange={handleInputChange}
              disabled={!isLeagueAdmin}
              required
            />
            <Input
              label="Max Members"
              type="number"
              id="maxMembers"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleInputChange}
              disabled={!isLeagueAdmin}
              required
            />
            <Input
              label="Max Roster Size"
              type="number"
              id="maxRosterSize"
              name="maxRosterSize"
              value={formData.maxRosterSize}
              onChange={handleInputChange}
              disabled={!isLeagueAdmin}
              required
            />
            <Button type="submit" variant="primary" isLoading={loading} disabled={!isLeagueAdmin}>
              Save League Settings
            </Button>
          </form>
        )}
      </Card>
    )}
  </div>
);
};

export default Settings;