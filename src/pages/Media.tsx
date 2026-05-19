import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query, limit as queryLimit, startAfter } from 'firebase/firestore';
import { Calendar, Headphones, Image as ImageIcon, Video, X } from 'lucide-react';
import { format } from 'date-fns';
import { ExpandableText } from '../components/ExpandableText';

type MediaItem = {
  id: string;
  title?: string;
  speaker?: string;
  description?: string;
  datePreached?: string;
  type?: string;
  mediaUrl?: string;
  imageUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type LoadSource = 'firestore';

function normalizeType(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function safeDateToString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as any).toDate === 'function') {
    const d = (value as any).toDate();
    return d instanceof Date ? d.toISOString() : null;
  }
  return null;
}

function inferTypeFromContentType(contentType: string | undefined): 'audio' | 'video' | 'image' | null {
  const ct = (contentType ?? '').toLowerCase();
  if (ct.startsWith('audio/')) return 'audio';
  if (ct.startsWith('video/')) return 'video';
  if (ct.startsWith('image/')) return 'image';
  return null;
}

function inferTypeFromUrlOrName(value: string): 'audio' | 'video' | 'image' | null {
  const lower = value.toLowerCase();
  if (/\.(mp3|m4a|wav|ogg)(\?|#|$)/.test(lower)) return 'audio';
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/.test(lower)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|#|$)/.test(lower)) return 'image';
  return null;
}

function getItemMediaUrl(item: MediaItem): string {
  return (item.mediaUrl?.trim() || item.imageUrl?.trim() || '').trim();
}

function getEffectiveMediaType(item: MediaItem): 'audio' | 'video' | 'image' {
  const normalized = normalizeType(item.type);
  if (['audio', 'video', 'image', 'picture', 'photo'].includes(normalized)) {
    if (normalized === 'picture' || normalized === 'photo') return 'image';
    return normalized as 'audio' | 'video' | 'image';
  }

  const inferredFromUrl = inferTypeFromUrlOrName(getItemMediaUrl(item));
  return inferredFromUrl ?? 'audio';
}

function filenameToTitle(name: string) {
  return decodeURIComponent(name)
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
  } catch {
    // ignore
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'vimeo.com') return null;
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  } catch {
    return null;
  }
}

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadSource, setLoadSource] = useState<LoadSource>('firestore');
  const [activeImage, setActiveImage] = useState<MediaItem | null>(null);
  const [itemsPerPage] = useState(6);
  const [loadedItems, setLoadedItems] = useState<Set<string>>(new Set());
  const cacheRef = useRef<Map<string, MediaItem[]>>(new Map());
  const lastVisibleRef = useRef<any>(null);

  async function fetchFromFirestore(): Promise<MediaItem[]> {
    try {
      const ordered = await getDocs(query(collection(db, 'media'), orderBy('updatedAt', 'desc')));
      return ordered.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MediaItem));
    } catch {
      const unordered = await getDocs(collection(db, 'media'));
      return unordered.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MediaItem));
    }
  }

  // Preload function to cache data in background
  const preloadMediaData = useCallback(async () => {
    if (cacheRef.current.size > 0) {
      const cached = cacheRef.current.get('all');
      if (cached) {
        setMediaItems(cached);
        setLoadSource('firestore');
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const firestoreItems = await fetchFromFirestore();

      const withSortableDate = firestoreItems
        .map((item) => ({
          ...item,
          datePreached: item.datePreached || safeDateToString((item as any).updatedAt) || safeDateToString((item as any).createdAt) || undefined
        }))
        .sort((a, b) => String(b.datePreached ?? '').localeCompare(String(a.datePreached ?? '')));

      cacheRef.current.set('all', withSortableDate);

      setLoadSource('firestore');
      setMediaItems(withSortableDate);
      setLoading(false);
    } catch (e) {
      console.error('Preload error:', e);
      setLoadError('Failed to load media. Please try again.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    preloadMediaData();
  }, [preloadMediaData]);

  const fetchMoreItems = useCallback(async () => {
    if (loading || lastVisibleRef.current === null) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'media'),
        orderBy('updatedAt', 'desc'),
        queryLimit(itemsPerPage),
        startAfter(lastVisibleRef.current)
      );
      const snapshot = await getDocs(q);
      const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem));

      setMediaItems(prev => [...prev, ...newItems]);
      setLoadedItems(prev => new Set([...prev, ...newItems.map(item => item.id)]));
      lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1];
    } catch (e) {
      console.error('Error fetching more items:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, itemsPerPage]);

  const { audioItems, videoItems, pictureItems } = useMemo(() => {
    const audio = mediaItems.filter((item) => getEffectiveMediaType(item) === 'audio');
    const video = mediaItems.filter((item) => getEffectiveMediaType(item) === 'video');
    const pictures = mediaItems.filter((item) => getEffectiveMediaType(item) === 'image');
    return { audioItems: audio, videoItems: video, pictureItems: pictures };
  }, [mediaItems]);

  function renderMediaSection(params: {
    id: 'audio' | 'video' | 'picture';
    title: string;
    type: 'audio' | 'video' | 'picture';
    items: MediaItem[];
  }) {
    const { id, title, type, items } = params;
    return (
      <section id={id} className="mb-10 scroll-mt-24">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <span className="text-xs text-slate-400">
            {items.length} item{items.length === 1 ? '' : 's'}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                type === 'video'
                  ? 'bg-red-100 text-red-700'
                  : type === 'audio'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {type === 'video' ? (
                  <Video className="h-5 w-5" />
                ) : type === 'audio' ? (
                  <Headphones className="h-5 w-5" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700 mb-2">No {title.toLowerCase()} uploaded yet</p>
                <p className="text-sm text-gray-500">Upload {title.toLowerCase()} to share with the fellowship</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const mediaUrl = getItemMediaUrl(item);
              const effectiveType = getEffectiveMediaType(item);
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        type === 'video'
                          ? 'bg-red-100 text-red-700'
                          : type === 'audio'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {type === 'video' ? (
                        <Video className="h-5 w-5" />
                      ) : type === 'audio' ? (
                        <Headphones className="h-5 w-5" />
                      ) : (
                        <ImageIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 font-bold text-slate-800">{item.title || 'Untitled'}</h3>
                      <p className="text-sm text-slate-500">{item.speaker ? `By ${item.speaker}` : 'RCF FUL'}</p>
                    </div>
                  </div>

                  {effectiveType === 'video' && mediaUrl && (
                    <video controls style={{ width: '100%', borderRadius: '8px' }}>
                      <source src={mediaUrl} />
                      Your browser does not support video playback.
                    </video>
                  )}

                  {effectiveType === 'audio' && mediaUrl && (
                    <audio controls preload="metadata" style={{ width: '100%' }}>
                      <source src={mediaUrl} type="audio/mpeg" />
                      Your browser does not support audio playback.
                    </audio>
                  )}

                  {type === 'picture' && effectiveType === 'image' && mediaUrl && (
                    <button
                      type="button"
                      onClick={() => setActiveImage(item)}
                      className="group relative mb-4 block w-full overflow-hidden rounded-lg bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
                      aria-label={`Open image: ${item.title || 'Picture'}`}
                    >
                      <img
                        src={mediaUrl}
                        alt={item.title || 'Media picture'}
                        className="h-52 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
                    </button>
                  )}

                  {item.description && (
                    <ExpandableText
                      text={item.description}
                      maxLength={150}
                      className="mb-4 text-sm text-slate-600"
                    />
                  )}
                  {item.datePreached && (
                    <div className="mt-auto flex items-center text-xs text-gray-400">
                      <Calendar className="mr-1 h-3 w-3" />
                      {(() => {
                        const d = new Date(item.datePreached as string);
                        return Number.isNaN(d.getTime()) ? item.datePreached : format(d, 'MMM d, yyyy');
                      })()}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-900 sm:text-5xl">Messages & Media</h1>
          <p className="mt-4 text-xl text-slate-500">Listen, watch, and grow through our archive of teachings.</p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading media...</div>
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-white py-20 text-center">
            <p className="text-lg text-red-600">{loadError}</p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#audio"
                className="rounded-full bg-purple-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-800"
              >
                Audio
              </a>
              <a
                href="#video"
                className="rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800"
              >
                Video
              </a>
              <a
                href="#picture"
                className="rounded-full bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Pictures
              </a>
            </div>

            {renderMediaSection({ id: 'audio', title: 'Audio Messages', type: 'audio', items: audioItems })}
            {renderMediaSection({ id: 'video', title: 'Video Messages', type: 'video', items: videoItems })}
            {renderMediaSection({ id: 'picture', title: 'Picture Gallery', type: 'picture', items: pictureItems })}
            
            {mediaItems.length > 0 && mediaItems.length >= itemsPerPage && (
              <div className="text-center mt-8">
                <button
                  onClick={fetchMoreItems}
                  disabled={loading}
                  className="rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {activeImage && getItemMediaUrl(activeImage) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveImage(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setActiveImage(null);
          }}
          tabIndex={-1}
        >
          <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
              onClick={() => setActiveImage(null)}
              aria-label="Close image viewer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-black">
              <img
                src={getItemMediaUrl(activeImage)}
                alt={activeImage.title || 'Media picture'}
                className="max-h-[80vh] w-full object-contain"
              />
            </div>
            <div className="px-5 py-4">
              <p className="font-semibold text-slate-900">{activeImage.title || 'Picture'}</p>
              {activeImage.description && <p className="mt-1 text-sm text-slate-600">{activeImage.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
