import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, onSnapshot, where } from 'firebase/firestore';
import { Calendar, Clock, MapPin, ExternalLink, ChevronRight, ChevronLeft, Users, Play, Wallet, Copy, CheckCircle, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ExpandableText } from '../components/ExpandableText';

const HERO_IMAGES = Array.from({ length: 10 }, (_, index) => ({
  // Resolve from the project-level `images` folder so Vite can bundle them.
  url: new URL(`../../images/rcf-hero${index + 1}.jpeg`, import.meta.url).href,
  title: "Welcome to RCF FUL",
  description:
    "A community of students dedicated to spiritual growth, academic excellence, and authentic relationships on campus."
}));

const HERO_ROTATION_MS = 4000;

function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  useEffect(() => {
    // Preload hero images once to reduce visible flicker during cross-fades.
    HERO_IMAGES.forEach((image) => {
      const preloaded = new Image();
      preloaded.src = image.url;
    });
  }, []);

  useEffect(() => {
    if (!isAutoplay) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, HERO_ROTATION_MS);
    return () => clearInterval(timer);
  }, [isAutoplay]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
    setIsAutoplay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    setIsAutoplay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoplay(false);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-blue-900 text-white shadow-lg mb-8 h-[300px] sm:h-[400px] md:h-[500px] group">
      {/* Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={HERO_IMAGES[currentIndex].url}
            alt={HERO_IMAGES[currentIndex].title}
            className="w-full h-full object-cover"
            loading={currentIndex === 0 ? 'eager' : 'lazy'}
            fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
            decoding="async"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-900/50 to-blue-900/30 z-[2]" />
      
      {/* Decorative Circle */}
      <div className="absolute -right-[100px] -top-[100px] w-[300px] h-[300px] bg-white/5 rounded-full z-[1] pointer-events-none blur-2xl" />

      {/* Content */}
      <div className="relative z-[3] h-full flex flex-col justify-center items-start p-8 sm:p-12 md:p-16 max-w-2xl">
        <motion.h1 
          key={`title-${currentIndex}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight text-white"
        >
          {HERO_IMAGES[currentIndex].title}
        </motion.h1>
        <motion.p 
          key={`desc-${currentIndex}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-base sm:text-lg text-white/95 leading-relaxed max-w-xl"
        >
          {HERO_IMAGES[currentIndex].description}
        </motion.p>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-[4] p-2 sm:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-all opacity-0 group-hover:opacity-100 duration-300 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-[4] p-2 sm:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-all opacity-0 group-hover:opacity-100 duration-300 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[4] flex gap-2 sm:gap-3">
        {HERO_IMAGES.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "rounded-full transition-all duration-300 backdrop-blur-sm",
              currentIndex === index
                ? "bg-white w-8 h-2.5 sm:w-10 sm:h-3"
                : "bg-white/50 hover:bg-white/70 w-2.5 h-2.5 sm:w-3 sm:h-3"
            )}
            aria-label={`Go to slide ${index + 1}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 z-[4] bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm font-medium">
        {currentIndex + 1} / {HERO_IMAGES.length}
      </div>
    </div>
  );
}

function ScheduleGlance() {
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const q = query(collection(db, 'schedules'), orderBy('createdAt', 'desc'), limit(4));
        const snapshot = await getDocs(q);
        setSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Error fetching schedules:", e);
      }
    }
    fetchSchedules();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
        <span>Today's Schedule</span>
        <span className="text-amber-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600"></span> Live</span>
      </div>
      
      <div className="flex flex-col gap-3">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="flex gap-3 pb-3 border-b border-slate-200 last:border-0 last:pb-0">
            <div className="bg-blue-50 text-blue-900 px-2 py-2 rounded-lg text-xs font-bold min-w-[60px] text-center flex flex-col justify-center shrink-0">
              {schedule.time}
            </div>
            <div className="flex flex-col flex-1 text-center">
              <h4 className="text-sm font-semibold text-slate-800 mb-0.5">{schedule.title}</h4>
              <p className="text-xs text-slate-500">{schedule.location} / {schedule.assignedLeader || 'TBA'}</p>
            </div>
          </div>
        ))}
        {schedules.length === 0 && (
          <div className="text-sm text-slate-500 py-4 text-center">Schedules will be updated soon.</div>
        )}
      </div>
    </div>
  );
}

function AnnouncementsGlance() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const q = query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Error fetching announcements:", e);
      }
    }
    fetchAnnouncements();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-full">
      <h3 className="text-base font-bold text-blue-900 flex items-center gap-2 mb-4">
        Announcements
      </h3>
      <div className="flex flex-col gap-3">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-slate-100 p-3 rounded-lg overflow-hidden group">
            {announcement.imageUrl && (
              <div className="relative w-full rounded-md overflow-hidden mb-2 shadow-sm border border-slate-200">
                <div className="aspect-video bg-slate-200">
                  <img src={announcement.imageUrl} alt={announcement.title || 'Announcement'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
            )}
            <h5 className="text-sm font-semibold text-slate-800 mb-1">{announcement.title}</h5>
            {announcement.content && (
              <ExpandableText
                text={announcement.content}
                maxLength={100}
                className="text-xs text-slate-500 leading-relaxed"
              />
            )}
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="text-sm text-slate-500 py-4 text-center">No recent announcements.</div>
        )}
      </div>
    </div>
  );
}

function ExecutivesGlance() {
  const [executives, setExecutives] = useState<any[]>([]);

  useEffect(() => {
    async function fetchExecutives() {
      try {
        const q = query(collection(db, 'executives'), orderBy('order', 'asc'), limit(6));
        const snapshot = await getDocs(q);
        setExecutives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Error fetching execs:", e);
      }
    }
    fetchExecutives();
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const fallbackExecs = [
    { id: 'fallback-1', name: "Adeniyi Olamide", role: "President", imageUrl: new URL('../../images/ola.jpeg', import.meta.url).href },
    { id: 'fallback-2', name: "Joshua Eleojo Sanni", role: "Vice President 1", imageUrl: new URL('../../images/joshua.jpeg', import.meta.url).href },
    { id: 'fallback-3', name: "Onmeje Praise Ochanya", role: "Vice President 2", imageUrl: new URL('../../images/praise.jpeg', import.meta.url).href }
  ];

  const displayExecs = executives.length > 0 ? executives : fallbackExecs;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-base font-bold text-blue-900 flex items-center gap-2 mb-4">
        Meet the Executives
      </h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {displayExecs.map((exec) => (
          <div key={exec.id} className="text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-amber-600 font-bold text-blue-900 overflow-hidden">
               {exec.imageUrl ? (
                  <img src={exec.imageUrl} alt={exec.name} className="w-full h-full object-cover" />
               ) : (
                  getInitials(exec.name)
               )}
            </div>
            <h6 className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5">{exec.name}</h6>
            <span className="text-[11px] text-slate-500 uppercase tracking-wide">{exec.role}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-center">
        <Link 
          to="/executives"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          View Full Executive
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}

function SermonGlance() {
  const [latestAudio, setLatestAudio] = useState<any | null>(null);

  useEffect(() => {
    async function fetchLatestAudio() {
      try {
        const q = query(
          collection(db, 'media'),
          where('type', '==', 'audio'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setLatestAudio({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        }
      } catch (error) {
        console.error('Error fetching latest audio:', error);
      }
    }

    fetchLatestAudio();
  }, []);

  return (
    <Link
      to="/media#audio"
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Open latest sermon audio"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-700 shrink-0">
          <Play className="w-5 h-5 fill-current" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-blue-900 flex items-center gap-2 mb-4">
            Latest Sermon
          </h3>
          <h5 className="text-sm font-semibold text-slate-800 mb-0.5">
            {latestAudio?.title ? `"${latestAudio.title}"` : 'Latest audio message'}
          </h5>
          <p className="text-xs text-slate-500">
            {latestAudio?.speaker || 'RCF FUL'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function LatestUpdates() {
  const [latestItems, setLatestItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Fetch latest items from all collections
    const fetchLatestUpdates = async () => {
      try {
        const collections = ['posts', 'announcements', 'events', 'media'];
        const fetchPromises = collections.map(async (collectionName) => {
          try {
            const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(3));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              collectionName,
              createdAt: doc.data()?.createdAt?.toDate?.() || doc.data()?.createdAt || new Date()
            }));
          } catch (err) {
            console.error(`Error fetching ${collectionName}:`, err);
            return [];
          }
        });
        
        const results = await Promise.all(fetchPromises);
        const allItems = results.flat().sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        setLatestItems(allItems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching latest updates:', err);
        setError('Failed to load latest updates');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLatestUpdates();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading latest updates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-red-200 p-8 text-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  if (!latestItems || latestItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No recent updates available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Latest Updates
      </h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {latestItems.map((item) => {
          const getIcon = () => {
            switch (item.collectionName) {
              case 'posts': return <FileText className="w-5 h-5 text-blue-600" />;
              case 'announcements': return <FileText className="w-5 h-5 text-purple-600" />;
              case 'events': return <Calendar className="w-5 h-5 text-green-600" />;
              case 'media': return <Video className="w-5 h-5 text-orange-600" />;
              default: return <FileText className="w-5 h-5 text-gray-600" />;
            }
          };
          
          const getTypeColor = () => {
            switch (item.collectionName) {
              case 'posts': return 'text-blue-600 bg-blue-50 border-blue-200';
              case 'announcements': return 'text-purple-600 bg-purple-50 border-purple-200';
              case 'events': return 'text-green-600 bg-green-50 border-green-200';
              case 'media': return 'text-orange-600 bg-orange-50 border-orange-200';
              default: return 'text-gray-600 bg-gray-50 border-gray-200';
            }
          };
          
          return (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getTypeColor()}`}>
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1 line-clamp-2">
                      {item.title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')} • {item.collectionName}
                    </p>
                  </div>
                  {item.description && (
                    <ExpandableText
                      text={item.description}
                      maxLength={120}
                      className="text-sm text-slate-600"
                    />
                  )}
                </div>
              </div>
              
              <div className="mt-2">
                <Link 
                  to={`/${item.collectionName === 'posts' ? 'posts' : item.collectionName === 'announcements' ? 'announcements' : item.collectionName === 'events' ? 'events' : 'media'}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View {item.collectionName === 'posts' ? 'Posts' : item.collectionName === 'announcements' ? 'Announcements' : item.collectionName === 'events' ? 'Events' : 'Media'}
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GivingCard() {
  const [purpose, setPurpose] = useState("Tithe");
  const [copied, setCopied] = useState(false);
  const accountNumber = "1383430927";

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row w-full mt-2">
      <div className="bg-blue-900 text-white p-6 md:p-8 md:w-2/5 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-xl -z-10 pointer-events-none"></div>
        
        <Wallet className="w-10 h-10 mb-4 text-amber-500" />
        <h3 className="text-2xl font-bold mb-2">Give & Partner</h3>
        <p className="text-blue-100/80 text-sm leading-relaxed mb-8">
          Your giving helps us advance the work of the fellowship, support members, and impact our campus.
        </p>
        <div className="mt-auto">
          <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold mb-3">Select Purpose</p>
          <div className="flex flex-wrap gap-2">
            {["Tithe", "Offering", "Fellowship Support", "Project/Welfare"].map(p => (
              <button 
                key={p}
                onClick={() => setPurpose(p)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  purpose === p ? "bg-amber-500 text-blue-900" : "bg-white/10 hover:bg-white/20 text-white"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6 md:p-8 md:w-3/5 flex flex-col justify-center bg-slate-50/50">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
               <Wallet className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">ACCESS Bank</p>
              <p className="font-bold text-slate-800 text-base">RCF Federal University Lokoja.</p>
            </div>
          </div>
          
          <div>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-2">Account Number</p>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-2xl font-extrabold text-blue-900 tracking-widest">{accountNumber}</span>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                {copied ? <><CheckCircle className="w-4 h-4 text-emerald-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-900">
          <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
             <span className="font-bold text-amber-700 text-xs">i</span>
          </div>
          <p className="text-sm">
            Please ensure you add <span className="font-bold">"{purpose}"</span> in the narration or description of your transfer so we can properly account for it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-[1200px] mx-auto p-5 pb-12 w-full flex flex-col gap-8">
      {/* Hero Section */}
      <HeroCarousel />
      
      {/* Latest Updates - Full Width */}
      <LatestUpdates />

      {/* Glance Information - 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Column 1: New Here & Schedule */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-amber-600 to-amber-500 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden flex-shrink-0">
            <div className="absolute right-[-20%] top-[-20%] w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <h3 className="text-lg font-bold mb-2 relative z-10">New here?</h3>
            <p className="text-sm text-white/90 mb-4 relative z-10">We would love to meet you and help you discover your family.</p>
            <Link to="/join" className="inline-block bg-white text-amber-600 font-bold py-2 px-6 rounded-full text-sm shadow hover:bg-slate-50 transition-colors relative z-10">
              Join Us
            </Link>
          </div>
          
          <ScheduleGlance />
        </div>

        {/* Column 2: Announcements */}
        <AnnouncementsGlance />
        
        {/* Column 3: Executives & Sermon */}
        <div className="flex flex-col gap-6">
          <ExecutivesGlance />
          <SermonGlance />
        </div>
      </div>

      {/* Payment & Account Details - Full Width */}
      <GivingCard />
    </div>
  );
}
