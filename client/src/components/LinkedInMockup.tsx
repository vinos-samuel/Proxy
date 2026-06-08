interface LinkedInMockupProps {
  name: string;
  headline: string;
  about: string;
  currentTitle?: string;
}

export default function LinkedInMockup({ name, headline, about, currentTitle }: LinkedInMockupProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white border border-[#DADDE1] rounded-lg overflow-hidden font-sans shadow-sm max-w-sm mx-auto">
      {/* Blue banner */}
      <div className="h-16 bg-gradient-to-r from-[#0077B5] to-[#00A0DC]" />

      {/* Avatar */}
      <div className="px-4 pb-3 relative">
        <div className="w-16 h-16 rounded-full bg-[#C7E8F5] border-4 border-white flex items-center justify-center -mt-8 text-[#0077B5] font-bold text-xl shadow">
          {initials}
        </div>

        <div className="mt-2">
          <div className="font-bold text-[#000000E6] text-base leading-tight">{name}</div>
          <div className="text-[#00000099] text-xs mt-0.5 leading-snug">{headline}</div>
          <div className="text-[#00000066] text-xs mt-1">Singapore · 500+ connections</div>
        </div>

        {/* LinkedIn-style connect button */}
        <div className="mt-3 flex gap-2">
          <div className="px-4 py-1 rounded-full border border-[#0077B5] text-[#0077B5] text-xs font-semibold cursor-default">
            Connect
          </div>
          <div className="px-4 py-1 rounded-full border border-[#00000066] text-[#000000CC] text-xs font-semibold cursor-default">
            Message
          </div>
        </div>

        {/* About section */}
        <div className="mt-4 border-t border-[#EAEAEA] pt-3">
          <div className="text-[#000000E6] text-xs font-semibold mb-1">About</div>
          <p className="text-[#000000CC] text-xs leading-relaxed line-clamp-6">{about}</p>
        </div>

        {/* Static watermark */}
        <div className="mt-3 text-[9px] text-[#00000033] text-center">
          linkedin.com/in/{name.toLowerCase().replace(/\s+/g, "-")}
        </div>
      </div>
    </div>
  );
}
