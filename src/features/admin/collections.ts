import { AdminCollectionConfig } from './types';

export const ADMIN_COLLECTIONS: AdminCollectionConfig[] = [
  {
    key: 'posts',
    label: 'Posts / Blog',
    description: 'Create and manage blog posts, testimonies, and updates.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'mediaType',
        label: 'Media Type',
        type: 'select',
        options: [
          { value: 'image', label: 'Image' },
          { value: 'video', label: 'Video' },
          { value: 'audio', label: 'Audio' }
        ]
      },
      { name: 'mediaUrl', label: 'Media URL', type: 'image' }
    ]
  },
  {
    key: 'events',
    label: 'Events',
    description: 'Manage fellowship programs, services, and event schedules.',
    fields: [
      { name: 'title', label: 'Event Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'eventDate', label: 'Event Date', type: 'date', required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'startTime', label: 'Start Time', type: 'text' },
      { name: 'endTime', label: 'End Time', type: 'text' },
      { name: 'imageUrl', label: 'Event Image', type: 'image' }
    ]
  },
  {
    key: 'announcements',
    label: 'Announcements',
    description: 'Publish urgent or regular fellowship announcements.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'textarea', required: true },
      { name: 'date', label: 'Announcement Date', type: 'date', required: true },
      {
        name: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'regular', label: 'Regular' },
          { value: 'high', label: 'High' }
        ]
      },
      { name: 'imageUrl', label: 'Announcement Image', type: 'image' }
    ]
  },
  {
    key: 'media',
    label: 'Sermons / Media',
    description: 'Upload and publish sermon audio, video, and pictures.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'speaker', label: 'Speaker', type: 'text', required: true },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'audio', label: 'Audio' },
          { value: 'video', label: 'Video' },
          { value: 'image', label: 'Picture' }
        ]
      },
      { name: 'mediaUrl', label: 'Media File', type: 'image', required: true }
    ]
  },
  {
    key: 'siteSections',
    label: 'Website Sections',
    description: 'Edit reusable website section content (homepage/about/etc).',
    fields: [
      { name: 'sectionKey', label: 'Section Key', type: 'text', required: true },
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'imageUrl', label: 'Image', type: 'image' }
    ]
  }
];
