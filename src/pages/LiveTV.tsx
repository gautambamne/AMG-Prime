import React from 'react';
import { Play, Calendar, Clock, ChevronRight } from 'lucide-react';

const LiveTVPage = () => {
  return (
    <div className="pb-20 pt-20 md:pt-24 max-w-7xl mx-auto px-4 md:px-12 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Player Area */}
        <div className="flex-1">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-6 border border-zinc-800">
            <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 z-10 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div> LIVE
            </div>
            <iframe className="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1" title="Live TV" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">AMG Prime News Live</h1>
          <p className="text-zinc-400 text-sm mb-6">24/7 Live coverage of breaking news, deep analysis, and exclusive interviews from around the globe.</p>
          
          {/* EPG / Schedule */}
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand" /> Today's Schedule
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {[
              { time: "08:00 AM", title: "Morning Briefing", active: false },
              { time: "10:00 AM", title: "Global Markets Live", active: false },
              { time: "12:00 PM", title: "Midday News Hour", active: true },
              { time: "02:00 PM", title: "Tech & Startups", active: false },
              { time: "05:00 PM", title: "The Evening Debate", active: false },
            ].map((prog, idx) => (
              <div key={idx} className={`flex items-center p-4 border-b last:border-0 border-zinc-800 ${prog.active ? 'bg-zinc-800/50 border-l-4 border-l-brand' : ''}`}>
                <div className="w-24 shrink-0 flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                  <Clock className="w-3.5 h-3.5" /> {prog.time}
                </div>
                <div className="flex-1 font-medium text-sm md:text-base text-white">{prog.title}</div>
                {prog.active && <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded">ON AIR</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar / Chat */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-[400px] lg:h-[600px] flex flex-col">
            <h3 className="text-sm font-bold text-white mb-4 border-b border-zinc-800 pb-2">Live Discussion</h3>
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-500">U{i}</div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 block mb-0.5">User {i}</span>
                    <p className="text-xs text-zinc-300">This is a very insightful discussion on the current market trends.</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-800">
              <input type="text" placeholder="Join the discussion..." className="w-full bg-black border border-zinc-800 rounded-full px-4 py-2 text-xs text-white focus:border-brand outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTVPage;
