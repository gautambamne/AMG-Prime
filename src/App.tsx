import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { 
  Search, Menu, X, ChevronRight, Settings, LogOut, User, Volume2, VolumeX, Play, Info,
  Home, Zap, Download, Bookmark, Share2, ArrowLeft, Cast, MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { auth, db } from "./firebase";
import { signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

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

// --- Mock Data ---
const HERO_SLIDE = {
  title: "Radico Spirit of Excellence",
  subtitle: "DUOLOGUE WITH BARUN DAS",
  description: "A deep dive into the minds of visionaries.",
  image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop",
};

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
          <Link key={nav.path} to={nav.path} className={cn("flex flex-col items-center gap-1 transition-all duration-300", isActive ? "scale-110" : "opacity-60")}>
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

const ContinueWatchingRow = () => {
  const items = [
    { id: "cw1", title: "Drive The Future", thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=600&auto=format&fit=crop", progress: 60, timeLeft: "20m 8s left", isPremium: true },
    { id: "cw2", title: "Duologue with Barun Das", thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=600&auto=format&fit=crop", progress: 30, timeLeft: "2m 30s left", isPremium: true },
  ];
  
  return (
    <div className="mb-4 md:mb-8 max-w-7xl mx-auto">
      <h2 className="text-lg md:text-xl font-bold text-white tracking-tight mb-3 px-4 md:px-12">Continue Watching</h2>
      <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 snap-x snap-mandatory py-6 -my-6">
        {items.map(item => (
          <div key={item.id} className="relative flex-shrink-0 snap-start w-64 md:w-80 rounded overflow-hidden bg-zinc-900 group cursor-pointer card-hover">
            <div className="aspect-video relative">
              <img src={item.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <button className="absolute top-2 left-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-black z-10"><X className="w-3 h-3" /></button>
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent transition-all duration-300">
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
              <Link key={item.path} to={item.path} className={cn("text-xs font-semibold tracking-wider transition-colors hover:text-white", location.pathname === item.path ? "text-white" : "text-zinc-400")}>
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
              <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className="block text-sm font-semibold tracking-wider text-zinc-300 hover:text-white">
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

const HeroBanner = ({ featuredArticle }: { featuredArticle?: any }) => {
  const [isMuted, setIsMuted] = useState(true);
  const navigate = useNavigate();

  const heroData = featuredArticle ? {
    id: featuredArticle.id,
    title: featuredArticle.title,
    subtitle: featuredArticle.category || "EXCLUSIVE",
    description: featuredArticle.content?.slice(0, 100) + "..." || "Deep dive into visionaries.",
    image: featuredArticle.thumbnail || HERO_SLIDE.image
  } : HERO_SLIDE;

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] bg-zinc-900 overflow-hidden">
      <img src={heroData.image} alt="Hero" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 ott-gradient" />
      
      <div className="absolute bottom-0 left-0 w-full pb-16 md:pb-28 z-10 flex justify-center">
        <div className="w-full max-w-7xl px-4 md:px-12 flex items-end justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">{heroData.title}</h1>
            <p className="text-base md:text-xl text-zinc-300 font-medium mb-6 drop-shadow-md">{heroData.subtitle}</p>
            <div className="flex items-center gap-3 md:gap-4">
              <button onClick={() => navigate(`/watch/${heroData.id}`)} className="bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-zinc-200 transition-colors text-sm md:text-base">
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> Play
              </button>
              <button className="bg-zinc-800/80 text-white px-4 md:px-6 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-zinc-700 transition-colors backdrop-blur-sm text-sm md:text-base">
                <Info className="w-4 h-4 md:w-5 md:h-5" /> More Info
              </button>
            </div>
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
        {[0,1,2].map(i => (
          <div key={i} className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-brand" : "bg-zinc-600")} />
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
    <div onClick={() => navigate(`/watch/${item.id}`)} className={cn("relative flex-shrink-0 snap-start rounded-xl overflow-hidden bg-zinc-900 group card-hover border border-white/5", aspectClass)}>
      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
      
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
          See all <ChevronRight className="w-4 h-4 ml-0.5"/>
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

const HomePage = ({ dbVideos, dbArticles }: { dbVideos: Video[], dbArticles: any[] }) => {
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

  return (
    <div className="pb-20 overflow-x-hidden">
      <HeroBanner featuredArticle={dbArticles[0]} />
      <div className="relative z-20 -mt-10 md:-mt-20 space-y-8 md:space-y-12">
        <ContinueWatchingRow />
        {Object.entries(categories).map(([cat, items], idx) => (
          <ContentRow 
            key={cat} 
            title={cat} 
            items={items} 
            type={idx % 2 === 0 ? "portrait" : "landscape"} 
          />
        ))}
        {dbArticles.length === 0 && dbVideos.length === 0 && (
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 py-10">
             {[1,2,3,4].map(i => <VideoCardSkeleton key={i} />)}
          </div>
        )}
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
             
             <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 pt-20 pointer-events-none">
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
  isPremium, 
  userBookmarks = [], 
  userDownloads = [], 
  onToggleBookmark, 
  onToggleDownload 
}: { 
  dbVideos: Video[], 
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

  return (
    <div className="pb-20 md:pb-0 bg-background min-h-screen">
      <div className="md:hidden flex items-center justify-between p-4 sticky top-0 z-50 bg-gradient-to-b from-black/90 to-transparent">
         <button onClick={() => navigate(-1)}><ArrowLeft className="text-white w-6 h-6"/></button>
         <div className="flex gap-4">
           <Cast className="text-white w-5 h-5"/>
           <MoreVertical className="text-white w-5 h-5"/>
         </div>
      </div>
      
      <div className="max-w-5xl mx-auto md:pt-24">
        <div className="relative aspect-video w-full bg-black md:rounded-3xl overflow-hidden shadow-2xl border border-white/5">
          {isContentPremium && !isPremium ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 px-6 text-center">
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
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
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
              <Bookmark className={cn("w-6 h-6", isBookmarked && "fill-current")}/>
              <span className="text-[10px] font-bold uppercase tracking-wider">Bookmark</span>
            </button>
            <button 
              onClick={() => id && onToggleDownload?.(id)}
              className={cn("flex flex-col items-center gap-2 transition-all active:scale-90", isDownloaded ? "text-brand" : "text-zinc-400 hover:text-white")}
            >
              <Download className={cn("w-6 h-6", isDownloaded && "fill-current")}/>
              <span className="text-[10px] font-bold uppercase tracking-wider">Download</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition-all active:scale-90">
              <Share2 className="w-6 h-6"/>
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [userDownloads, setUserDownloads] = useState<string[]>([]);
  
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
        const profile = await FirestoreService.getUserProfile(currentUser.uid);
        if (profile) {
          setIsAdmin(profile.role === 'admin' || currentUser.email === 'jitbanerjeesujan@gmail.com');
          setIsPremium(profile.isPremium || profile.role === 'admin' || currentUser.email === 'jitbanerjeesujan@gmail.com');
        } else {
          setIsAdmin(currentUser.email === 'jitbanerjeesujan@gmail.com');
          setIsPremium(currentUser.email === 'jitbanerjeesujan@gmail.com');
        }

        const qB = query(collection(db, "users", currentUser.uid, "bookmarks"));
        const unsubB = onSnapshot(qB, (snap) => setUserBookmarks(snap.docs.map(d => d.id)));

        const qD = query(collection(db, "users", currentUser.uid, "downloads"));
        const unsubD = onSnapshot(qD, (snap) => setUserDownloads(snap.docs.map(d => d.id)));

        return () => { unsubB(); unsubD(); };
      } else {
        setIsAdmin(false);
        setIsPremium(false);
        setUserBookmarks([]);
        setUserDownloads([]);
      }
    });

    const qVideos = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsubVideos = onSnapshot(qVideos, (snap) => {
      setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video)));
    }, () => showToast("Error connecting to videos", "error"));

    const qArticles = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => showToast("Error connecting to news feed", "error"));

    return () => { unsubscribeAuth(); unsubVideos(); unsubArticles(); };
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

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background text-zinc-100 pb-16 md:pb-0 overflow-x-hidden selection:bg-brand selection:text-black">
          <Navbar user={user} isAdmin={isAdmin} />
          <main>
            <Routes>
              <Route path="/" element={loading ? <div className="pt-32 px-12 grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3].map(i => <VideoCardSkeleton key={i}/>)}</div> : <HomePage dbVideos={videos} dbArticles={articles} />} />
              <Route path="/live" element={<LiveTVPage />} />
              <Route path="/series" element={<SeriesPage />} />
              <Route path="/search" element={<SearchPage allContent={[...videos, ...articles]} />} />
              <Route path="/downloads" element={<DownloadsPage videoIds={userDownloads} allVideos={videos} onRemove={(id) => handleTogglePreference(id, 'downloads')} />} />
              <Route path="/bookmarks" element={<BookmarksPage videoIds={userBookmarks} allVideos={videos} onRemove={(id) => handleTogglePreference(id, 'bookmarks')} />} />
              <Route path="/magazines" element={<MagazinesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/profile" element={<ProfilePage user={user} isPremium={isPremium} />} />
              <Route path="/watch/:id" element={<WatchPage dbVideos={videos} isPremium={isPremium} userBookmarks={userBookmarks} userDownloads={userDownloads} onToggleBookmark={(id) => handleTogglePreference(id, 'bookmarks')} onToggleDownload={(id) => handleTogglePreference(id, 'downloads')} />} />
              <Route path="/shorts" element={<ShortsPage dbShorts={videos.filter(v => v.category === 'Shorts')} />} />
              <Route path="/admin" element={<AdminPanel user={user} isAdmin={isAdmin} showToast={showToast} />} />
              <Route path="*" element={<div className="pt-32 text-center text-zinc-400">Section Coming Soon</div>} />
            </Routes>
          </main>
          <BottomNav />
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

