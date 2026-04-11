import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Search, Menu, X, ChevronRight, Settings, LogOut, User, Volume2, VolumeX, Play, Info,
  Home, Zap, Download, Bookmark, Share2, ArrowLeft, Cast, MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, extractYoutubeId } from "@/src/lib/utils";
import { auth, db } from "./firebase";
import { signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, doc, getDoc, deleteDoc } from "firebase/firestore";

import AdminPanel from "./pages/Admin";
import LiveTVPage from "./pages/LiveTV";
import SeriesPage from "./pages/Series";
import SearchPage from "./pages/Search";
import DownloadsPage from "./pages/Downloads";
import BookmarksPage from "./pages/Bookmarks";
import MagazinesPage from "./pages/Magazines";
import EventsPage from "./pages/Events";
import ProfilePage from "./pages/Profile";

import AuthModal from "./components/AuthModal";
import ErrorBoundary from "./components/ErrorBoundary";
import { VideoCardSkeleton } from "./components/Skeleton";
import Toast, { ToastType } from "./components/Toast";
import { FirestoreService, Video } from "./lib/firestore-service";

// --- Types ---
interface ContentItem {
  id: string;
  title: string;
  thumbnail: string;
  badge?: string;
  isPremium?: boolean;
  youtubeId?: string;
}

// --- Components ---

const BottomNav = () => {
  const location = useLocation();
  const navs = [
    { name: "Home", path: "/", icon: Home },
    { name: "Search", path: "/search", icon: Search },
    { name: "Shorts", path: "/shorts", icon: Zap },
    { name: "Downloads", path: "/downloads", icon: Download },
    { name: "Bookmarks", path: "/bookmarks", icon: Bookmark },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/5 flex justify-between items-center px-6 py-2.5 z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {navs.map(nav => {
        const isActive = location.pathname === nav.path;
        return (
          <Link key={nav.path} to={nav.path} onClick={(e) => { if (nav.path !== '/' && !auth.currentUser) { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-auth-modal')); } }} className={cn("flex flex-col items-center gap-1 transition-all duration-300", isActive ? "scale-110" : "opacity-60")}>
            <div className={cn("p-1.5 rounded-xl transition-all", isActive ? "bg-brand/10" : "")}>
              <nav.icon className={cn("w-5 h-5", isActive ? "text-brand fill-brand/20" : "text-white")} />
            </div>
            <span className={cn("text-[8px] font-bold tracking-tighter uppercase", isActive ? "text-brand" : "text-white")}>{nav.name}</span>
          </Link>
        )
      })}
    </div>
  )
};

const ContinueWatchingRow = ({ items = [], onRemove }: { items?: any[], onRemove?: (id: string) => void }) => {
  const navigate = useNavigate();
  if (items.length === 0) return null;

  return (
    <div className="mb-4 md:mb-8 max-w-7xl mx-auto">
      <h2 className="text-lg md:text-xl font-bold text-white tracking-tight mb-3 px-4 md:px-12">Continue Watching</h2>
      <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 snap-x snap-mandatory py-6 -my-6">
        {items.map(item => (
          <div key={item.id} onClick={(e) => { e.stopPropagation(); if (!auth.currentUser) window.dispatchEvent(new CustomEvent('open-auth-modal')); else navigate(`/watch/${item.id}`); }} className="relative shrink-0 snap-start w-64 md:w-80 rounded overflow-hidden bg-zinc-900 group cursor-pointer card-hover border border-white/5">
            <div className="aspect-video relative">
              <img src={item.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />

              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove?.(item.id); }}
                className="absolute top-2 left-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-black z-20"
              >
                <X className="w-3 h-3" />
              </button>
              {item.isPremium && <div className="absolute top-0 right-0 bg-brand text-black text-[9px] font-bold px-2 py-0.5 rounded-bl z-10">Premium</div>}
              <div className="absolute bottom-2 left-2 text-white text-[10px] font-bold drop-shadow-md z-10">{item.timeLeft}</div>
            </div>
            <div className="h-1 w-full bg-zinc-800">
              <div className="h-full bg-brand" style={{ width: `${item.progress}%` }} />
            </div>
            <div className="p-3">
              <h3 className="text-white text-sm font-bold line-clamp-1">{item.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
};

const Navbar = ({ user, isAdmin }: { user: FirebaseUser | null, isAdmin: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
  }, []);

  const navItems = [
    { name: "HOME", path: "/" },
    { name: "LIVE TV", path: "/live" },
    { name: "WEB SERIES", path: "/series" },
    { name: "MAGAZINES", path: "/magazines" },
    { name: "EVENTS", path: "/events" },
    { name: "SHORTS", path: "/shorts" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-linear-to-b from-black/90 to-transparent transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-12 h-16 md:h-20 flex items-center justify-between">

          <button className="md:hidden text-white p-2 -ml-2" onClick={() => setIsOpen(!isOpen)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex flex-col leading-none items-center md:items-start">
                <span className="text-xl md:text-2xl font-bold text-white tracking-tighter">news</span>
                <span className="text-[8px] md:text-[10px] text-brand font-bold tracking-widest uppercase">AMG Prime</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={(e) => { if (item.path !== '/' && !auth.currentUser) { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-auth-modal')); } }} className={cn("text-xs font-semibold tracking-wider transition-colors hover:text-white", location.pathname === item.path ? "text-white" : "text-zinc-400")}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:hidden w-6 h-6 bg-brand rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm flex items-center justify-center text-black font-serif font-bold text-xl leading-none">,</div>

          <div className="hidden md:flex items-center gap-4 md:gap-6">
            <button className="hidden md:block bg-brand hover:bg-brand/90 text-black px-6 py-1.5 rounded text-sm font-bold transition-colors">
              Subscribe
            </button>
            <button className="text-zinc-300 hover:text-white transition-colors"><Search className="w-5 h-5" /></button>

            <div className="hidden md:flex items-center gap-4 border-l border-zinc-700 pl-4">
              {isAdmin && (
                <Link to="/admin" className="text-xs font-semibold tracking-wider text-zinc-300 hover:text-white transition-colors flex items-center gap-1">
                  <Settings className="w-4 h-4" /> ADMIN
                </Link>
              )}
              {user ? (
                <div className="flex items-center gap-4">
                  <Link to="/profile" className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 hover:border-brand transition-colors">
                    {user.photoURL ? <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" /> : <User className="w-4 h-4 text-zinc-400" />}
                  </Link>
                  <button onClick={() => signOut(auth)} className="border border-zinc-500 hover:border-white text-zinc-300 hover:text-white px-4 py-1.5 rounded text-xs font-bold transition-all">
                    SIGN OUT
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className="border border-zinc-500 hover:border-white text-zinc-300 hover:text-white px-4 py-1.5 rounded text-xs font-bold transition-all">
                  SIGN IN
                </button>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:hidden absolute top-16 left-0 right-0 bg-zinc-950 border-b border-zinc-900 p-4 space-y-4 shadow-2xl overflow-hidden">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={(e) => { if (item.path !== '/' && !auth.currentUser) { e.preventDefault(); setIsOpen(false); window.dispatchEvent(new CustomEvent('open-auth-modal')); } else { setIsOpen(false); } }} className="block text-sm font-semibold tracking-wider text-zinc-300 hover:text-white">
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-zinc-800 flex flex-col gap-4">
                <button className="bg-brand text-black px-6 py-2 rounded text-sm font-bold text-center">Subscribe</button>
                {isAdmin && <Link to="/admin" onClick={() => setIsOpen(false)} className="text-sm font-semibold tracking-wider text-zinc-300">Admin Panel</Link>}
                {user ? (
                  <button onClick={() => { signOut(auth); setIsOpen(false); }} className="border border-zinc-600 text-zinc-300 px-4 py-2 rounded text-sm font-bold text-center">Sign Out</button>
                ) : (
                  <button onClick={() => { setIsAuthModalOpen(true); setIsOpen(false); }} className="border border-zinc-600 text-zinc-300 px-4 py-2 rounded text-sm font-bold text-center">Sign In</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

const HeroBanner = ({ items = [] }: { items?: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] bg-zinc-900 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
           key={currentItem.id}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 1 }}
           className="absolute inset-0"
        >
          <img 
            src={currentItem.thumbnail} 
            alt={currentItem.title} 
            className="w-full h-full object-cover opacity-80" 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 ott-gradient" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 w-full pb-16 md:pb-28 z-10 flex justify-center">
        <div className="w-full max-w-7xl px-4 md:px-12 flex items-end justify-between">
          <div className="max-w-2xl w-full">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">{currentItem.title}</h1>
                <p className="text-base md:text-xl text-zinc-300 font-medium mb-6 drop-shadow-md">{currentItem.category || "EXCLUSIVE"}</p>
                <div className="flex items-center gap-3 md:gap-4">
                  <button onClick={(e) => { e.stopPropagation(); if (!auth.currentUser) window.dispatchEvent(new CustomEvent('open-auth-modal')); else navigate(`/watch/${currentItem.id}`); }} className="bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-zinc-200 transition-colors text-sm md:text-base">
                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> Play
                  </button>
                  <button className="bg-zinc-800/80 text-white px-4 md:px-6 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-zinc-700 transition-colors backdrop-blur-sm text-sm md:text-base">
                    <Info className="w-4 h-4 md:w-5 md:h-5" /> More Info
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setIsMuted(!isMuted)} className="w-10 h-10 rounded-full border border-zinc-500 flex items-center justify-center text-white hover:bg-white/10 transition-colors backdrop-blur-sm">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="bg-zinc-800/80 border-l-4 border-zinc-400 text-white px-4 py-1.5 text-sm font-bold backdrop-blur-sm">
              U/A 13+
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {items.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300", 
              i === currentIndex ? "bg-brand w-6" : "bg-zinc-600 hover:bg-zinc-400"
            )} 
          />
        ))}
      </div>
    </div>
  );
};


const ContentCard: React.FC<{ item: ContentItem, type: string }> = ({ item, type }) => {
  const navigate = useNavigate();

  const aspectClass =
    type === 'portrait' ? 'aspect-[2/3] w-32 md:w-44' :
      type === 'landscape' ? 'aspect-video w-64 md:w-80' :
        'aspect-square w-32 md:w-48';

  return (
    <div onClick={(e) => { e.stopPropagation(); if (!auth.currentUser) window.dispatchEvent(new CustomEvent('open-auth-modal')); else navigate(`/watch/${item.id}`); }} className={cn("relative shrink-0 snap-start rounded-xl overflow-hidden bg-zinc-900 group card-hover border border-white/5", aspectClass)}>
      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

      {item.isPremium && (
        <div className="absolute top-0 right-0 bg-brand text-black text-[9px] font-bold px-2 py-0.5 rounded-bl z-10">
          Premium
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full p-3 z-10">
        <h3 className="text-white text-xs md:text-sm font-bold line-clamp-2 leading-tight drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300">{item.title}</h3>
      </div>
    </div>
  );
};

const ContentRow: React.FC<{ title: string, items: ContentItem[], type: string }> = ({ title, items, type }) => {
  return (
    <div className="mb-4 md:mb-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-3 px-4 md:px-12">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">{title}</h2>
        <button className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center transition-colors">
          See all <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>
      <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 snap-x snap-mandatory py-6 -my-6">
        {items.map(item => (
          <ContentCard key={item.id} item={item} type={type} />
        ))}
      </div>
    </div>
  );
};

const EmptyStateView = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mb-8 relative">
        <Zap className="w-10 h-10 text-brand fill-brand/20 absolute animate-pulse" />
        <div className="absolute inset-0 border-2 border-brand/20 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Content is on the way</h2>
      <p className="text-zinc-400 max-w-md text-lg leading-relaxed mb-8">
        We're currently curating the latest healthcare news and exclusive interviews for you. Check back soon!
      </p>
      <div className="flex flex-col md:flex-row gap-4">
        <button onClick={() => window.location.reload()} className="bg-brand text-black px-8 py-3 rounded-full font-bold hover:bg-brand/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,183,0,0.3)]">
          Refresh Page
        </button>
        <Link to="/live" onClick={(e) => { if (!auth.currentUser) { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-auth-modal')); } }} className="border border-zinc-700 text-white px-8 py-3 rounded-full font-bold hover:bg-zinc-800 transition-all active:scale-95">
          Watch Live TV
        </Link>
      </div>
    </div>
  );
};

const HomePage = ({ dbVideos, dbArticles, videoProgress = [], onRemoveProgress }: { dbVideos: Video[], dbArticles: any[], videoProgress?: any[], onRemoveProgress?: (id: string) => void }) => {
  const categories: { [key: string]: ContentItem[] } = {};

  const allItems = [
    ...dbArticles.map(a => ({ ...a, type: 'article' })),
    ...dbVideos.map(v => ({ ...v, type: 'video' }))
  ];

  allItems.forEach((item: any) => {
    const cat = item.category || "General News";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      badge: item.type === 'video' ? 'VIDEO' : undefined,
      isPremium: item.isPremium || item.category === 'Series'
    });
  });

  if (allItems.length === 0) {
    return (
      <div className="pt-20">
        <EmptyStateView />
      </div>
    );
  }

  let continueWatchingItems = videoProgress
    .map(p => {
      const video = dbVideos.find(v => v.id === p.videoId);
      if (!video) return null;
      const totalDuration: number = p.totalDuration || 0;
      const watchedSeconds = Math.floor((p.progress / 100) * totalDuration);
      const remainingSeconds = Math.max(0, totalDuration - watchedSeconds);
      const remainingMins = Math.floor(remainingSeconds / 60);
      const remainingSecs = remainingSeconds % 60;
      const timeLeft = remainingMins > 0
        ? `${remainingMins}m ${remainingSecs}s left`
        : `${remainingSecs}s left`;
      return {
        ...video,
        progress: Math.round(p.progress),
        timeLeft
      };
    })
    .filter(Boolean);

  return (
    <div className="pb-20 overflow-x-hidden">
      <HeroBanner items={dbVideos.slice(0, 3)} />
      <div className="relative z-20 -mt-10 md:-mt-20 space-y-8 md:space-y-12">
        <ContinueWatchingRow items={continueWatchingItems} onRemove={onRemoveProgress} />
        {Object.entries(categories).map(([cat, items], idx) => (
          <ContentRow
            key={cat}
            title={cat}
            items={items}
            type={idx % 2 === 0 ? "portrait" : "landscape"}
          />
        ))}
      </div>
    </div>
  );
};


const ShortsPage = ({ dbShorts }: { dbShorts: Video[] }) => {
  return (
    <div className="fixed inset-0 bg-black z-40 md:pt-20 pb-16 md:pb-0">
      <div className="h-full w-full md:max-w-md md:mx-auto snap-y snap-mandatory overflow-y-scroll no-scrollbar">
        {dbShorts.length > 0 ? dbShorts.map(short => (
          <div key={short.id} className="h-full w-full snap-start relative flex items-center justify-center bg-black">
            <div className="absolute inset-0 bg-zinc-900 border-x border-zinc-800 flex items-center justify-center">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${short.youtubeId}?autoplay=1&loop=1&playlist=${short.youtubeId}&controls=0&modestbranding=1&rel=0`}
                title={short.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/20 to-transparent p-6 pt-20 pointer-events-none">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-black font-bold text-xs">P</div>
                <span className="text-white font-bold text-sm shadow-sm">Prime News</span>
              </div>
              <h3 className="text-white font-medium text-sm leading-snug drop-shadow-lg line-clamp-2">{short.title}</h3>
            </div>

            <div className="absolute right-3 bottom-20 flex flex-col gap-5">
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Share</span>
              </button>
            </div>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
            <Zap className="w-12 h-12 opacity-20" />
            <p>No shorts available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};


const WatchPage = ({
  dbVideos,
  user,
  isPremium,
  userBookmarks = [],
  userDownloads = [],
  onToggleBookmark,
  onToggleDownload
}: {
  dbVideos: Video[],
  user: FirebaseUser | null,
  isPremium: boolean,
  userBookmarks?: string[],
  userDownloads?: string[],
  onToggleBookmark?: (id: string) => void,
  onToggleDownload?: (id: string) => void
}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const video = dbVideos.find(v => v.id === id);

  if (!video) return <div className="pt-32 text-center text-white">Content not found</div>;

  const youtubeId = video.youtubeId || "dQw4w9WgXcQ";
  const isContentPremium = (video as any).isPremium || (video as any).category === 'Series' || (video as any).badge === 'EXCLUSIVE';

  const isBookmarked = id ? userBookmarks.includes(id) : false;
  const isDownloaded = id ? userDownloads.includes(id) : false;

  useEffect(() => {
    if (!video || !user || !id) return;

    let interval: any;
    let player: any;
    let isMounted = true;

    const initPlayer = async () => {
      // --- FETCH SAVED PROGRESS DIRECTLY FROM FIRESTORE ---
      // This avoids the race condition where the prop hasn't hydrated yet.
      let startSeconds = 0;
      try {
        const progressRef = doc(db, 'users', user.uid, 'progress', id);
        const progressSnap = await getDoc(progressRef);
        if (progressSnap.exists()) {
          const data = progressSnap.data();
          const savedProgress: number = data.progress || 0;
          const totalDuration: number = data.totalDuration || 0;
          if (totalDuration > 0) {
            const computed = Math.floor((savedProgress / 100) * totalDuration);
            // Only resume if not near the very end (last 10 seconds)
            startSeconds = computed > totalDuration - 10 ? 0 : computed;
          }
        }
      } catch (e) {
        console.warn('Could not load resume position:', e);
      }

      if (!isMounted) return;

      const onPlayerReady = (event: any) => {
        player = event.target;
        // `start` playerVar already handles it, but seekTo is a belt-and-suspenders backup
        if (startSeconds > 0) {
          player.seekTo(startSeconds, true);
        }
      };

      const onPlayerStateChange = (event: any) => {
        // YT.PlayerState.PLAYING = 1
        if (event.data === 1) {
          // Save progress every 5 seconds while playing
          interval = setInterval(async () => {
            if (player && player.getCurrentTime && player.getDuration) {
              const currentTime = player.getCurrentTime();
              const duration = player.getDuration();
              if (duration > 0) {
                const progress = (currentTime / duration) * 100;
                await FirestoreService.saveVideoProgress(user.uid, id, progress, duration);
              }
            }
          }, 5000);
        } else {
          // Also save immediately on pause/stop
          if (event.data === 2 && player && player.getCurrentTime && player.getDuration) {
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();
            if (duration > 0) {
              const progress = (currentTime / duration) * 100;
              FirestoreService.saveVideoProgress(user.uid, id, progress, duration);
            }
          }
          clearInterval(interval);
        }
      };

      const createPlayer = () => {
        if (!isMounted) return;
        if ((window as any).YT && (window as any).YT.Player) {
          player = new (window as any).YT.Player(`youtube-player-${id}`, {
            height: '100%',
            width: '100%',
            videoId: extractYoutubeId(youtubeId),
            playerVars: {
              'autoplay': 1,
              'modestbranding': 1,
              'rel': 0,
              'start': startSeconds
            },
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            }
          });
        }
      };

      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        (window as any).onYouTubeIframeAPIReady = createPlayer;
      } else {
        createPlayer();
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (player && player.destroy) player.destroy();
    };
  }, [id, youtubeId, user?.uid]);

  return (
    <div className="pb-20 md:pb-0 bg-background min-h-screen">
      <div className="md:hidden flex items-center justify-between p-4 sticky top-0 z-50 bg-linear-to-b from-black/90 to-transparent">
        <button onClick={() => navigate(-1)}><ArrowLeft className="text-white w-6 h-6" /></button>
        <div className="flex gap-4">
          <Cast className="text-white w-5 h-5" />
          <MoreVertical className="text-white w-5 h-5" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto md:pt-24">
        <div className="relative aspect-video w-full bg-black md:rounded-3xl overflow-hidden shadow-2xl border border-white/5">
          {!user ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 px-6 text-center z-10">
              <div className="w-16 h-16 bg-brand/20 rounded-full flex items-center justify-center mb-6">
                <User className="w-8 h-8 text-brand" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Sign In Required</h2>
              <p className="text-zinc-400 max-w-md mb-8 text-sm md:text-base">Create a free account or sign in to watch this video, save your progress, and manage bookmarks.</p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))} 
                className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-zinc-200 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Sign In Now
              </button>
            </div>
          ) : isContentPremium && !isPremium ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 px-6 text-center z-10">
              <div className="w-16 h-16 bg-brand/20 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-brand fill-current" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Premium Content</h2>
              <p className="text-zinc-400 max-w-md mb-8 text-sm md:text-base">This video is exclusive to AMG Prime subscribers. Upgrade your plan to access our full library of documentaries.</p>
              <button onClick={() => navigate('/profile')} className="bg-brand text-black font-bold py-3 px-10 rounded-full hover:bg-brand/90 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-brand/20">
                Subscribe Now
              </button>
            </div>
          ) : (
            <div id={`youtube-player-${id}`} className="w-full h-full"></div>
          )}
        </div>


        <div className="px-4 md:px-0 mt-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">{video.title}</h1>
            {isContentPremium && (
              <div className="bg-brand/10 border border-brand/30 text-brand text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shrink-0">
                <Zap className="w-3 h-3 fill-current" /> PREMIUM
              </div>
            )}
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mb-8 font-medium">AMG Prime Original | {video.category}</p>

          <div className="flex items-center justify-center gap-12 border-b border-zinc-900 pb-8 mb-8">
            <button
              onClick={() => id && onToggleBookmark?.(id)}
              className={cn("flex flex-col items-center gap-2 transition-all active:scale-90", isBookmarked ? "text-brand" : "text-zinc-400 hover:text-white")}
            >
              <Bookmark className={cn("w-6 h-6", isBookmarked && "fill-current")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Bookmark</span>
            </button>
            <button
              onClick={() => id && onToggleDownload?.(id)}
              className={cn("flex flex-col items-center gap-2 transition-all active:scale-90", isDownloaded ? "text-brand" : "text-zinc-400 hover:text-white")}
            >
              <Download className={cn("w-6 h-6", isDownloaded && "fill-current")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Download</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition-all active:scale-90">
              <Share2 className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Share</span>
            </button>
          </div>

          <h3 className="text-lg font-bold text-white mb-6 border-b border-brand inline-block pb-1">Recommended Videos</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {dbVideos.filter(v => v.id !== id).slice(0, 4).map(v => (
              <div key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="group cursor-pointer">
                <div className="aspect-video relative rounded-xl overflow-hidden mb-3 border border-white/5">
                  <img src={v.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-10 h-10 text-brand fill-current" />
                  </div>
                </div>
                <h4 className="text-white text-sm font-bold line-clamp-1 mb-1 group-hover:text-brand transition-colors">{v.title}</h4>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{v.category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [userDownloads, setUserDownloads] = useState<string[]>([]);
  const [videoProgress, setVideoProgress] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const [toast, setToast] = useState<{ message: string, type: ToastType, isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Sync profile and fetch role/premium status from Firestore.
          // Admin must be set via role: 'admin' in the Firestore users collection.
          const profile = await FirestoreService.ensureUserProfile(currentUser);
          
          if (profile) {
            const isUserAdmin = profile.role === 'admin';
            setIsAdmin(isUserAdmin);
            setIsPremium(profile.isPremium || isUserAdmin);
            
            // If admin, fetch all users
            if (isUserAdmin) {
              const usersList = await FirestoreService.getUsers();
              setAllUsers(usersList);
            }
          } else {
            // Profile fetch failed — treat as regular user
            setIsAdmin(false);
            setIsPremium(false);
          }
        } catch (error) {
          console.warn("User profile sync/fetch failed.", error);
          setIsAdmin(false);
          setIsPremium(false);
        } finally {
          setAuthLoading(false);
        }

        const qB = query(collection(db, "users", currentUser.uid, "bookmarks"));
        const unsubB = onSnapshot(qB, (snap) => setUserBookmarks(snap.docs.map(d => d.id)), (err) => console.warn("Bookmarks sync error:", err));

        const qD = query(collection(db, "users", currentUser.uid, "downloads"));
        const unsubD = onSnapshot(qD, (snap) => setUserDownloads(snap.docs.map(d => d.id)), (err) => console.warn("Downloads sync error:", err));

        const qP = query(collection(db, "users", currentUser.uid, "progress"), orderBy("updatedAt", "desc"));
        const unsubP = onSnapshot(qP, (snap) => setVideoProgress(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.warn("Progress sync error:", err));

        return () => { unsubB(); unsubD(); unsubP(); };
      } else {
        setIsAdmin(false);
        setIsPremium(false);
        setUserBookmarks([]);
        setUserDownloads([]);
        setVideoProgress([]);
        setAllUsers([]);
        setAuthLoading(false);
      }
    });

    const dataTimeout = setTimeout(() => {
      setLoading(false);
      console.warn("Initial data load timed out. Showing partial/empty state.");
    }, 3000);

    const qVideos = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsubVideos = onSnapshot(qVideos, (snap) => {
      setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video)));
    }, (err) => {
      console.error("Videos fetch error:", err);
      setLoading(false);
    });

    const qArticles = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      clearTimeout(dataTimeout);
    }, (err) => {
      console.error("Articles fetch error:", err);
      setLoading(false);
      clearTimeout(dataTimeout);
    });

    return () => { 
      unsubscribeAuth(); 
      unsubVideos(); 
      unsubArticles(); 
      clearTimeout(dataTimeout);
    };
  }, []);

  const handleTogglePreference = async (videoId: string, type: 'bookmarks' | 'downloads') => {
    if (!user) {
      showToast("Please sign in to save content", "info");
      return;
    }
    try {
      const added = await FirestoreService.togglePreference(user.uid, videoId, type);
      showToast(added ? `Added to ${type}` : `Removed from ${type}`, "success");
    } catch (e) {
      showToast("Save operation failed", "error");
    }
  };

  const handleRemoveProgress = async (videoId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'progress', videoId));
      showToast("Removed from continue watching", "success");
    } catch (e) {
      showToast("Failed to remove progress", "error");
    }
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background text-zinc-100 pb-16 md:pb-0 overflow-x-hidden selection:bg-brand selection:text-black">
          <NavWrapper user={user} isAdmin={isAdmin} />
          <main>
            <Routes>
              <Route path="/" element={loading ? <div className="pt-32 px-12 grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map(i => <VideoCardSkeleton key={i} />)}</div> : <HomePage dbVideos={videos} dbArticles={articles} videoProgress={videoProgress} onRemoveProgress={handleRemoveProgress} />} />
              <Route path="/live" element={<LiveTVPage />} />
              <Route path="/series" element={<SeriesPage />} />
              <Route path="/search" element={<SearchPage allContent={[...videos, ...articles]} />} />
              <Route path="/downloads" element={<DownloadsPage videoIds={userDownloads} allVideos={videos} onRemove={(id) => handleTogglePreference(id, 'downloads')} />} />
              <Route path="/bookmarks" element={<BookmarksPage videoIds={userBookmarks} allVideos={videos} onRemove={(id) => handleTogglePreference(id, 'bookmarks')} />} />
              <Route path="/magazines" element={<MagazinesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/profile" element={<ProfilePage user={user} isPremium={isPremium} />} />
              <Route path="/watch/:id" element={<WatchPage dbVideos={videos} user={user} isPremium={isPremium} userBookmarks={userBookmarks} userDownloads={userDownloads} onToggleBookmark={(id) => handleTogglePreference(id, 'bookmarks')} onToggleDownload={(id) => handleTogglePreference(id, 'downloads')} />} />
              <Route path="/shorts" element={<ShortsPage dbShorts={videos.filter(v => v.category === 'Shorts')} />} />
              <Route path="/admin" element={<AdminPanel user={user} isAdmin={isAdmin} authLoading={authLoading} showToast={showToast} allUsers={allUsers} />} />
              <Route path="*" element={<div className="pt-32 text-center text-zinc-400">Section Coming Soon</div>} />
            </Routes>
          </main>
          <BottomNavWrapper />
          <Toast
            isVisible={toast.isVisible}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

const NavWrapper = ({ user, isAdmin }: any) => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <Navbar user={user} isAdmin={isAdmin} />;
};

const BottomNavWrapper = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <BottomNav />;
};

