import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const api = useApi();
    const [user, setUser] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '', github: '', linkedin: '', leetcode: ''
    });

    useEffect(() => {
        api.get('/api/v2/users/me').then(res => {
            setUser(res.data);
            setFormData({
                name: res.data.name || '',
                github: res.data.github || '',
                linkedin: res.data.linkedin || '',
                leetcode: res.data.leetcode || ''
            });
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/api/v2/users/me', formData);
            toast.success("Profile Updated!");
        } catch (err) {
            toast.error("Failed to update profile");
        }
        setSaving(false);
    };

    if (!user) return <div className="p-8 text-white text-center">Loading Profile...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

            <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0F1729] border border-[#1e3a5f] rounded-lg px-4 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Roll Number / ID</label>
                        <input type="text" value={user.userId} disabled className="w-full bg-[#0F1729]/50 border border-[#1e3a5f]/50 text-slate-500 rounded-lg px-4 py-2 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                        <input type="text" value={user.email} disabled className="w-full bg-[#0F1729]/50 border border-[#1e3a5f]/50 text-slate-500 rounded-lg px-4 py-2 cursor-not-allowed" />
                    </div>
                </div>
            </div>

            <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">Professional Links</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">GitHub URL</label>
                        <input type="url" placeholder="https://github.com/yourusername" value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} className="w-full bg-[#0F1729] border border-[#1e3a5f] rounded-lg px-4 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">LinkedIn URL</label>
                        <input type="url" placeholder="https://linkedin.com/in/yourusername" value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} className="w-full bg-[#0F1729] border border-[#1e3a5f] rounded-lg px-4 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">LeetCode URL</label>
                        <input type="url" placeholder="https://leetcode.com/yourusername" value={formData.leetcode} onChange={e => setFormData({...formData, leetcode: e.target.value})} className="w-full bg-[#0F1729] border border-[#1e3a5f] rounded-lg px-4 py-2 text-white" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}