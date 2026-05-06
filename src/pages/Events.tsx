import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ExpandableText } from '../components/ExpandableText';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const featuredHeroImage = '/zonal-congress.jpeg';

  useEffect(() => {
    async function fetchEvents() {
      try {
        const q = query(collection(db, 'events'), orderBy('eventDate', 'asc'));
        const snapshot = await getDocs(q);
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight sm:text-5xl">Events & Programs</h1>
          <p className="mt-4 text-xl text-slate-500">Join us for fellowship, worship, and community activities.</p>
        </div>

        {/* Featured Zonal Congress Event */}
        <div className="mb-12 relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 group">
          <div className="aspect-video bg-slate-100">
            <img src={featuredHeroImage} alt="Featured fellowship event" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/30 to-transparent flex items-end justify-center p-8 sm:p-12 pointer-events-none">
            <div className="text-center">
              <span className="bg-amber-500 text-blue-900 text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full mb-4 inline-block shadow-sm">Featured Event</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">Zonal Congress 2026</h2>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No upcoming events right now.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col">
                <div className="aspect-video bg-slate-100">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CalendarIcon className="w-12 h-12 text-blue-200" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-sm font-semibold text-blue-900 mb-2 uppercase tracking-wider">
                    {format(new Date(event.eventDate), 'MMM d, yyyy')}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{event.title}</h3>
                  {event.description && (
                    <ExpandableText
                      text={event.description}
                      maxLength={150}
                      className="text-slate-500 text-sm mb-4 flex-1"
                    />
                  )}
                  
                  <div className="space-y-2 mt-auto pt-4 border-t border-gray-100">
                    {event.startTime && (
                      <div className="flex items-center text-gray-500 text-sm gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{event.startTime} {event.endTime && `- ${event.endTime}`}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-500 text-sm gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
