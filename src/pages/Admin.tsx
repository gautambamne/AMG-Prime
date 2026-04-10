import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signOut, User as FirebaseUser } from 'firebase/auth';
import {
  LayoutDashboard, Film, Users, Settings, Plus, Trash2, ArrowLeft, LogOut, Video,
  Activity, Eye, TrendingUp, BookOpen, Calendar, CreditCard, Bell, FileText,
  Upload, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FirestoreService, Video as IVideo } from '../lib/firestore-service';
import { ToastType } from '../components/Toast';

const AdminPanel = ({ user, isAdmin, authLoading, showToast, allUsers = [] }: { 
  user: FirebaseUser | null, 
  isAdmin: boolean, 
  authLoading: boolean, 
  showToast?: (m: string, t: ToastType) => void,
  allUsers?: any[] 
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [articles, setArticles] = useState<any[]>([]);
  const [magazines, setMagazines] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [newArticle, setNewArticle] = useState({ title: "", category: "Health News", content: "", thumbnail: "" });
  const [newMagazine, setNewMagazine] = useState({ title: "", type: "Main", issueDate: new Date().toISOString().slice(0, 7), pdfUrl: "", thumbnail: "" });
  const [newEvent, setNewEvent] = useState({ title: "", date: "", location: "", description: "", thumbnail: "" });
  const [newVideo, setNewVideo] = useState({ title: "", category: "Healthcare News", youtubeId: "", thumbnail: "", isPremium: false });
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [notifications, setNotifications] = useState({ title: "", body: "", topic: "all" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleFileUpload = async (file: File, folder: string, fieldName: string) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [fieldName]: progress }));
        },
        (error) => {
          showToast?.("Upload failed", "error");
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fieldName];
              return newProgress;
            });
            resolve(downloadURL);
          });
        }
      );
    });
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }

    const vQ = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const vUnsub = onSnapshot(vQ, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IVideo)));
    });

    const aQ = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const aUnsub = onSnapshot(aQ, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const mQ = query(collection(db, "magazines"), orderBy("createdAt", "desc"));
    const mUnsub = onSnapshot(mQ, (snapshot) => {
      setMagazines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const eQ = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const eUnsub = onSnapshot(eQ, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      vUnsub(); aUnsub(); mUnsub(); eUnsub();
    };
  }, [user, isAdmin, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-zinc-400 mb-8">
            You don't have administrative privileges to access this area.
            If you believe this is an error, please contact support.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-zinc-100 text-black py-3 rounded-xl font-semibold hover:bg-white transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const handlePublish = async (type: string, data: any, resetter: () => void) => {
    setIsPublishing(true);
    try {
      if (editingId) {
        await FirestoreService.publishContent(type, data, editingId);
        setEditingId(null);
      } else {
        await FirestoreService.publishContent(type, data);
      }
      resetter();
      showToast?.(`${type.charAt(0).toUpperCase() + type.slice(1)} ${editingId ? 'updated' : 'published'}!`, "success");
    } catch (error) {
      showToast?.(`Failed to process ${type}`, "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      try {
        await FirestoreService.deleteContent(type, id);
        showToast?.("Deleted successfully", "success");
      } catch (error) {
        showToast?.("Delete failed", "error");
      }
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications)
      });
      if (response.ok) {
        showToast?.("Broadcast sent!", "success");
        setNotifications({ title: "", body: "", topic: "all" });
      } else {
        throw new Error("Broadcast failed");
      }
    } catch (error) {
      showToast?.("Broadcast failed", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium text-sm">Videos</h3>
            <Film className="w-5 h-5 text-brand" />
          </div>
          <p className="text-3xl font-bold text-white">{videos.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium text-sm">Articles</h3>
            <FileText className="w-5 h-5 text-brand" />
          </div>
          <p className="text-3xl font-bold text-white">{articles.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium text-sm">Magazines</h3>
            <BookOpen className="w-5 h-5 text-brand" />
          </div>
          <p className="text-3xl font-bold text-white">{magazines.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium text-sm">Events</h3>
            <Calendar className="w-5 h-5 text-brand" />
          </div>
          <p className="text-3xl font-bold text-white">{events.length}</p>
        </div>
        <div className="bg-zinc-900 border border-brand/10 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium text-sm">Total Users</h3>
            <Users className="w-5 h-5 text-brand" />
          </div>
          <p className="text-3xl font-bold text-white">{allUsers.length}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mt-8 mb-4">Recent Content</h3>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-950 text-zinc-300 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {videos.slice(0, 3).map(v => (
              <tr key={v.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4"><span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-[10px] font-bold">VIDEO</span></td>
                <td className="px-6 py-4 text-white font-medium">{v.title}</td>
                <td className="px-6 py-4 text-xs">Recently</td>
              </tr>
            ))}
            {articles.slice(0, 3).map(a => (
              <tr key={a.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4"><span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-[10px] font-bold">ARTICLE</span></td>
                <td className="px-6 py-4 text-white font-medium">{a.title}</td>
                <td className="px-6 py-4 text-xs">Recently</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">Video Content</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
            <h3 className="font-bold text-white">Published Videos</h3>
            <span className="text-xs text-zinc-400">{videos.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-950/50 text-zinc-300 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">Video</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {videos.map(v => (
                  <tr key={v.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img src={v.thumbnail} alt="" className="w-12 h-8 object-cover rounded" referrerPolicy="no-referrer" />
                      <span className="text-white font-medium line-clamp-1">{v.title}</span>
                    </td>
                    <td className="px-4 py-3">{v.category}</td>
                    <td className="px-4 py-3">
                      {v.isPremium ? (
                        <span className="bg-brand/10 text-brand px-2 py-0.5 rounded text-[10px] font-bold">Premium</span>
                      ) : (
                        <span className="bg-zinc-700 text-white px-2 py-0.5 rounded text-[10px] font-bold">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button onClick={() => {
                        setEditingId(v.id);
                        setNewVideo({ title: v.title, category: v.category, youtubeId: v.youtubeId, thumbnail: v.thumbnail, isPremium: v.isPremium || false });
                      }} className="text-zinc-400 hover:text-white transition-colors p-1">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('videos', v.id)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit sticky top-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand" /> {editingId ? 'Edit Video' : 'Add Video'}
          </h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            handlePublish('videos', { ...newVideo, thumbnail: newVideo.thumbnail || `https://picsum.photos/seed/${Date.now()}/800/450` }, () => setNewVideo({ title: "", category: "Healthcare News", youtubeId: "", thumbnail: "", isPremium: false }));
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Title</label>
              <input type="text" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white outline-none" placeholder="Video title" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Category</label>
              <select value={newVideo.category} onChange={e => setNewVideo({ ...newVideo, category: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white outline-none">
                <option>Healthcare News</option>
                <option>Medical Technology</option>
                <option>AI in Healthcare</option>
                <option>Hospital Leadership</option>
                <option>Shorts</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">YouTube ID</label>
              <input type="text" value={newVideo.youtubeId} onChange={e => setNewVideo({ ...newVideo, youtubeId: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white outline-none" placeholder="dQw4w9WgXcQ" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Thumbnail Image</label>
              <div className="flex flex-col gap-2">
                <input type="file" accept="image/*" onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await handleFileUpload(e.target.files[0], 'thumbnails', 'videoThumb');
                    setNewVideo({ ...newVideo, thumbnail: url });
                  }
                }} className="text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand file:text-black hover:file:bg-brand/80 cursor-pointer" />
                {uploadProgress.videoThumb !== undefined && (
                  <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-brand h-full transition-all" style={{ width: `${uploadProgress.videoThumb}%` }} />
                  </div>
                )}
                {newVideo.thumbnail && <p className="text-[10px] text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded successfully</p>}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input type="checkbox" checked={newVideo.isPremium} onChange={e => setNewVideo({ ...newVideo, isPremium: e.target.checked })} className="w-4 h-4 accent-brand border-zinc-800" />
              <span className="text-sm text-zinc-300">Premium Content</span>
            </label>
            <button type="submit" disabled={isPublishing} className="w-full bg-brand text-black py-2.5 rounded font-bold hover:bg-brand/90 mt-4 disabled:opacity-50 transition-all active:scale-[0.98]">
              {isPublishing ? 'Processing...' : (editingId ? 'Update Video' : 'Publish Video')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setNewVideo({ title: "", category: "Healthcare News", youtubeId: "", thumbnail: "", isPremium: false }); }}
                className="w-full bg-zinc-800 text-white py-2 rounded text-xs mt-2"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  const renderArticles = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">News Articles</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-950/50 text-zinc-300 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Article</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {articles.map(a => (
                <tr key={a.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button onClick={() => {
                      setEditingId(a.id);
                      setNewArticle({ title: a.title, category: a.category, content: a.content, thumbnail: a.thumbnail });
                    }} className="text-zinc-400 hover:text-white transition-colors p-1">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete('articles', a.id)} className="text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && <tr><td colSpan={2} className="p-8 text-center">No articles yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
          <h3 className="text-lg font-bold text-white mb-6">{editingId ? 'Edit Article' : 'Write Article'}</h3>
          <form onSubmit={(e) => { e.preventDefault(); handlePublish('articles', { ...newArticle, thumbnail: newArticle.thumbnail || `https://picsum.photos/seed/${Date.now()}/800/450` }, () => setNewArticle({ title: "", category: "Health News", content: "", thumbnail: "" })) }} className="space-y-4">
            <input type="text" value={newArticle.title} onChange={e => setNewArticle({ ...newArticle, title: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white" placeholder="Article Title" required />
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-400 mb-1">Featured Image</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await handleFileUpload(e.target.files[0], 'articles', 'articleThumb');
                  setNewArticle({ ...newArticle, thumbnail: url });
                }
              }} className="text-xs text-zinc-400 cursor-pointer" />
              {uploadProgress.articleThumb !== undefined && <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-brand h-full" style={{ width: `${uploadProgress.articleThumb}%` }} /></div>}
            </div>
            <textarea value={newArticle.content} onChange={e => setNewArticle({ ...newArticle, content: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white h-32" placeholder="Full Article Content" required />
            <button type="submit" disabled={isPublishing} className="w-full bg-brand text-black py-2.5 rounded font-bold">
              {isPublishing ? 'Processing...' : (editingId ? 'Update Article' : 'Publish Article')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setNewArticle({ title: "", category: "Health News", content: "", thumbnail: "" }); }}
                className="w-full bg-zinc-800 text-white py-2 rounded text-xs mt-2"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  const renderMagazines = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Magazine Issues</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-950/50 text-zinc-300 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Magazine</th>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {magazines.map(m => (
                <tr key={m.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{m.title}</td>
                  <td className="px-4 py-3">{m.issueDate}</td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button onClick={() => {
                      setEditingId(m.id);
                      setNewMagazine({ title: m.title, type: m.type, issueDate: m.issueDate, pdfUrl: m.pdfUrl, thumbnail: m.thumbnail });
                    }} className="text-zinc-400 hover:text-white transition-colors p-1">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete('magazines', m.id)} className="text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
          <h3 className="text-lg font-bold text-white mb-6">{editingId ? 'Edit Issue' : 'Upload Issue'}</h3>
          <form onSubmit={(e) => { e.preventDefault(); handlePublish('magazines', { ...newMagazine, thumbnail: newMagazine.thumbnail || `https://picsum.photos/seed/${Date.now()}/300/400` }, () => setNewMagazine({ title: "", type: "Main", issueDate: new Date().toISOString().slice(0, 7), pdfUrl: "", thumbnail: "" })) }} className="space-y-4">
            <input type="text" value={newMagazine.title} onChange={e => setNewMagazine({ ...newMagazine, title: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white" placeholder="Issue Title" required />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Type</label>
                <select value={newMagazine.type} onChange={e => setNewMagazine({ ...newMagazine, type: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white">
                  <option>Main</option>
                  <option>Global</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Issue Month</label>
                <input type="month" value={newMagazine.issueDate} onChange={e => setNewMagazine({ ...newMagazine, issueDate: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white" required />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Cover Image</label>
                <input type="file" accept="image/*" onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await handleFileUpload(e.target.files[0], 'magazines/covers', 'magThumb');
                    setNewMagazine({ ...newMagazine, thumbnail: url });
                  }
                }} className="text-xs text-zinc-400" />
                {uploadProgress.magThumb !== undefined && <div className="w-full bg-zinc-800 h-1 mt-1 rounded-full overflow-hidden"><div className="bg-brand h-full" style={{ width: `${uploadProgress.magThumb}%` }} /></div>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">PDF File / Flipbook Content</label>
                <input type="file" accept="application/pdf" onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await handleFileUpload(e.target.files[0], 'magazines/pdfs', 'magPdf');
                    setNewMagazine({ ...newMagazine, pdfUrl: url });
                  }
                }} className="text-xs text-zinc-400" />
                {uploadProgress.magPdf !== undefined && <div className="w-full bg-zinc-800 h-1 mt-1 rounded-full overflow-hidden"><div className="bg-brand h-full" style={{ width: `${uploadProgress.magPdf}%` }} /></div>}
              </div>
            </div>
            <div className="pt-2">
              <p className="text-[10px] text-zinc-500 mb-2">Or enter a manual URL:</p>
              <input type="url" value={newMagazine.pdfUrl} onChange={e => setNewMagazine({ ...newMagazine, pdfUrl: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-1.5 text-xs text-white" placeholder="https://..." />
            </div>
            <button type="submit" disabled={isPublishing} className="w-full bg-brand text-black py-2.5 rounded font-bold">
              {isPublishing ? 'Processing...' : (editingId ? 'Update Issue' : 'Publish Issue')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setNewMagazine({ title: "", type: "Main", issueDate: new Date().toISOString().slice(0, 7), pdfUrl: "", thumbnail: "" }); }}
                className="w-full bg-zinc-800 text-white py-2 rounded text-xs mt-2"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Events & Conferences</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-950/50 text-zinc-300 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {events.map(e => (
                <tr key={e.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{e.title}</td>
                  <td className="px-4 py-3">{e.date}</td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button onClick={() => {
                      setEditingId(e.id);
                      setNewEvent({ title: e.title, date: e.date, location: e.location, description: e.description, thumbnail: e.thumbnail });
                    }} className="text-zinc-400 hover:text-white transition-colors p-1">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete('events', e.id)} className="text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
          <h3 className="text-lg font-bold text-white mb-6">{editingId ? 'Edit Event' : 'Create Event'}</h3>
          <form onSubmit={(e) => { e.preventDefault(); handlePublish('events', { ...newEvent, thumbnail: newEvent.thumbnail || `https://picsum.photos/seed/${Date.now()}/800/450` }, () => setNewEvent({ title: "", date: "", location: "", description: "", thumbnail: "" })) }} className="space-y-4">
            <input type="text" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white" placeholder="Event Name" required />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white" required />
              <input type="text" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white" placeholder="Location" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-400 mb-1">Banner Image</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await handleFileUpload(e.target.files[0], 'events', 'eventThumb');
                  setNewEvent({ ...newEvent, thumbnail: url });
                }
              }} className="text-xs text-zinc-400 cursor-pointer" />
              {uploadProgress.eventThumb !== undefined && <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-brand h-full" style={{ width: `${uploadProgress.eventThumb}%` }} /></div>}
            </div>
            <textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white h-24" placeholder="Description" required />
            <button type="submit" disabled={isPublishing} className="w-full bg-brand text-black py-2.5 rounded font-bold">
              {isPublishing ? 'Processing...' : (editingId ? 'Update Event' : 'Create Event')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setNewEvent({ title: "", date: "", location: "", description: "", thumbnail: "" }); }}
                className="w-full bg-zinc-800 text-white py-2 rounded text-xs mt-2"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">User Management</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
          <h3 className="font-bold text-white">Registered Users</h3>
          <span className="text-xs text-zinc-400">Admin Console Only</span>
        </div>
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-950/50 text-zinc-300 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {allUsers.length > 0 ? (
              allUsers.map((u, i) => (
                <tr key={u.id || i} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold">
                      {u.displayName?.charAt(0) || u.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-white font-medium">{u.displayName || 'Unnamed User'}</span>
                  </td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4 text-xs font-bold">
                    <span className={`px-2 py-1 rounded ${u.role === 'admin' ? 'bg-brand/20 text-brand' : 'bg-zinc-800 text-zinc-400'}`}>
                      {u.role?.toUpperCase() || 'USER'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${u.lastLogin ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></span>
                    <span className={u.lastLogin ? 'text-green-500' : 'text-zinc-500'}>
                      {u.lastLogin ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-zinc-500 italic">
                  No users found in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Subscriptions</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <CreditCard className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Manual Subscription Control</h3>
        <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">User subscription status can be managed via Firestore claims. Future integration with Stripe/Razorpay goes here.</p>
        <div className="p-4 bg-zinc-950 rounded-lg inline-block text-left">
          <p className="text-xs text-zinc-500 mb-2">Current Plans:</p>
          <ul className="text-sm text-zinc-300 space-y-1">
            <li>• Monthly Premium: ₹299</li>
            <li>• Yearly Premium: ₹1,999</li>
            <li>• Corporate Pass: Custom</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Broadcast Notifications</h2>
      <div className="max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">Title</label>
            <input type="text" value={notifications.title} onChange={e => setNotifications({ ...notifications, title: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white" placeholder="Breaking News!" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">Message Body</label>
            <textarea value={notifications.body} onChange={e => setNotifications({ ...notifications, body: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white h-24" placeholder="New digital issue is now available..." required />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">Target Topic</label>
            <select value={notifications.topic} onChange={e => setNotifications({ ...notifications, topic: e.target.value })} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 text-white">
              <option value="all">All Users</option>
              <option value="premium">Premium Only</option>
              <option value="newsletter">Newsletter Subscribers</option>
            </select>
          </div>
          <button type="submit" disabled={isPublishing} className="w-full bg-brand text-black py-3 rounded font-bold hover:bg-brand/90 transition-colors flex items-center justify-center gap-2">
            <Bell className="w-4 h-4" /> Send Broadcast
          </button>
        </form>
      </div>
    </div>
  );


  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Platform Settings</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Platform Name</label>
            <input type="text" defaultValue="AMG Prime" className="w-full bg-black border border-zinc-800 rounded px-4 py-2.5 text-white focus:border-brand outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Support Email</label>
            <input type="email" defaultValue="support@amgprime.com" className="w-full bg-black border border-zinc-800 rounded px-4 py-2.5 text-white focus:border-brand outline-none" />
          </div>
          <div className="pt-4 border-t border-zinc-800">
            <button className="bg-brand text-black px-6 py-2.5 rounded font-bold hover:bg-brand/90 transition-colors">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-900">
          <Link to="/" className="flex flex-col leading-none">
            <span className="text-2xl font-bold text-white tracking-tighter">news</span>
            <span className="text-[10px] text-brand font-bold tracking-widest uppercase">AMG Prime Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('content')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'content' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Video className="w-5 h-5" /> Content
          </button>
          <button onClick={() => setActiveTab('articles')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'articles' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <FileText className="w-5 h-5" /> Articles
          </button>
          <button onClick={() => setActiveTab('magazines')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'magazines' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <BookOpen className="w-5 h-5" /> Magazines
          </button>
          <button onClick={() => setActiveTab('events')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Calendar className="w-5 h-5" /> Events
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Users className="w-5 h-5" /> Users
          </button>
          <button onClick={() => setActiveTab('subscriptions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'subscriptions' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <CreditCard className="w-5 h-5" /> Subscriptions
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Settings className="w-5 h-5" /> Settings
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-900 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to App
          </Link>
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-background">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'content' && renderContent()}
          {activeTab === 'articles' && renderArticles()}
          {activeTab === 'magazines' && renderMagazines()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'subscriptions' && renderSubscriptions()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
