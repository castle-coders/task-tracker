import { useState, useEffect } from 'react';
import { Shield, Key, Smartphone, Tag, ListFilter, Trash2, Plus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { startRegistration } from '@simplewebauthn/browser';
import api from '../api/client';
import type { Category, Priority } from '../types';

export default function SettingsView() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);

    // Config State
    const [newCategory, setNewCategory] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
    const [newPriority, setNewPriority] = useState('');
    const [newPriorityLevel, setNewPriorityLevel] = useState(0);

    // Auth State
    const [hasTotp, setHasTotp] = useState(false);
    const [isTotpSetupOpen, setIsTotpSetupOpen] = useState(false);
    const [totpSecret, setTotpSecret] = useState('');
    const [totpUri, setTotpUri] = useState('');
    const [totpVerifyCode, setTotpVerifyCode] = useState('');

    useEffect(() => {
        fetchReferences();
    }, []);

    const fetchReferences = async () => {
        try {
            const [catRes, priRes, meRes] = await Promise.all([
                api.get('/categories'),
                api.get('/priorities'),
                api.get('/auth/me')
            ]);
            setCategories(catRes.data);
            setPriorities(priRes.data);
            setHasTotp(meRes.data.has_totp);
        } catch (e) {
            console.error("Failed to fetch references", e);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        try {
            await api.post('/categories', { name: newCategory, color: newCategoryColor });
            setNewCategory('');
            setNewCategoryColor('#6366f1');
            fetchReferences();
        } catch (e) {
            alert('Failed to add category');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Delete this category?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchReferences();
        } catch (e) {
            alert('Failed to delete category (it may be in use)');
        }
    };

    const handleAddPriority = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPriority.trim()) return;
        try {
            await api.post('/priorities', { name: newPriority, level: newPriorityLevel });
            setNewPriority('');
            fetchReferences();
        } catch (e) {
            alert('Failed to add priority');
        }
    };

    const handleDeletePriority = async (id: number) => {
        if (!confirm('Delete this priority?')) return;
        try {
            await api.delete(`/priorities/${id}`);
            fetchReferences();
        } catch (e) {
            alert('Failed to delete priority (it may be in use)');
        }
    };

    const handleStartTotpSetup = async () => {
        try {
            const res = await api.post('/auth/totp/setup');
            setTotpSecret(res.data.secret);
            setTotpUri(res.data.uri);
            setIsTotpSetupOpen(true);
            setTotpVerifyCode('');
        } catch (e) {
            alert('Failed to start TOTP setup');
        }
    };

    const handleVerifyTotp = async () => {
        try {
            await api.post('/auth/totp/verify', { secret: totpSecret, code: totpVerifyCode });
            setHasTotp(true);
            setIsTotpSetupOpen(false);
            setTotpSecret('');
            setTotpUri('');
            setTotpVerifyCode('');
            alert('Two-Factor Authentication Enabled!');
        } catch (e) {
            alert('Invalid verification code');
        }
    };

    const handleDisableTotp = async () => {
        if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
        try {
            await api.delete('/auth/totp');
            setHasTotp(false);
            alert('Two-Factor Authentication Disabled');
        } catch (e) {
            alert('Failed to disable 2FA');
        }
    };

    const handleRegisterPasskey = async () => {
        try {
            const optsRes = await api.post('/auth/passkey/register/options');
            const options = optsRes.data;

            const attResp = await startRegistration(options);

            await api.post('/auth/passkey/register/verify', attResp);
            alert('Passkey registered successfully! You can now use it to log in.');
        } catch (e) {
            console.error(e);
            alert('Failed to register passkey. Ensure you are on a supported device/browser.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage your account security and application preferences.
                </p>
            </div>

            {/* Task Configuration */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <ListFilter className="h-5 w-5 text-indigo-600" />
                        Task Configuration
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage categories and priorities for your tasks.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    {/* Categories */}
                    <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-2 mb-4">
                            <Tag className="h-4 w-4" /> Categories
                        </h5>
                        <ul className="space-y-2 mb-4">
                            {categories.map(cat => (
                                <li key={cat.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-sm group">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#6366f1' }} />
                                        <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                                    </div>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="color"
                                    value={newCategoryColor}
                                    onChange={e => setNewCategoryColor(e.target.value)}
                                    className="h-9 w-9 p-0 border-0 rounded cursor-pointer self-center"
                                />
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    placeholder="New Category"
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <button type="submit" className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors">
                                <Plus size={18} />
                            </button>
                        </form>
                    </div>

                    {/* Priorities */}
                    <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-2 mb-4">
                            <ListFilter className="h-4 w-4" /> Priorities
                        </h5>
                        <ul className="space-y-2 mb-4">
                            {priorities.map(pri => (
                                <li key={pri.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-sm group">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${pri.level >= 10 ? 'bg-red-500' : pri.level >= 5 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                        <span className="text-gray-700 dark:text-gray-300">{pri.name} <span className="text-xs text-gray-400">({pri.level})</span></span>
                                    </div>
                                    <button onClick={() => handleDeletePriority(pri.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <form onSubmit={handleAddPriority} className="flex gap-2">
                            <input
                                type="text"
                                value={newPriority}
                                onChange={e => setNewPriority(e.target.value)}
                                placeholder="Name"
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <input
                                type="number"
                                value={newPriorityLevel}
                                onChange={e => setNewPriorityLevel(Number(e.target.value))}
                                placeholder="Lvl"
                                className="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <button type="submit" className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors">
                                <Plus size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        Security
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Protect your account with advanced authentication.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* TOTP Section */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                <Smartphone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h5 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    Two-Factor Authentication (TOTP)
                                    {hasTotp && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Enabled</span>}
                                </h5>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                                    Secure your account with an authenticator app (e.g., Google Authenticator).
                                </p>

                                {isTotpSetupOpen && (
                                    <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                                        <h6 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Setup 2FA</h6>
                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            <div className="bg-white p-2 rounded">
                                                {totpUri && <QRCodeSVG value={totpUri} size={128} />}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    1. Scan the QR code with your authenticator app.
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    2. Enter the verification code below:
                                                </p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={totpVerifyCode}
                                                        onChange={e => setTotpVerifyCode(e.target.value)}
                                                        placeholder="000000"
                                                        className="w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    />
                                                    <button onClick={handleVerifyTotp} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
                                                        Verify
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono break-all">Secret: {totpSecret}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsTotpSetupOpen(false)} className="mt-4 text-xs text-gray-500 hover:text-gray-700 underline">
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            {!hasTotp ? (
                                !isTotpSetupOpen && (
                                    <button onClick={handleStartTotpSetup} className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        Setup
                                    </button>
                                )
                            ) : (
                                <button onClick={handleDisableTotp} className="px-4 py-2 border border-red-300 dark:border-red-900/50 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                    Disable
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6 flex items-center justify-between">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                <Key className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h5 className="text-base font-medium text-gray-900 dark:text-white">Passkeys</h5>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Log in securely without a password using your device (FaceID, TouchID).
                                </p>
                            </div>
                        </div>
                        <button onClick={handleRegisterPasskey} className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Register New Passkey
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
