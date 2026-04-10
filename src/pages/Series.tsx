import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Play, Info, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SeriesPage = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch videos specifically in the 'Series' category
    const q = query(
      collection(db, "videos"), 
      where("category", "==", "Series"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSeries(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="pt-32 flex flex-col items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Curating Series...</p>
      </div>
    );
  }

  const featuredSeries = series[0] || {
    id: "featured-mock",
    title: "House of Pawar",
    thumbnail: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?q=80&w=2070",
    description: "An exclusive look into the political dynasty that shaped modern Maharashtra. Uncover the secrets, the power struggles, and the legacy.",
    badge: "NEW SEASON"
  };

  const trendingBatch = series.length > 0 ? series : [
    { id: "s1", title: "House of Pawar", thumbnail: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?q=80&w=600" },
    { id: "s2", title: "Swiss Roar", thumbnail: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=600" },
    { id: "s3", title: "The Single Malt Saga", thumbnail: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=600" },
    { id: "s4", title: "Maha Kumbh 2025", thumbnail: "https://images.unsplash.com/photo-1532664189809-02133fee698d?q=80&w=600" },
  ];

  return (
    <div className="pb-20 overflow-x-hidden">
      {/* Series Hero */}
      <div className="relative w-full h-[50vh] md:h-[70vh] bg-zinc-900 overflow-hidden">
        <img src={featuredSeries.thumbnail} alt={featuredSeries.title} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 ott-gradient" />
        
        <div className="absolute bottom-0 left-0 w-full pb-16 md:pb-24 z-10 flex justify-center">
          <div className="w-full max-w-7xl px-4 md:px-12 flex items-end justify-between">
            <div className="max-w-2xl">
              <div className="bg-brand text-black text-[10px] font-bold px-2 py-1 rounded mb-3 inline-block uppercase tracking-wider">{featuredSeries.badge || 'Featured Series'}</div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">{featuredSeries.title}</h1>
              <p className="text-sm md:text-lg text-zinc-300 font-medium mb-6 drop-shadow-md line-clamp-2">{featuredSeries.description || 'Watch our latest investigative series and documentaries only on AMG Prime.'}</p>
              <div className="flex items-center gap-3 md:gap-4">
                <button onClick={() => navigate(`/watch/${featuredSeries.id}`)} className="bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-zinc-200 transition-colors text-sm md:text-base">
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> Play Now
                </button>
                <button className="bg-zinc-800/80 text-white px-4 md:px-6 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-zinc-700 transition-colors backdrop-blur-sm text-sm md:text-base">
                  <Info className="w-4 h-4 md:w-5 md:h-5" /> Episodes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Series Rows */}
      <div className="relative z-20 -mt-10 md:-mt-16 space-y-8 md:space-y-12">
        <div className="mb-4 md:mb-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-3 px-4 md:px-12">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Trending Series</h2>
            <button className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center transition-colors">
              See all <ChevronRight className="w-4 h-4 ml-0.5"/>
            </button>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 snap-x snap-mandatory py-6 -my-6">
            {trendingBatch.map((item: any) => (
              <div key={item.id} onClick={() => navigate(`/watch/${item.id}`)} className="relative flex-shrink-0 snap-start aspect-[2/3] w-32 md:w-48 rounded overflow-hidden bg-zinc-900 group card-hover cursor-pointer">
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 right-0 bg-brand text-black text-[9px] font-bold px-2 py-0.5 rounded-bl z-10">SERIES</div>
                <div className="absolute bottom-0 left-0 w-full p-3 z-10">
                  <h3 className="text-white text-xs md:text-sm font-bold line-clamp-2 leading-tight drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {series.length > 4 && (
          <div className="mb-4 md:mb-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-3 px-4 md:px-12">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Investigative Docuseries</h2>
              <button className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center transition-colors">
                See all <ChevronRight className="w-4 h-4 ml-0.5"/>
              </button>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 snap-x snap-mandatory py-6 -my-6">
              {series.slice(4).map((item: any) => (
                <div key={item.id} onClick={() => navigate(`/watch/${item.id}`)} className="relative flex-shrink-0 snap-start aspect-[2/3] w-32 md:w-48 rounded overflow-hidden bg-zinc-900 group card-hover cursor-pointer">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-0 right-0 bg-brand text-black text-[9px] font-bold px-2 py-0.5 rounded-bl z-10">SERIES</div>
                  <div className="absolute bottom-0 left-0 w-full p-3 z-10">
                    <h3 className="text-white text-xs md:text-sm font-bold line-clamp-2 leading-tight drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesPage;
