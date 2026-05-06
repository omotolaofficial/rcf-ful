import React from 'react';
import { BookOpen, Target, History } from 'lucide-react';

export default function AboutPage() {

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight sm:text-5xl">About Us</h1>
          <p className="mt-4 text-xl text-slate-500">Discover who we are, what we believe, and where we come from.</p>
        </div>

        <div className="space-y-12">
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-900 absolute -top-12 left-0 sm:static sm:top-0">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mt-4 sm:mt-0">Vision and Mission</h2>
            </div>
            <div className="space-y-6 text-slate-600 leading-relaxed md:pl-16">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg mb-2">Our Vision</h3>
                <p>To raise a generation of transformative leaders rooted in faith, equipped with excellence, and driven by purpose to impact their world.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-lg mb-2">Our Mission</h3>
                <p>To provide a nurturing environment where students can experience spiritual growth, pursue academic excellence, and build authentic, lifelong relationships through dynamic teaching, prayer, and community service.</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 absolute -top-12 left-0 sm:static sm:top-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mt-4 sm:mt-0">What We Stand For</h2>
            </div>
            <div className="md:pl-16 grid gap-4 grid-cols-1 sm:grid-cols-2 text-slate-600">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-blue-900 mb-1">Spiritual Vitality</h4>
                <p className="text-sm">Uncompromising commitment to spiritual disciplines, prayer, and the study of the Word.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-blue-900 mb-1">Academic Excellence</h4>
                <p className="text-sm">Encouraging our members to be front-runners in their respective academic fields.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-blue-900 mb-1">Authentic Community</h4>
                <p className="text-sm">Creating a family away from home where every student feels loved and supported.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-blue-900 mb-1">Purposeful Leadership</h4>
                <p className="text-sm">Training students to lead with integrity, compassion, and a servant's heart.</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 absolute -top-12 left-0 sm:static sm:top-0">
                <History className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mt-4 sm:mt-0">Our History</h2>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed md:pl-16">
              <p>
                RCF FUL began in the early 2000s when a small group of passionate students recognized the need for a spiritual haven amidst the rigorous academic environment of the university. What started as evening dormitory prayer meetings quickly grew into a campus-wide movement.
              </p>
              <p>
                As the years went by, the fellowship became officially recognized by the Student Union and quickly grew to encompass hundreds of active members spanning all faculties. We have established deep-rooted traditions of the annual campus crusade, weekly tutorials for struggling students, and outreach programs that extend beyond the campus walls.
              </p>
              <p>
                Today, our alumni network spans across the globe, continually testifying to the foundational impact the fellowship had on their professional and personal journeys.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
