import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowRight, ArrowLeft, Plus, Trash2, Loader2, CheckCircle,
  User, Briefcase, BookOpen, MessageSquare, Shield, Palette,
  Send, Sparkles, Target, Wrench, Mic, HelpCircle, Terminal,
  FileText, Camera, Video, X
} from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { Link } from "wouter";

const STEPS = [
  { id: 1, title: "Basic Information", icon: User, description: "Your name, contact details and location" },
  { id: 2, title: "Professional Summary", icon: Target, description: "Your positioning statement and superpower" },
  { id: 3, title: "Career History", icon: Briefcase, description: "Your resume and work experience" },
  { id: 4, title: "War Stories", icon: BookOpen, description: "Your high-stakes professional stories (min 3)" },
  { id: 5, title: "Metrics & Achievements", icon: Sparkles, description: "Your quantifiable achievements" },
  { id: 6, title: "Technical Skills", icon: Wrench, description: "Platforms, tools and methodologies" },
  { id: 7, title: "Voice & Personality", icon: Mic, description: "How your AI Twin should communicate" },
  { id: 8, title: "Common Questions", icon: HelpCircle, description: "Questions visitors might ask" },
  { id: 9, title: "Objection Handling", icon: Shield, description: "How to handle tough questions" },
  { id: 10, title: "Branding & Assets", icon: Palette, description: "Visual branding and media" },
  { id: 11, title: "Chatbot Setup", icon: MessageSquare, description: "Configure your chatbot experience" },
  { id: 12, title: "Review & Submit", icon: Send, description: "Review everything and submit" },
];

const COMMUNICATION_STYLES = [
  { value: "direct", label: "Direct and no-nonsense" },
  { value: "warm", label: "Warm and conversational" },
  { value: "technical", label: "Technical and precise" },
  { value: "strategic", label: "Strategic and consultative" },
];

const BRANDING_THEMES = [
  { value: "corporate", label: "Corporate", description: "Traditional industries. Authoritative, institutional. Think: Finance, Consulting, Corporate HR." },
  { value: "tech", label: "Tech", description: "Technology & innovation. Modern, cutting-edge. Think: Startups, AI/ML, Product." },
  { value: "creative", label: "Creative", description: "Design & strategy. Refined, confident. Think: Consulting, Coaching, Creative roles." },
];

export interface QuestionnaireData {
  step1: {
    fullName: string;
    currentTitle: string;
    email: string;
    phone: string;
    linkedinUrl: string;
    location: string;
  };
  step2: {
    professionalSummary: string;
    careerHistory?: Array<{
      company: string;
      title: string;
      years: string;
      achievements: string;
    }>;
  };
  step3: {
    resumeUrl: string;
  };
  step4: {
    stories: Array<{
      title: string;
      challenge: string;
      approach: string;
      result: string;
    }>;
  };
  step5: {
    achievements: string;
  };
  step6: {
    technicalSkills: string;
  };
  step7: {
    communicationStyle: string;
    wordsUsedOften: string;
    wordsAvoided: string;
    writingSample: string;
  };
  step8: {
    questions: Array<{
      question: string;
      answer: string;
    }>;
  };
  step9: {
    objections: Array<{
      objection: string;
      response: string;
    }>;
  };
  step10: {
    brandingTheme: string;
    headshot: string;
    introVideo: string;
    cvResume: string;
  };
  step11: {
    suggestedQuestions: string;
    specialInstructions: string;
    easterEgg: string;
  };
}

const defaultData: QuestionnaireData = {
  step1: { fullName: "", currentTitle: "", email: "", phone: "", linkedinUrl: "", location: "" },
  step2: { 
    professionalSummary: "",
    careerHistory: [
      { company: "", title: "", years: "", achievements: "" }
    ]
  },
  step3: { resumeUrl: "" },
  step4: {
    stories: [
      { title: "", challenge: "", approach: "", result: "" },
      { title: "", challenge: "", approach: "", result: "" },
      { title: "", challenge: "", approach: "", result: "" },
    ],
  },
  step5: { achievements: "" },
  step6: { technicalSkills: "" },
  step7: { communicationStyle: "direct", wordsUsedOften: "", wordsAvoided: "", writingSample: "" },
  step8: {
    questions: [
      { question: "", answer: "" },
      { question: "", answer: "" },
      { question: "", answer: "" },
    ],
  },
  step9: {
    objections: [
      { objection: "", response: "" },
      { objection: "", response: "" },
    ],
  },
  step10: { brandingTheme: "corporate", headshot: "", introVideo: "", cvResume: "" },
  step11: { suggestedQuestions: "", specialInstructions: "", easterEgg: "" },
};

export default function QuestionnairePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<QuestionnaireData>(defaultData);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const headshotInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile: uploadHeadshot, isUploading: isUploadingHeadshot } = useUpload({
    onSuccess: (response) => updateField("step10", "headshot", response.objectPath),
    onError: (err) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });
  const { uploadFile: uploadVideo, isUploading: isUploadingVideo } = useUpload({
    onSuccess: (response) => updateField("step10", "introVideo", response.objectPath),
    onError: (err) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });
  const { uploadFile: uploadCv, isUploading: isUploadingCv } = useUpload({
    onSuccess: (response) => updateField("step10", "cvResume", response.objectPath),
    onError: (err) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  const { data: existingProfile, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (existingProfile?.questionnaireData) {
      const saved = existingProfile.questionnaireData as any;
      setData(prev => {
        const merged = { ...defaultData };
        for (const key of Object.keys(defaultData) as (keyof QuestionnaireData)[]) {
          if (saved[key]) {
            merged[key] = { ...defaultData[key], ...saved[key] } as any;
          }
        }
        if (saved.step2?.careerHistory) {
          merged.step2.careerHistory = saved.step2.careerHistory;
        }
        if (saved.step4?.stories?.length >= 3) {
          merged.step4.stories = saved.step4.stories;
        }
        if (saved.step8?.questions?.length >= 3) {
          merged.step8.questions = saved.step8.questions;
        }
        if (saved.step9?.objections?.length >= 2) {
          merged.step9.objections = saved.step9.objections;
        }
        return merged;
      });
    }
  }, [existingProfile]);

  const handleResumeUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file. If you have a Word document, save it as PDF first.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a resume under 5MB.", variant: "destructive" });
      return;
    }

    setResumeUploading(true);
    setResumeFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to parse resume");
      }

      const extracted = await response.json();

      setData(prev => ({
        ...prev,
        step1: {
          fullName: extracted.name || prev.step1.fullName,
          currentTitle: extracted.currentTitle || prev.step1.currentTitle,
          email: extracted.email || prev.step1.email,
          phone: extracted.phone || prev.step1.phone,
          linkedinUrl: extracted.linkedin || prev.step1.linkedinUrl,
          location: extracted.location || prev.step1.location,
        },
        step2: {
          professionalSummary: extracted.summary || prev.step2.professionalSummary,
          careerHistory: extracted.roles?.length > 0
            ? extracted.roles.map((r: any) => ({
                company: r.company || "",
                title: r.title || "",
                years: r.years || "",
                achievements: typeof r.achievements === "string" ? r.achievements : (r.achievements || []).join("\n"),
              }))
            : prev.step2.careerHistory,
        },
        step5: {
          achievements: extracted.achievements?.length > 0
            ? extracted.achievements.join("\n")
            : prev.step5.achievements,
        },
        step6: {
          technicalSkills: extracted.skills?.length > 0
            ? extracted.skills.join(", ")
            : prev.step6.technicalSkills,
        },
      }));

      toast({ title: "Resume analyzed", description: `Pre-filled your information from ${file.name}. Please review each section.` });
      setCurrentStep(1);
    } catch (error: any) {
      console.error("Resume upload error:", error);
      toast({ title: "Parse failed", description: error.message || "Could not parse resume. You can fill the form manually.", variant: "destructive" });
    } finally {
      setResumeUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: QuestionnaireData) => {
      await apiRequest("POST", "/api/questionnaire/save", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: QuestionnaireData) => {
      await apiRequest("POST", "/api/questionnaire/submit", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Submitted!", description: "AI is processing your content. This may take a few minutes." });
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const progress = (currentStep / STEPS.length) * 100;

  const goNext = () => {
    if (currentStep === 2) {
      const roles = data.step2.careerHistory || [];
      if (roles.length === 0 || roles.some(r => !r.company || !r.title || !r.years || !r.achievements)) {
        toast({ title: "Validation Error", description: "Please add at least one role and fill in all career history fields.", variant: "destructive" });
        return;
      }
    }
    if (currentStep < STEPS.length) {
      saveMutation.mutate(data);
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const updateField = (step: keyof QuestionnaireData, field: string, value: any) => {
    setData(d => ({ ...d, [step]: { ...(d[step] as any), [field]: value } }));
  };

  const addStory = () => {
    if (data.step4.stories.length < 10) {
      setData(d => ({
        ...d,
        step4: {
          stories: [...d.step4.stories, { title: "", challenge: "", approach: "", result: "" }],
        },
      }));
    }
  };

  const removeStory = (idx: number) => {
    if (data.step4.stories.length > 3) {
      setData(d => ({
        ...d,
        step4: { stories: d.step4.stories.filter((_, i) => i !== idx) },
      }));
    }
  };

  const updateStory = (idx: number, field: string, value: string) => {
    setData(d => ({
      ...d,
      step4: {
        stories: d.step4.stories.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
      },
    }));
  };

  const addQuestion = () => {
    if (data.step8.questions.length < 10) {
      setData(d => ({
        ...d,
        step8: {
          questions: [...d.step8.questions, { question: "", answer: "" }],
        },
      }));
    }
  };

  const removeQuestion = (idx: number) => {
    if (data.step8.questions.length > 3) {
      setData(d => ({
        ...d,
        step8: { questions: d.step8.questions.filter((_, i) => i !== idx) },
      }));
    }
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    setData(d => ({
      ...d,
      step8: {
        questions: d.step8.questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
      },
    }));
  };

  const addObjection = () => {
    if (data.step9.objections.length < 10) {
      setData(d => ({
        ...d,
        step9: {
          objections: [...d.step9.objections, { objection: "", response: "" }],
        },
      }));
    }
  };

  const removeObjection = (idx: number) => {
    if (data.step9.objections.length > 2) {
      setData(d => ({
        ...d,
        step9: { objections: d.step9.objections.filter((_, i) => i !== idx) },
      }));
    }
  };

  const updateObjection = (idx: number, field: string, value: string) => {
    setData(d => ({
      ...d,
      step9: {
        objections: d.step9.objections.map((o, i) => (i === idx ? { ...o, [field]: value } : o)),
      },
    }));
  };

  const addCareerRole = () => {
    const roles = data.step2.careerHistory || [];
    if (roles.length < 10) {
      setData(d => ({
        ...d,
        step2: {
          ...d.step2,
          careerHistory: [...roles, { company: "", title: "", years: "", achievements: "" }],
        },
      }));
    }
  };

  const removeCareerRole = (idx: number) => {
    const roles = data.step2.careerHistory || [];
    if (roles.length > 1) {
      setData(d => ({
        ...d,
        step2: {
          ...d.step2,
          careerHistory: roles.filter((_, i) => i !== idx),
        },
      }));
    }
  };

  const updateCareerRole = (idx: number, field: string, value: string) => {
    const roles = data.step2.careerHistory || [];
    setData(d => ({
      ...d,
      step2: {
        ...d.step2,
        careerHistory: roles.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
      },
    }));
  };

  const stepLabel = `STEP_${String(currentStep).padStart(2, "0")}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E8E8E3] flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <Loader2 className="h-8 w-8 animate-spin text-black/40" />
      </div>
    );
  }

  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-[#E8E8E3] text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <nav className="sticky top-0 z-50 border-b-[3px] border-black bg-[#D1D1CC]">
          <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <Link href="/dashboard">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 bg-[#22C55E] border-[3px] border-black flex items-center justify-center font-bold text-black text-xl">
                  P
                </div>
                <span className="text-xl font-bold tracking-tight">Context Ingestion</span>
              </div>
            </Link>
          </div>
        </nav>

        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Context Ingestion</h1>
            <p className="mono text-sm text-black/60 uppercase tracking-wider">Building your career proxy</p>
          </div>

          <div className="mb-8 p-4 border-[3px] border-black bg-white">
            <div className="flex items-center justify-between mono text-xs">
              <span>STEP_00 &bull; OPTIONAL</span>
              <span>PROGRESS: 0%</span>
            </div>
            <div className="mt-2 h-2 bg-black/10 border-2 border-black">
              <div className="h-full bg-[#22C55E]" style={{ width: "0%" }} />
            </div>
          </div>

          <div className="bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-3xl font-bold mb-4">Upload Resume (Optional)</h2>
            <p className="text-black/70 mb-6">
              Upload your PDF resume and we'll extract your career data to pre-fill the questionnaire.
              This saves approximately 15 minutes of typing.
            </p>

            <div className="bg-[#93C5FD]/20 border-2 border-[#93C5FD] p-4 mb-6 mono text-sm">
              <div className="font-bold mb-1">WHAT_WE_EXTRACT:</div>
              <div className="text-black/70">
                &bull; Contact info (name, email, location)<br/>
                &bull; Career history (titles, companies, dates, achievements)<br/>
                &bull; Skills and education<br/>
                <br/>
                You'll still need to add war stories and preferences manually.
              </div>
            </div>

            <input
              type="file"
              ref={resumeInputRef}
              className="hidden"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleResumeUpload(f);
                e.target.value = "";
              }}
              data-testid="input-resume-upload"
            />

            <div
              className="border-2 border-dashed border-black bg-[#E8E8E3]/50 p-12 text-center mb-6 cursor-pointer hover:bg-[#E8E8E3] transition-colors"
              onClick={() => !resumeUploading && resumeInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = e.dataTransfer.files?.[0];
                if (f) handleResumeUpload(f);
              }}
              data-testid="dropzone-resume"
            >
              <div className="w-20 h-20 bg-[#E8A75D] border-[3px] border-black mx-auto mb-4 flex items-center justify-center">
                {resumeUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-black" />
                ) : (
                  <FileText className="h-8 w-8 text-black" />
                )}
              </div>

              {resumeUploading ? (
                <>
                  <p className="mono text-sm font-bold mb-2">EXTRACTING DATA...</p>
                  <p className="mono text-xs text-black/60">{resumeFileName}</p>
                  <p className="mono text-xs text-black/40 mt-2">This may take 10-15 seconds</p>
                </>
              ) : (
                <>
                  <p className="mono text-sm mb-4">Drag & drop PDF or click to upload</p>
                  <span className="bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase inline-block hover:bg-[#16A34A] transition-colors">
                    CHOOSE FILE
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              disabled={resumeUploading}
              className="w-full bg-white text-black px-6 py-3 font-bold border-[3px] border-black mono uppercase hover:bg-black/5 transition-colors disabled:opacity-50"
              data-testid="button-skip-resume"
            >
              SKIP &mdash; FILL MANUALLY &rarr;
            </button>

            <p className="text-xs text-black/40 mt-4 mono text-center uppercase tracking-wider">
              PDF only &bull; Max size: 5MB
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8E8E3] text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav className="sticky top-0 z-50 border-b-[3px] border-black bg-[#D1D1CC]">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-[#22C55E] border-[3px] border-black flex items-center justify-center font-bold text-black text-xl">
                P
              </div>
              <span className="text-xl font-bold tracking-tight" data-testid="text-context-ingestion">Context Ingestion</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="mono text-xs uppercase tracking-wider text-black/50 border-[2px] border-black bg-white px-3 py-1">
              {saveMutation.isPending ? "SAVING..." : "AUTO_SAVED"}
            </span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-4 border-[3px] border-black bg-white p-4">
          <p className="mono text-sm text-black/60">
            Please complete this form so we can build a personalised experience that represents you authentically. 
            Your own Digital Twin (AI CV). Do not rush, take your time.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="mono text-sm text-black/50 uppercase tracking-wider">{stepLabel}</span>
              <h2 className="text-xl font-bold">{STEPS[currentStep - 1].title}</h2>
            </div>
            <span className="mono text-sm text-black/60 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="border-[3px] border-black bg-white h-4 relative" data-testid="progress-questionnaire">
            <div
              className="h-full bg-[#22C55E] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mono text-xs text-black/50 mt-2 uppercase tracking-wider">{STEPS[currentStep - 1].description}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Full Name *</label>
                    <input
                      value={data.step1.fullName}
                      onChange={e => updateField("step1", "fullName", e.target.value)}
                      placeholder="Jane Smith"
                      data-testid="input-fullname"
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Current Title *</label>
                    <input
                      value={data.step1.currentTitle}
                      onChange={e => updateField("step1", "currentTitle", e.target.value)}
                      placeholder="Senior Product Manager"
                      data-testid="input-current-title"
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Email Address</label>
                    <input
                      type="email"
                      value={data.step1.email}
                      onChange={e => updateField("step1", "email", e.target.value)}
                      placeholder="you@example.com"
                      data-testid="input-email"
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Phone Number (Include Country Code) *</label>
                    <input
                      value={data.step1.phone}
                      onChange={e => updateField("step1", "phone", e.target.value)}
                      placeholder="+44 7700 900000"
                      data-testid="input-phone"
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">LinkedIn URL</label>
                    <input
                      value={data.step1.linkedinUrl}
                      onChange={e => updateField("step1", "linkedinUrl", e.target.value)}
                      placeholder="linkedin.com/in/yourname"
                      data-testid="input-linkedin"
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Location (City, Country) *</label>
                    <input
                      value={data.step1.location}
                      onChange={e => updateField("step1", "location", e.target.value)}
                      placeholder="London, United Kingdom"
                      data-testid="input-location"
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="space-y-5">
                    <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                      <p className="mono text-sm text-black/60">
                        In a few paragraphs, describe your positioning statement (what you do and who you help) 
                        and your Superpower / Differentiator (your unique angle - what makes you different from others with similar titles).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="mono text-xs uppercase tracking-wider text-black/60 block">Professional Summary & Superpower *</label>
                      <textarea
                        value={data.step2.professionalSummary}
                        onChange={e => updateField("step2", "professionalSummary", e.target.value)}
                        placeholder="Describe your positioning statement and what makes you uniquely different..."
                        className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[150px] resize-y"
                        data-testid="input-professional-summary"
                      />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg font-bold">Career History</h3>
                        <p className="mono text-xs text-black/50 uppercase tracking-wider">List your career timeline with key achievements for each role</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {data.step2.careerHistory?.map((role, ri) => (
                        <div key={ri} className="border-[3px] border-black bg-white p-5 space-y-4 relative">
                          {data.step2.careerHistory!.length > 1 && (
                            <button
                              className="absolute top-3 right-3 text-black/40 hover:text-red-600"
                              onClick={() => removeCareerRole(ri)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="mono text-xs uppercase tracking-wider text-black/60 block">Company Name *</label>
                              <input
                                value={role.company}
                                onChange={e => updateCareerRole(ri, "company", e.target.value)}
                                placeholder="e.g. Google"
                                className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="mono text-xs uppercase tracking-wider text-black/60 block">Job Title *</label>
                              <input
                                value={role.title}
                                onChange={e => updateCareerRole(ri, "title", e.target.value)}
                                placeholder="e.g. Senior Manager"
                                className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="mono text-xs uppercase tracking-wider text-black/60 block">Years *</label>
                            <input
                              value={role.years}
                              onChange={e => updateCareerRole(ri, "years", e.target.value)}
                              placeholder="2020 - 2025 or 2020 - Present"
                              className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="mono text-xs uppercase tracking-wider text-black/60 block">Key Achievements *</label>
                            <textarea
                              value={role.achievements}
                              onChange={e => updateCareerRole(ri, "achievements", e.target.value)}
                              placeholder="List 2-3 key achievements, one per line"
                              className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[100px] resize-y"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {(!data.step2.careerHistory || data.step2.careerHistory.length < 10) && (
                      <button
                        onClick={addCareerRole}
                        className="w-full border-2 border-dashed border-black py-3 mono text-sm uppercase tracking-wider text-black/60 hover:bg-black/5 flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add Another Role
                      </button>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                    <p className="mono text-sm text-black/60">
                      Provide a link to your most recent resume/CV. This helps the AI understand your full career history.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Resume / CV URL *</label>
                    <input
                      value={data.step3.resumeUrl}
                      onChange={e => updateField("step3", "resumeUrl", e.target.value)}
                      placeholder="https://drive.google.com/file/d/... or link to your CV"
                      data-testid="input-resume-url"
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                    <p className="mono text-xs text-black/40">
                      You can use Google Drive, Dropbox, or any file hosting service. Make sure the link is publicly accessible.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                    <p className="mono text-sm text-black/60">
                      A professional war story is a firsthand account of a high-stakes, challenging work experience.
                      Don't worry about grammar. Brain dump the details. The more context you give (the 'why', the political pressure, 
                      the specific trade-offs), the smarter your AI will be. Minimum 3 required.
                    </p>
                  </div>
                  {data.step4.stories.map((story, si) => (
                    <div key={si} className="border-[3px] border-black bg-white p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-bold">War Story {si + 1} {si < 3 && "*"}</h3>
                        {data.step4.stories.length > 3 && (
                          <button onClick={() => removeStory(si)} className="text-black/40 hover:text-red-600" data-testid={`button-remove-story-${si}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="mono text-xs uppercase tracking-wider text-black/60 block">Story Title {si < 3 && "*"}</label>
                        <input
                          value={story.title}
                          onChange={e => updateStory(si, "title", e.target.value)}
                          placeholder={si === 0 ? "e.g., 'The $100M Contingent Workforce Transformation'" : "Enter a descriptive title"}
                          data-testid={`input-story-title-${si}`}
                          className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="mono text-xs uppercase tracking-wider text-black/60 block">Challenge (What was the problem or situation? 3-4 sentences) {si < 3 && "*"}</label>
                        <textarea
                          value={story.challenge}
                          onChange={e => updateStory(si, "challenge", e.target.value)}
                          placeholder="What was the problem or situation?"
                          className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[100px] resize-y"
                          data-testid={`input-challenge-${si}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="mono text-xs uppercase tracking-wider text-black/60 block">Approach (What did YOU specifically do? 3-4 sentences with actions) {si < 3 && "*"}</label>
                        <textarea
                          value={story.approach}
                          onChange={e => updateStory(si, "approach", e.target.value)}
                          placeholder="What did you do specifically?"
                          className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[100px] resize-y"
                          data-testid={`input-approach-${si}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="mono text-xs uppercase tracking-wider text-black/60 block">Result (What was the measurable outcome? Include metrics: %, $, etc.) {si < 3 && "*"}</label>
                        <textarea
                          value={story.result}
                          onChange={e => updateStory(si, "result", e.target.value)}
                          placeholder="What was the measurable outcome?"
                          className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[80px] resize-y"
                          data-testid={`input-result-${si}`}
                        />
                      </div>
                    </div>
                  ))}
                  {data.step4.stories.length < 10 && (
                    <button
                      onClick={addStory}
                      className="border-2 border-dashed border-black py-3 px-6 mono text-sm uppercase tracking-wider text-black/60 hover:bg-black/5 flex items-center gap-2"
                      data-testid="button-add-story"
                    >
                      <Plus className="h-4 w-4" /> Add Another War Story
                    </button>
                  )}
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-5">
                  <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                    <p className="mono text-sm text-black/60">
                      List your 5-10 most quantifiable achievements, one per line.
                    </p>
                    <p className="mono text-xs text-black/40 mt-1 italic">
                      Example: "Managed $100M+ contingent workforce spend"
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Key Metrics & Achievements *</label>
                    <textarea
                      value={data.step5.achievements}
                      onChange={e => updateField("step5", "achievements", e.target.value)}
                      placeholder={"Managed $100M+ contingent workforce spend\nReduced time-to-hire by 40%\nLed a team of 25+ engineers\n..."}
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[200px] resize-y"
                      data-testid="input-achievements"
                    />
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-5">
                  <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                    <p className="mono text-sm text-black/60">
                      List platforms, tools, and methodologies you're proficient in.
                      If it's already in your CV, you can skip this.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Technical Skills & Tools</label>
                    <textarea
                      value={data.step6.technicalSkills}
                      onChange={e => updateField("step6", "technicalSkills", e.target.value)}
                      placeholder="e.g., Python, Salesforce, Agile, Google Analytics, SAP, Workday..."
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[150px] resize-y"
                      data-testid="input-technical-skills"
                    />
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">How would you describe your general communication style? *</label>
                    <select
                      value={data.step7.communicationStyle}
                      onChange={e => updateField("step7", "communicationStyle", e.target.value)}
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                      data-testid="select-communication-style"
                    >
                      {COMMUNICATION_STYLES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Words/phrases you USE often *</label>
                    <textarea
                      value={data.step7.wordsUsedOften}
                      onChange={e => updateField("step7", "wordsUsedOften", e.target.value)}
                      placeholder="e.g., 'levers', 'trade-offs', 'at scale', 'north star'..."
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[80px] resize-y"
                      data-testid="input-words-used"
                    />
                    <p className="mono text-xs text-black/40">
                      Hint: Copy some of your emails and ChatGPT will find these for you
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Words/phrases you AVOID *</label>
                    <textarea
                      value={data.step7.wordsAvoided}
                      onChange={e => updateField("step7", "wordsAvoided", e.target.value)}
                      placeholder="e.g., 'synergy', 'circle back', 'low-hanging fruit'..."
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[80px] resize-y"
                      data-testid="input-words-avoided"
                    />
                    <p className="mono text-xs text-black/40">
                      Hint: Think of what annoys you when others use it in a work setting
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Sample of your actual writing</label>
                    <textarea
                      value={data.step7.writingSample}
                      onChange={e => updateField("step7", "writingSample", e.target.value)}
                      placeholder="Paste an email, LinkedIn post, or professional document excerpt you've written..."
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[120px] resize-y"
                      data-testid="input-writing-sample"
                    />
                  </div>
                </div>
              )}

              {currentStep === 8 && (
                <div className="space-y-6">
                  <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                    <p className="mono text-sm text-black/60">
                      What questions do you expect visitors to ask? How should your AI Twin respond?
                      Think about what you've been asked in interviews.
                    </p>
                  </div>
                  {data.step8.questions.map((q, qi) => (
                    <div key={qi} className="border-[3px] border-black bg-white p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-bold">Question {qi + 1} {qi < 3 && "*"}</h3>
                        {data.step8.questions.length > 3 && (
                          <button onClick={() => removeQuestion(qi)} className="text-black/40 hover:text-red-600" data-testid={`button-remove-question-${qi}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="mono text-xs uppercase tracking-wider text-black/60 block">Question {qi < 3 && "*"}</label>
                        <input
                          value={q.question}
                          onChange={e => updateQuestion(qi, "question", e.target.value)}
                          placeholder={
                            qi === 0
                              ? "What's your leadership philosophy?"
                              : qi === 1
                              ? "How do you handle conflict in teams?"
                              : qi === 2
                              ? "What's your biggest professional achievement?"
                              : "Enter a question"
                          }
                          data-testid={`input-question-${qi}`}
                          className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="mono text-xs uppercase tracking-wider text-black/60 block">Key Points for AI Twin's Response {qi < 3 && "*"}</label>
                        <textarea
                          value={q.answer}
                          onChange={e => updateQuestion(qi, "answer", e.target.value)}
                          placeholder="Describe how you'd answer this in your own authentic voice"
                          className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[80px] resize-y"
                          data-testid={`input-answer-${qi}`}
                        />
                      </div>
                    </div>
                  ))}
                  {data.step8.questions.length < 10 && (
                    <button
                      onClick={addQuestion}
                      className="border-2 border-dashed border-black py-3 px-6 mono text-sm uppercase tracking-wider text-black/60 hover:bg-black/5 flex items-center gap-2"
                      data-testid="button-add-question"
                    >
                      <Plus className="h-4 w-4" /> Add Another Question
                    </button>
                  )}
                </div>
              )}

              {currentStep === 9 && (
                <div className="space-y-6">
                  <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                    <p className="mono text-sm text-black/60">
                      Think of potential objection scenarios that interviewers ask.
                    </p>
                    <p className="mono text-xs text-black/40 mt-1 italic">
                      e.g., "You don't have experience in X industry"
                    </p>
                  </div>
                  {data.step9.objections.map((obj, oi) => (
                    <div key={oi} className="border-[3px] border-black bg-white p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-bold">Objection {oi + 1} {oi < 1 && "*"}</h3>
                        {data.step9.objections.length > 2 && (
                          <button onClick={() => removeObjection(oi)} className="text-black/40 hover:text-red-600" data-testid={`button-remove-objection-${oi}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="mono text-xs uppercase tracking-wider text-black/60 block">Potential Objection {oi < 1 && "*"}</label>
                        <input
                          value={obj.objection}
                          onChange={e => updateObjection(oi, "objection", e.target.value)}
                          placeholder={oi === 0 ? "e.g., You don't have experience in X industry" : oi === 1 ? "e.g., You've never done Y specifically" : "Enter an objection"}
                          data-testid={`input-objection-${oi}`}
                          className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="mono text-xs uppercase tracking-wider text-black/60 block">Your Response (How would you address this concern?)</label>
                        <textarea
                          value={obj.response}
                          onChange={e => updateObjection(oi, "response", e.target.value)}
                          placeholder="How would you address this concern?"
                          className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[80px] resize-y"
                          data-testid={`input-objection-response-${oi}`}
                        />
                      </div>
                    </div>
                  ))}
                  {data.step9.objections.length < 10 && (
                    <button
                      onClick={addObjection}
                      className="border-2 border-dashed border-black py-3 px-6 mono text-sm uppercase tracking-wider text-black/60 hover:bg-black/5 flex items-center gap-2"
                      data-testid="button-add-objection"
                    >
                      <Plus className="h-4 w-4" /> Add Another Objection
                    </button>
                  )}
                </div>
              )}

              {currentStep === 10 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Branding Theme *</label>
                    <div className="grid gap-3">
                      {BRANDING_THEMES.map(theme => (
                        <div
                          key={theme.value}
                          className={`cursor-pointer border-[3px] p-4 flex items-start gap-3 transition-colors ${
                            data.step10.brandingTheme === theme.value
                              ? "border-[#22C55E] bg-[#22C55E]/5"
                              : "border-black bg-white hover:bg-black/5"
                          }`}
                          onClick={() => updateField("step10", "brandingTheme", theme.value)}
                          data-testid={`card-theme-${theme.value}`}
                        >
                          <div className={`mt-1 h-4 w-4 border-2 flex items-center justify-center shrink-0 ${
                            data.step10.brandingTheme === theme.value ? "border-[#22C55E]" : "border-black/30"
                          }`}>
                            {data.step10.brandingTheme === theme.value && <div className="h-2 w-2 bg-[#22C55E]" />}
                          </div>
                          <div>
                            <p className="font-bold">{theme.label}</p>
                            <p className="mono text-xs text-black/60">{theme.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Professional Headshot</label>
                    <input
                      type="file"
                      ref={headshotInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > 5 * 1024 * 1024) {
                            toast({ title: "File too large", description: "Max 5MB" });
                            return;
                          }
                          await uploadHeadshot(f);
                        }
                        e.target.value = "";
                      }}
                    />
                    {data.step10.headshot ? (
                      <div className="flex items-center gap-3">
                        <img src={`/api/uploads/${data.step10.headshot}`} alt="Headshot preview" className="h-16 w-16 border-2 border-black object-cover" />
                        <button onClick={() => updateField("step10", "headshot", "")} className="text-black/40 hover:text-red-600" data-testid="button-remove-headshot">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => headshotInputRef.current?.click()}
                        disabled={isUploadingHeadshot}
                        className="border-2 border-dashed border-black py-3 px-6 mono text-sm uppercase tracking-wider text-black/60 hover:bg-black/5 flex items-center gap-2"
                        data-testid="button-upload-headshot"
                      >
                        {isUploadingHeadshot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        Upload Headshot
                      </button>
                    )}
                    <p className="mono text-xs text-black/40">High-resolution professional photo. Square crop works best.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Intro Video (60-90s)</label>
                    <input
                      type="file"
                      ref={videoInputRef}
                      className="hidden"
                      accept="video/mp4,video/webm"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > 50 * 1024 * 1024) {
                            toast({ title: "File too large", description: "Max 50MB" });
                            return;
                          }
                          await uploadVideo(f);
                        }
                        e.target.value = "";
                      }}
                    />
                    {data.step10.introVideo ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 mono text-sm text-black/60">
                          <Video className="h-4 w-4" />
                          <span>Video uploaded</span>
                        </div>
                        <button onClick={() => updateField("step10", "introVideo", "")} className="text-black/40 hover:text-red-600" data-testid="button-remove-video">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploadingVideo}
                        className="border-2 border-dashed border-black py-3 px-6 mono text-sm uppercase tracking-wider text-black/60 hover:bg-black/5 flex items-center gap-2"
                        data-testid="button-upload-video"
                      >
                        {isUploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                        Upload Intro Video (60-90s)
                      </button>
                    )}
                    <p className="mono text-xs text-black/40">60-90 second introduction. MP4 format recommended, max 50MB.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">CV / Resume</label>
                    <input
                      type="file"
                      ref={cvInputRef}
                      className="hidden"
                      accept="application/pdf,.doc,.docx"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > 10 * 1024 * 1024) {
                            toast({ title: "File too large", description: "Max 10MB" });
                            return;
                          }
                          await uploadCv(f);
                        }
                        e.target.value = "";
                      }}
                    />
                    {data.step10.cvResume ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 mono text-sm text-black/60">
                          <FileText className="h-4 w-4" />
                          <span>CV uploaded</span>
                        </div>
                        <button onClick={() => updateField("step10", "cvResume", "")} className="text-black/40 hover:text-red-600" data-testid="button-remove-cv">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => cvInputRef.current?.click()}
                        disabled={isUploadingCv}
                        className="border-2 border-dashed border-black py-3 px-6 mono text-sm uppercase tracking-wider text-black/60 hover:bg-black/5 flex items-center gap-2"
                        data-testid="button-upload-cv"
                      >
                        {isUploadingCv ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Upload CV / Resume
                      </button>
                    )}
                    <p className="mono text-xs text-black/40">PDF format recommended.</p>
                  </div>
                </div>
              )}

              {currentStep === 11 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Suggested Questions for Chatbot Home Screen *</label>
                    <textarea
                      value={data.step11.suggestedQuestions}
                      onChange={e => updateField("step11", "suggestedQuestions", e.target.value)}
                      placeholder={"Provide 3-4 questions visitors can click to start the conversation.\ne.g.:\nWhat's your leadership style?\nTell me about your biggest career win\nWhat makes you different from other candidates?\nHow do you approach building teams?"}
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[120px] resize-y"
                      data-testid="input-suggested-questions"
                    />
                    <p className="mono text-xs text-black/40">
                      Think of these like the starter prompts in ChatGPT's new chat window
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">Special Instructions for Implementation</label>
                    <textarea
                      value={data.step11.specialInstructions}
                      onChange={e => updateField("step11", "specialInstructions", e.target.value)}
                      placeholder={"e.g., You want emphasis on sales capability, not just ops\ne.g., Avoid mentioning Company X - left on bad terms"}
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[100px] resize-y"
                      data-testid="input-special-instructions"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-xs uppercase tracking-wider text-black/60 block">The 'Easter Egg'</label>
                    <textarea
                      value={data.step11.easterEgg}
                      onChange={e => updateField("step11", "easterEgg", e.target.value)}
                      placeholder={"Is there a hidden hobby, favorite book, or personal detail you want the AI to mention ONLY if someone asks about it?\n\ne.g., 'Do you have any hobbies?' -> 'I actually compete in triathlons.'"}
                      className="w-full border-2 border-black bg-white px-4 py-3 mono text-sm focus:outline-none focus:border-[#22C55E] min-h-[100px] resize-y"
                      data-testid="input-easter-egg"
                    />
                  </div>
                </div>
              )}

              {currentStep === 12 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Review Your Submission</h3>
                    <div className="space-y-4">
                      <ReviewSection title="Basic Information" complete={!!data.step1.fullName && !!data.step1.currentTitle}>
                        <p className="mono text-sm text-black/60">{data.step1.fullName} - {data.step1.currentTitle}</p>
                        {data.step1.location && <p className="mono text-xs text-black/40">{data.step1.location}</p>}
                      </ReviewSection>

                      <ReviewSection title="Professional Summary" complete={!!data.step2.professionalSummary}>
                        <p className="mono text-sm text-black/60 line-clamp-2">{data.step2.professionalSummary || "Not provided"}</p>
                      </ReviewSection>

                      <ReviewSection title="Career History" complete={!!data.step3.resumeUrl}>
                        <p className="mono text-sm text-black/60">{data.step3.resumeUrl ? "Resume linked" : "No resume provided"}</p>
                      </ReviewSection>

                      <ReviewSection title="War Stories" complete={data.step4.stories.filter(s => s.title).length >= 3}>
                        <p className="mono text-sm text-black/60">{data.step4.stories.filter(s => s.title).length} stories provided</p>
                      </ReviewSection>

                      <ReviewSection title="Key Metrics & Achievements" complete={!!data.step5.achievements}>
                        <p className="mono text-sm text-black/60">{data.step5.achievements ? `${data.step5.achievements.split("\n").filter(Boolean).length} achievements listed` : "Not provided"}</p>
                      </ReviewSection>

                      <ReviewSection title="Technical Skills" complete={!!data.step6.technicalSkills}>
                        <p className="mono text-sm text-black/60">{data.step6.technicalSkills ? "Skills listed" : "Not provided (optional)"}</p>
                      </ReviewSection>

                      <ReviewSection title="Voice & Personality" complete={!!data.step7.communicationStyle}>
                        <p className="mono text-sm text-black/60">Style: {COMMUNICATION_STYLES.find(s => s.value === data.step7.communicationStyle)?.label || "Not set"}</p>
                      </ReviewSection>

                      <ReviewSection title="Common Questions" complete={data.step8.questions.filter(q => q.question).length >= 3}>
                        <p className="mono text-sm text-black/60">{data.step8.questions.filter(q => q.question).length} Q&A pairs provided</p>
                      </ReviewSection>

                      <ReviewSection title="Objection Handling" complete={data.step9.objections.filter(o => o.objection).length >= 1}>
                        <p className="mono text-sm text-black/60">{data.step9.objections.filter(o => o.objection).length} objections addressed</p>
                      </ReviewSection>

                      <ReviewSection title="Branding & Assets" complete={!!data.step10.brandingTheme}>
                        <p className="mono text-sm text-black/60">
                          Theme: {BRANDING_THEMES.find(t => t.value === data.step10.brandingTheme)?.label || "Not selected"}
                          {data.step10.headshot && " | Headshot uploaded"}
                          {data.step10.introVideo && " | Video uploaded"}
                          {data.step10.cvResume && " | CV uploaded"}
                        </p>
                      </ReviewSection>

                      <ReviewSection title="Chatbot Setup" complete={!!data.step11.suggestedQuestions}>
                        <p className="mono text-sm text-black/60">
                          {data.step11.suggestedQuestions ? "Starter questions configured" : "Not configured"}
                          {data.step11.easterEgg ? " | Easter egg set" : ""}
                        </p>
                      </ReviewSection>
                    </div>
                  </div>

                  <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                    <h4 className="font-bold mb-2">What happens next?</h4>
                    <ol className="list-decimal list-inside space-y-1 mono text-sm text-black/60">
                      <li>AI processes your content to build your Digital Twin</li>
                      <li>Your AI CV is generated (typically a few minutes)</li>
                      <li>Preview your Digital Twin and make adjustments</li>
                      <li>Publish and share your link</li>
                    </ol>
                  </div>

                  <button
                    onClick={() => submitMutation.mutate(data)}
                    disabled={submitMutation.isPending || !data.step1.fullName || !data.step1.currentTitle}
                    className="w-full bg-[#22C55E] text-black py-4 font-bold mono uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
                    data-testid="button-submit-questionnaire"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> PROCESSING...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> SUBMIT & GENERATE MY DIGITAL TWIN
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {currentStep < 12 && (
          <div className="flex justify-between gap-4 mt-8 flex-wrap">
            <button
              onClick={goBack}
              disabled={currentStep === 1}
              className="bg-white text-black px-6 py-3 font-bold border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
              data-testid="button-prev-step"
            >
              <ArrowLeft className="h-4 w-4" /> PREVIOUS
            </button>
            <button
              onClick={goNext}
              className="bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
              data-testid="button-next-step"
            >
              NEXT <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
        {currentStep === 12 && (
          <div className="mt-4">
            <button
              onClick={goBack}
              className="bg-white text-black px-6 py-3 font-bold border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
              data-testid="button-prev-step"
            >
              <ArrowLeft className="h-4 w-4" /> PREVIOUS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewSection({ title, complete, children }: { title: string; complete: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b-2 border-black/10 last:border-0">
      <div className="mt-0.5">
        {complete ? (
          <div className="h-5 w-5 bg-[#22C55E] border-2 border-black flex items-center justify-center">
            <CheckCircle className="h-3 w-3 text-black" />
          </div>
        ) : (
          <div className="h-5 w-5 border-2 border-black/30" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm">{title}</h4>
        {children}
      </div>
    </div>
  );
}
