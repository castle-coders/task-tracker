import React, { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Key, Smartphone } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import api from '../api/client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // const { login } = useAuth();
    // const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

    // 2FA State
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (is2FARequired) {
            try {
                await api.post('/auth/login/2fa', { code: twoFactorCode });
                window.location.href = '/';
            } catch (err: any) {
                setError(err.response?.data?.error || 'Invalid 2FA code');
            }
            return;
        }

        try {
            const res = await api.post('/auth/login', { email, password });

            if (res.data['2fa_required']) {
                setIs2FARequired(true);
                setError('');
                return;
            }

            window.location.href = '/';
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    const handlePasskeyLogin = async () => {
        if (!email) {
            setError('Please enter your email address first to use a Passkey');
            return;
        }
        setError('');
        setIsPasskeyLoading(true);
        try {
            const optsRes = await api.post('/auth/passkey/login/options', { email });
            const options = optsRes.data;

            const authResp = await startAuthentication(options);

            await api.post('/auth/passkey/login/verify', authResp);

            window.location.href = '/';
        } catch (e: any) {
            console.error(e);
            setError(e.response?.data?.error || 'Passkey login failed. Ensure you have registered a passkey.');
        } finally {
            setIsPasskeyLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {is2FARequired ? 'Two-Factor Authentication' : 'Welcome back'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {is2FARequired ? 'Enter the code from your authenticator app' : 'Sign in to manage your tasks'}
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4 border border-red-200">
                            <div className="text-sm text-red-700 text-center">{error}</div>
                        </div>
                    )}

                    {!is2FARequired ? (
                        <>
                            <div className="space-y-4 rounded-md shadow-sm">
                                <div>
                                    <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email address
                                    </label>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors duration-200 ease-in-out"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors duration-200 ease-in-out"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="group relative flex w-full justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    Sign in
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handlePasskeyLogin}
                                disabled={isPasskeyLoading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                <Key className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                {isPasskeyLoading ? 'Verifying...' : 'Log in with Passkey'}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                                    <Smartphone className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="2fa-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Verification Code
                                </label>
                                <input
                                    id="2fa-code"
                                    name="code"
                                    type="text"
                                    autoComplete="one-time-code"
                                    required
                                    autoFocus
                                    className="text-center tracking-widest text-lg appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors duration-200 ease-in-out"
                                    placeholder="000000"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="group relative flex w-full justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                Verify
                            </button>
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setIs2FARequired(false)}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {!is2FARequired && (
                        <div className="text-sm text-center">
                            <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
                            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                Sign up today
                            </Link>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
