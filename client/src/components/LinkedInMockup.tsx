interface LinkedInMockupProps {
  name: string;
  headline: string;
  about: string;
  currentTitle?: string;
  skills?: string[];
}

export default function LinkedInMockup({ name, headline, about, currentTitle, skills }: LinkedInMockupProps) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-[#F3F2EF] font-sans text-[#000000E6] text-xs rounded overflow-hidden shadow-sm border border-[#00000014]">

      {/* Profile card */}
      <div className="bg-white rounded-lg overflow-hidden border border-[#00000014] mb-2">
        {/* Background banner */}
        <div className="h-14 bg-gradient-to-r from-[#4D6FA5] via-[#3B82C4] to-[#6BA3D6] relative">
          <div className="absolute bottom-[-20px] left-3">
            <div className="w-14 h-14 rounded-full bg-[#DBEAFE] border-[3px] border-white flex items-center justify-center text-[#1D4ED8] font-bold text-base shadow">
              {initials}
            </div>
          </div>
        </div>

        <div className="px-3 pt-6 pb-3">
          <div className="font-bold text-sm text-[#000000E6] leading-tight">{name}</div>
          <div className="text-[11px] text-[#00000099] mt-0.5 leading-snug">{headline || currentTitle}</div>
          <div className="text-[10px] text-[#00000066] mt-1">Singapore · 500+ connections</div>

          <div className="flex gap-1.5 mt-2.5">
            <button className="flex-1 py-1 rounded-full border border-[#0A66C2] text-[#0A66C2] text-[10px] font-semibold">
              Connect
            </button>
            <button className="flex-1 py-1 rounded-full border border-[#00000066] text-[#000000CC] text-[10px] font-semibold">
              Message
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-lg border border-[#00000014] p-3 mb-2">
        <div className="font-semibold text-[11px] mb-1.5">About</div>
        <p className="text-[10px] leading-relaxed text-[#000000CC] line-clamp-5">{about}</p>
        <button className="text-[#0A66C2] text-[10px] font-semibold mt-1">...see more</button>
      </div>

      {/* Experience preview */}
      {currentTitle && (
        <div className="bg-white rounded-lg border border-[#00000014] p-3 mb-2">
          <div className="font-semibold text-[11px] mb-1.5">Experience</div>
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 bg-[#E8E8E3] border border-[#00000014] rounded shrink-0 flex items-center justify-center text-[8px] font-bold text-[#00000066]">Co</div>
            <div>
              <div className="font-semibold text-[10px]">{currentTitle}</div>
              <div className="text-[#00000066] text-[9px]">Current · Full-time</div>
            </div>
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="bg-white rounded-lg border border-[#00000014] p-3">
          <div className="font-semibold text-[11px] mb-1.5">Skills</div>
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 5).map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#EEF3FB] text-[#0A66C2] rounded-full text-[9px] font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="text-center py-2 text-[9px] text-[#00000033]">
        linkedin.com/in/{name.toLowerCase().replace(/\s+/g, "-")}
      </div>
    </div>
  );
}
