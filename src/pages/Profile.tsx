import React, { useState } from 'react';
import { User, CreditCard, Bell, Settings, LogOut, Shield, CheckCircle2, Bookmark, Download, Zap } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut, User as FirebaseUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

const ProfilePage = ({ user, isPremium }: { user: FirebaseUser | null, isPremium: boolean }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="pt-32 min-h-screen flex flex-col items-center justify-center text-center px-4">
        <User className="w-16 h-16 text-zinc-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
        <p className="text-zinc-400 mb-6">Please sign in to manage your profile and subscriptions.</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await setDoc(doc(db, "users", user.uid), {
        isPremium: true,
        role: "user"
      }, { merge: true });
      alert("Successfully upgraded to Premium!");
      setActiveTab('subscription');
    } catch (error) {
      console.error("Error upgrading:", error);
      alert("Failed to upgrade. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 md:pt-28 pb-20 min-h-screen max-w-6xl mx-auto px-4 md:px-12">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">Account Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <User className="w-5 h-5" /> Profile Info
          </button>
          <button onClick={() => setActiveTab('subscription')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'subscription' || activeTab === 'upgrade' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <CreditCard className="w-5 h-5" /> Subscription
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Shield className="w-5 h-5" /> Security
          </button>
          <div className="pt-4 mt-4 border-t border-zinc-800 space-y-2">
            <button onClick={() => navigate('/bookmarks')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
              <Bookmark className="w-5 h-5" /> My List
            </button>
            <button onClick={() => navigate('/downloads')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
              <Download className="w-5 h-5" /> Downloads
            </button>
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-400 overflow-hidden">
                  {user.photoURL ? <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" /> : (user.displayName?.charAt(0) || 'U')}
                </div>
                <button className="bg-zinc-800 text-white px-4 py-2 rounded text-sm font-bold hover:bg-zinc-700 transition-colors">Change Avatar</button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Full Name</label>
                  <input type="text" defaultValue={user.displayName || ''} className="w-full bg-black border border-zinc-800 rounded px-4 py-2.5 text-white focus:border-brand outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Email Address</label>
                  <input type="email" defaultValue={user.email || ''} disabled className="w-full bg-black/50 border border-zinc-800 rounded px-4 py-2.5 text-zinc-500 cursor-not-allowed" />
                </div>
                <button className="bg-brand text-black px-6 py-2.5 rounded font-bold hover:bg-brand/90 transition-colors mt-4">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-8 max-w-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Subscription Management</h2>
              
              {isPremium ? (
                <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-brand/30 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-brand text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">ACTIVE</div>
                  <h3 className="text-2xl font-bold text-white mb-1">Premium Annual</h3>
                  <p className="text-zinc-400 text-sm mb-6">You have unrestricted access to all content.</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <button className="bg-white text-black px-6 py-2 rounded font-bold hover:bg-zinc-200 transition-colors text-sm">Manage Plan</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 text-center">
                    <Zap className="w-12 h-12 text-brand mx-auto mb-4 fill-current" />
                    <h3 className="text-xl font-bold text-white mb-2">Upgrade to AMG Prime Premium</h3>
                    <p className="text-zinc-400 text-sm mb-6">Get access to exclusive web series, documentaries, and ad-free experience.</p>
                    <button onClick={() => setActiveTab('upgrade')} className="bg-brand text-black font-bold py-3 px-8 rounded hover:bg-brand/90 transition-all">
                      View Plans
                    </button>
                  </div>
                </div>
              )}

              {isPremium && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Payment Methods</h3>
                  <div className="flex items-center justify-between bg-black border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-zinc-800 rounded flex items-center justify-center text-xs font-bold text-zinc-500">VISA</div>
                      <div>
                        <p className="text-white font-medium text-sm">•••• •••• •••• 4242</p>
                        <p className="text-zinc-500 text-xs">Expires 12/28</p>
                      </div>
                    </div>
                    <button className="text-brand text-sm font-bold hover:text-brand/80">Edit</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upgrade' && (
            <div className="space-y-8">
               <h2 className="text-xl font-bold text-white mb-6">Choose Your Plan</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-1">Monthly</h3>
                    <div className="text-2xl font-bold text-brand mb-4">₹199<span className="text-xs text-zinc-400 font-normal ml-1">/ month</span></div>
                    <ul className="text-sm text-zinc-300 space-y-3 mb-8 flex-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> All Premium Content</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> 1080p Streaming</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> 2 Devices</li>
                    </ul>
                    <button 
                      disabled={loading}
                      onClick={handleUpgrade}
                      className="w-full bg-brand text-black font-bold py-2.5 rounded hover:bg-brand/90 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Get Started"}
                    </button>
                  </div>
                  <div className="bg-zinc-800 border-2 border-brand rounded-xl p-6 flex flex-col relative">
                    <div className="absolute top-0 right-0 bg-brand text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">BEST VALUE</div>
                    <h3 className="text-lg font-bold text-white mb-1">Annual</h3>
                    <div className="text-2xl font-bold text-brand mb-4">₹1,499<span className="text-xs text-zinc-400 font-normal ml-1">/ year</span></div>
                    <ul className="text-sm text-zinc-300 space-y-3 mb-8 flex-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> Everything in Monthly</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> 4K Streaming</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> 4 Devices</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> Offline Downloads</li>
                    </ul>
                    <button 
                      disabled={loading}
                      onClick={handleUpgrade}
                      className="w-full bg-brand text-black font-bold py-2.5 rounded hover:bg-brand/90 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Get Started"}
                    </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-xl font-bold text-white mb-6">Push Notifications</h2>
              <div className="space-y-4">
                {[
                  { title: "Breaking News Alerts", desc: "Get notified immediately about major healthcare news." },
                  { title: "New Video Releases", desc: "Alerts when new documentaries or interviews are published." },
                  { title: "Event Announcements", desc: "Updates on upcoming summits and conferences." },
                  { title: "Magazine Updates", desc: "Know when a new issue of Medgate Today is available." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between py-3 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="text-white font-medium text-sm">{item.title}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                      <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
