import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { UserPlus, HeartHandshake, ArrowRight } from 'lucide-react';

export default function JoinPage() {
  const [activeTab, setActiveTab] = useState<'visitor' | 'member'>('visitor');
  const pageHeroImage = new URL('../../images/rcf-hero1.jpeg', import.meta.url).href;

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', department: '', interests: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      if (activeTab === 'visitor') {
        const { doc, setDoc } = await import('firebase/firestore');
        const docRef = doc(collection(db, 'visitors'));
        await setDoc(docRef, { ...formData, major: formData.department, createdAt: new Date().toISOString() });
      } else {
        await addDoc(collection(db, 'registrations'), { ...formData, type: 'member', createdAt: new Date().toISOString() });
      }
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', department: '', interests: '' });
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight sm:text-5xl">Join the Family</h1>
          <p className="mt-4 text-xl text-slate-500">Whether you're visiting or ready to put down roots, we want to know you!</p>
        </div>
        <div className="relative mb-10 h-48 overflow-hidden rounded-2xl border border-slate-200 shadow-sm sm:h-56">
          <img src={pageHeroImage} alt="Join RCF FUL" className="h-full w-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-900/35 to-blue-900/20" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setActiveTab('visitor'); setStatus('idle'); }}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'visitor' ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <HeartHandshake className="w-5 h-5" />
              I am a Visitor
            </button>
            <button
              onClick={() => { setActiveTab('member'); setStatus('idle'); }}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'member' ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-900' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <UserPlus className="w-5 h-5" />
              Become a Member
            </button>
          </div>

          <div className="p-8">
            {status === 'success' ? (
              <div className="text-center py-16">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${activeTab === 'visitor' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-900'}`}>
                  <HeartHandshake className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Thank you for connecting!</h3>
                <p className="text-slate-600 mb-6">
                  {activeTab === 'visitor' 
                    ? "We're so glad you visited us. A member of our follow-up team will reach out to you shortly to welcome you properly!"
                    : "Welcome to the family! We've received your registration and our foundational class coordinator will be in touch with next steps."}
                </p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="text-blue-900 font-semibold hover:underline"
                >
                  Submit another response
                </button>
              </div>
            ) : (
              <div>
                <p className="text-slate-500 mb-6 text-sm">
                  {activeTab === 'visitor' 
                    ? "Fill this out to help us welcome and follow up with you. We'd love to drop off a welcome package!" 
                    : "Ready to commit? Fill out the membership form to get integrated into a unit and start your foundational classes."}
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name *</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Department/Major *</label>
                      <input type="text" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900" placeholder="e.g. Engineering" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email Address *</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900" placeholder="john@student.edu" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Phone Number</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>

                  {activeTab === 'member' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Areas of Interest / Unit preference</label>
                      <textarea rows={3} value={formData.interests} onChange={e => setFormData({...formData, interests: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 resize-none" placeholder="E.g. Choir, Ushering, Media, Prayer Squad..."></textarea>
                    </div>
                  )}
                  {activeTab === 'visitor' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">How did you hear about us?</label>
                      <input type="text" value={formData.interests} onChange={e => setFormData({...formData, interests: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900" placeholder="A friend, Social Media, Flyer..." />
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className={`w-full py-3.5 px-4 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''} ${activeTab === 'visitor' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white'}`}
                  >
                    {status === 'loading' ? 'Submitting...' : (activeTab === 'visitor' ? 'Connect With Us' : 'Register as Member')}
                    {!status && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>

                {activeTab === 'visitor' && (
                  <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-800 text-sm mb-2">Visitor Follow-Up Process</h4>
                    <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside marker:text-amber-600 marker:font-bold">
                      <li>You'll receive a welcome packet with our weekly schedule.</li>
                      <li>A follow-up team member will call to check in and pray with you.</li>
                      <li>You'll be invited to an exclusive "Meet the Leaders" Sunday after-service hangout.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
