import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, MapPin, Users, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';

const EventsPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="pt-32 flex flex-col items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Discovering Events...</p>
      </div>
    );
  }

  const featuredEvent = events[0];
  const moreEvents = events.slice(1);

  return (
    <div className="pt-20 md:pt-28 pb-20 min-h-screen max-w-7xl mx-auto px-4 md:px-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 md:w-10 md:h-10 text-brand" /> Events & Conferences
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl">Discover upcoming healthcare summits, award ceremonies, and medical conferences hosted by AMG Prime.</p>
        </div>
      </div>

      {!featuredEvent ? (
        <div className="py-20 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
          <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg">No Events Scheduled</h3>
          <p className="text-zinc-500 text-sm">Please check back soon for our upcoming healthcare summits and awards.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Event */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-zinc-900 group border border-zinc-800 flex flex-col">
            <div className="aspect-video relative">
              <img src={featuredEvent.thumbnail} alt={featuredEvent.title} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute top-4 left-4 bg-brand text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {featuredEvent.status || 'Upcoming'}
              </div>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap gap-4 mb-3 text-sm font-medium text-brand">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {featuredEvent.date}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {featuredEvent.location}</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">{featuredEvent.title}</h2>
              <p className="text-zinc-300 text-sm md:text-base mb-6 max-w-2xl line-clamp-3">{featuredEvent.description}</p>
              <div className="flex gap-4">
                <a href={featuredEvent.registrationUrl || '#'} target="_blank" rel="noopener noreferrer" className="bg-brand text-black font-bold py-3 px-8 rounded hover:bg-brand/90 transition-colors flex items-center gap-2">
                  {featuredEvent.status === 'Completed' ? 'Watch Recap' : 'Register Now'} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Other Events List */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-2">More Events</h3>
            {moreEvents.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-zinc-500 text-sm">More events coming soon!</p>
              </div>
            ) : (
              moreEvents.map(event => (
                <div key={event.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-colors flex flex-col">
                  <div className="aspect-video relative">
                    <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2 bg-zinc-800/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                      {event.status}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider mb-1">{event.type}</span>
                    <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{event.title}</h4>
                    <div className="flex flex-col gap-1 mb-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {event.date}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                    </div>
                    <div className="mt-auto pt-4 border-t border-zinc-800">
                      <a href={event.registrationUrl || '#'} target="_blank" rel="noopener noreferrer" className="w-full text-zinc-300 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                        {event.status === 'Completed' ? 'Watch Highlights' : 'View Details'} <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
