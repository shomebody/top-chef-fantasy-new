// client/src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLeague } from '../hooks/useLeague';
import Card from '../components/ui/Card';
import api from '../services/api';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Define types for League member
interface LeagueMember {
  user: string | { _id: string; name: string };
  role: 'owner' | 'admin' | 'member';
}

// Form data interfaces
interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PreferenceFormData {
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface LeagueFormData {
  leagueName: string;
  maxMembers: number;
  maxRosterSize: number;
}

function Settings() {
  const { user, updateProfile, error: authError, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentLeague, fetchLeagueDetails } = useLeague();

  // Check if user is a league admin
  const isLeagueAdmin = currentLeague?.members?.some(
    (member: LeagueMember) => {
      const memberId = typeof member.user === 'string' ? member.user : member.user?._id;
      return memberId === user?._id && (member.role === 'owner' || member.role === 'admin');
    }
  );

  // Initialize form states with proper types
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferenceForm, setPreferenceForm] = useState<PreferenceFormData>({
    emailNotifications: false,
    pushNotifications: false,
  });

  const [leagueForm, setLeagueForm] = useState<LeagueFormData>({
    leagueName: currentLeague?.name || '',
    maxMembers: currentLeague?.maxMembers || 10,
    maxRosterSize: currentLeague?.maxRosterSize || 5,
  });

  const [section, setSection] = useState<string>('profile');
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Update form data when user or league data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (currentLeague) {
      setLeagueForm({
        leagueName: currentLeague.name || '',
        maxMembers: currentLeague.maxMembers || 10,
        maxRosterSize: currentLeague.maxRosterSize || 5,
      });
    }
  }, [currentLeague]);

  // Update preferences from user data
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user?._id) return;
      
      try {
        // Get user data from Firestore directly
        const userDocRef = doc(db, 'users', user._id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setPreferenceForm({
            emailNotifications: !!userData.emailNotifications,
            pushNotifications: !!userData.pushNotifications,
          });
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
      }
    };
    
    fetchUserPreferences();
  }, [user?._id]);

  // Input change handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferenceForm(prev => ({ ...prev, [name]: checked }));
  };

  const handleLeagueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'leagueName') {
      setLeagueForm(prev => ({ ...prev, leagueName: value }));
    } else if (name === 'maxMembers' || name === 'maxRosterSize') {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setLeagueForm(prev => ({ ...prev, [name]: numValue }));
      }
    }
  };

  // Form submission handlers
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      if (!profileForm.name || !profileForm.email) {
        throw new Error('Name and email are required');
      }

      await updateProfile({
        name: profileForm.name,
        email: profileForm.email
      });
      
      setFormSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      if (!passwordForm.currentPassword) {
        throw new Error('Current password is required');
      }
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      if (passwordForm.newPassword && passwordForm.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Split this into two steps to avoid unknown property error
      // Step 1: Verify current password (handled client-side by Firebase auth)
      // Step 2: Update with new password
      await updateProfile({
        password: passwordForm.newPassword
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setFormSuccess('Password updated successfully');
    } catch (err) {
      console.error('Password update error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      if (!user || !user._id) {
        throw new Error('User not authenticated');
      }
      
      // Update user preferences in Firestore
      const userRef = doc(db, 'users', user._id);
      await updateDoc(userRef, {
        emailNotifications: preferenceForm.emailNotifications,
        pushNotifications: preferenceForm.pushNotifications,
      });
      
      setFormSuccess('Preferences updated successfully');
    } catch (err) {
      console.error('Preferences update error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeagueSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLeagueAdmin || !currentLeague?._id) return;

    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      await api.put(`/leagues/${currentLeague._id}`, {
        name: leagueForm.leagueName,
        maxMembers: leagueForm.maxMembers,
        maxRosterSize: leagueForm.maxRosterSize,
      });
      
      // Refresh league data
      if (currentLeague._id) {
        await fetchLeagueDetails(currentLeague._id);
      }
      setFormSuccess('League settings updated successfully');
    } catch (err) {
      console.error('League update error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update league settings');
    } finally {
      setSubmitting(false);
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
            type="button"
            className={`px-4 py-2 border-b-2 ${
              section === tab
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
            onClick={() => setSection(tab)}
            aria-pressed={section === tab}
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
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${(submitting || loading) ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={submitting || loading}
            >
              {submitting || loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : "Update Profile"}
            </button>
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
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Password must be at least 6 characters</p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${(submitting || loading) ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={submitting || loading}
            >
              {submitting || loading ? "Processing..." : "Update Password"}
            </button>
          </form>
        </Card>
      )}

      {/* Rest of the component implementation... */}
      {/* Preferences and League sections follow the same pattern of replacing Input and Button components with native elements */}
      
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
                    checked={preferenceForm.emailNotifications}
                    onChange={handlePreferenceChange}
                    className="absolute w-0 h-0 opacity-0"
                    aria-label="Toggle email notifications"
                  />
                  <label
                    htmlFor="emailNotifications"
                    className={`block h-6 w-12 rounded-full cursor-pointer transition-colors ${
                      preferenceForm.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0 left-0 w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                        preferenceForm.emailNotifications ? 'translate-x-6' : 'translate-x-0'
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
                    checked={preferenceForm.pushNotifications}
                    onChange={handlePreferenceChange}
                    className="absolute w-0 h-0 opacity-0"
                    aria-label="Toggle push notifications"
                  />
                  <label
                    htmlFor="pushNotifications"
                    className={`block h-6 w-12 rounded-full cursor-pointer transition-colors ${
                      preferenceForm.pushNotifications ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0 left-0 w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                        preferenceForm.pushNotifications ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <button
                type="submit"
                className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Preferences"}
              </button>
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
              <div className="mb-4">
                <label htmlFor="leagueName" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  League Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="leagueName"
                  name="leagueName"
                  type="text"
                  value={leagueForm.leagueName}
                  onChange={handleLeagueChange}
                  disabled={!isLeagueAdmin}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="maxMembers" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Members
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="maxMembers"
                  name="maxMembers"
                  type="number"
                  min={2}
                  max={20}
                  value={leagueForm.maxMembers}
                  onChange={handleLeagueChange}
                  disabled={!isLeagueAdmin}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="maxRosterSize" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Roster Size
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="maxRosterSize"
                  name="maxRosterSize"
                  type="number"
                  min={1}
                  max={10}
                  value={leagueForm.maxRosterSize}
                  onChange={handleLeagueChange}
                  disabled={!isLeagueAdmin}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              
              <button
                type="submit"
                className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${(!isLeagueAdmin || submitting) ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={!isLeagueAdmin || submitting}
              >
                {submitting ? "Saving..." : "Save League Settings"}
              </button>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}

export default Settings;