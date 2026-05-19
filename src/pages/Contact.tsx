import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight sm:text-5xl">Contact Us</h1>
          <p className="mt-4 text-xl text-slate-500">Reach out for inquiries, counseling, or just to say hello.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-900 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Phone</h3>
                  <p className="text-slate-600 text-sm mt-1">President: +234 (81) 6478-0934</p>
                  <p className="text-slate-600 text-sm">Secretary: +234 (81) 6811-5400</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Email</h3>
                  <a
                    href="mailto:rcffulokojachapter@gmail.com"
                    className="mt-1 block text-sm text-slate-600 underline-offset-4 hover:underline"
                  >
                    rcffulokojachapter@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Meeting Venue</h3>
                  <p className="text-slate-600 text-sm mt-1">Main Auditorium, behind FUL main Campus, Idori-Felele, Kogi State</p>
                  <p className="text-slate-500 text-xs mt-1">Every Wednesday, Friday and Sunday.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Send a Message</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Message sent! We'll reply soon."); }}>
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Subject</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 resize-none"
                  placeholder="Write your message here..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
