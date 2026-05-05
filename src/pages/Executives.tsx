import React, { useMemo } from 'react';

const TEAM_MEMBERS = [
  { name: "Adeniyi Olamide", role: "President" },
  { name: "Joshua Eleojo Sanni", role: "Vice President 1", secondaryRole: "Prayer Sec." },
  { name: "Onmeje Praise Ochanya", role: "Vice President 2", secondaryRole: "Bible Study Sec." },
  { name: "Gift Ize Abiodun", role: "General Secretary", secondaryRole: "Media Dir." },
  { name: "Musa Eneojo Godman", role: "Brothers Coordinator", secondaryRole: "Organizing Sec." },
  { name: "Ibinuwa Iyanuoluwa Queen", role: "Sisters Coordinator", secondaryRole: "Evangelism Sec." },
  { name: "Ogundele Busayo Dorcas", role: "Treasurer", secondaryRole: "Asst. Prayer Sec." },
  { name: "Yusuf Ozavize Beauty", role: "Financial Secretary", secondaryRole: "Asst. Gen. Sec." },
  { name: "Akintayo Peace Eniola", role: "Welfare Secretary" },
  { name: "Egbeeye Oluwanifemi Anuoluwa", role: "Academic Secretary", secondaryRole: "Librarian" },
  { name: "Tanko Jummai", role: "Music Director" },
  { name: "Ikanni Esther Ugbedeojo", role: "Chief Usher" },
  { name: "Joseph Precious Oyiza", role: "Follow-Up Head" },
  { name: "Ojo Rachael Odunayo", role: "Sanitation & Decoration Dir." },
  { name: "John Elijah", role: "Technical Coordinator", secondaryRole: "Asst. Music Dir." },
  { name: "Esechie Osaro David", role: "Protocol Secretary", secondaryRole: "Male Health Sec." },
  { name: "Kolawole Favour Temitope", role: "Female Health Sec.", secondaryRole: "Asst. Evangelism Sec." },
  { name: "Yakubu Grace Ometere", role: "Asst. Sister's Coordinator" },
  { name: "Ajileye Abigeal Iyaunoluwa", role: "Asst. Academic Sec.", secondaryRole: "Librarian Sec." },
  { name: "Osho Deborah Oluwatoni", role: "Asst. Welfare Sec.", secondaryRole: "Asst. Follow-Up Sec." },
  { name: "Peter Oluwabusayo Faith", role: "Asst. Drama Director" },
  { name: "James Oluwapelumi Naomi", role: "Asst. Head Usher", secondaryRole: "Asst. Sanitation Sec." },
];

// Dynamically import all images from the images directory
const imageModules = import.meta.glob('../../images/*.{jpeg,jpg,png}', { eager: true }) as Record<string, { default: string }>;
const availableImages = Object.entries(imageModules)
  .map(([path, module]) => {
    const fileName = path.split('/').pop()?.split('.')[0] || '';
    return {
      path: module.default,
      fileName: fileName.toLowerCase().replace(/[\s\-_]/g, ''),
      originalFileName: fileName
    };
  })
  // Filter out logos and heroes to prevent accidental matching
  .filter(img => !img.fileName.includes('hero') && !img.fileName.includes('logo'));

function findMatchingImage(fullName: string): string | null {
  const normalizedFullName = fullName.toLowerCase().replace(/[\s\-_]/g, '');
  const nameParts = fullName.toLowerCase().split(/[\s\-_]+/).filter(Boolean);
  
  // 1. Exact full name match
  let match = availableImages.find(img => img.fileName === normalizedFullName);
  if (match) return match.path;
  
  // 2. Exact part match (First name or Last name)
  for (const part of nameParts) {
    match = availableImages.find(img => img.fileName === part);
    if (match) return match.path;
  }
  
  // 3. Includes match (e.g., "ola" inside "olamide", "nifemi" inside "oluwanifemi")
  for (const part of nameParts) {
    match = availableImages.find(img => part.includes(img.fileName) || img.fileName.includes(part));
    if (match) return match.path;
  }

  // 4. Nicknames & Typo overrides (Catch edge cases)
  const overrides: Record<string, string> = {
    'abigeal': 'abigael',
    'deborah': 'debby',
    'olamide': 'ola'
  };
  
  for (const part of nameParts) {
    if (overrides[part]) {
      match = availableImages.find(img => img.fileName === overrides[part]);
      if (match) return match.path;
    }
  }

  // 5. Highest common prefix (Levenshtein-lite fallback for remaining typos)
  let bestMatch = null;
  let maxPrefix = 0;
  for (const img of availableImages) {
    for (const part of nameParts) {
      let common = 0;
      for (let i = 0; i < Math.min(img.fileName.length, part.length); i++) {
        if (img.fileName[i] === part[i]) common++;
        else break;
      }
      if (common > maxPrefix && common >= 3) {
        maxPrefix = common;
        bestMatch = img;
      }
    }
  }
  
  if (bestMatch) return bestMatch.path;

  return null;
}

export default function ExecutivesPage() {
  // Memoize image assignment so we only compute it once per render
  const teamWithImages = useMemo(() => {
    return TEAM_MEMBERS.map(member => ({
      ...member,
      imageUrl: findMatchingImage(member.name)
    }));
  }, []);

  return (
    <div className="py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight sm:text-5xl">Meet the Team</h1>
          <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto">
            Get to know the dedicated leaders serving our fellowship community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamWithImages.map((member) => (
            <div 
              key={member.name} 
              className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.1)] group"
            >
              <div className="w-40 h-40 mb-5 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md relative group-hover:border-blue-100 transition-colors duration-300 shrink-0">
                 <img 
                    src={member.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=e0e7ff&color=1e3a8a&size=200&bold=true`} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=e0e7ff&color=1e3a8a&size=200&bold=true`;
                    }}
                 />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1.5 leading-tight">{member.name}</h3>
              <p className="text-[13px] font-bold text-amber-600 tracking-wide uppercase mb-1">
                {member.role}{member.secondaryRole ? ` / ${member.secondaryRole}` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
