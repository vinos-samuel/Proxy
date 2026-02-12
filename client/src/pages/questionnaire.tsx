import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Bot, ArrowRight, ArrowLeft, Plus, Trash2, Loader2, CheckCircle,
  User, Briefcase, BookOpen, MessageSquare, Shield, Palette,
  Upload, Send, Sparkles, Target, Wrench, Mic, HelpCircle, Terminal,
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
  { value: "executive", label: "Executive", description: "Navy, gold accents, serif typography — boardroom-ready" },
  { value: "futurist", label: "Futurist", description: "Dark mode, purple/cyan accents, clean sans-serif — tech-forward" },
  { value: "minimalist", label: "Minimalist", description: "Black & white, Helvetica, maximum whitespace — let results speak" },
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
  step10: { brandingTheme: "executive", headshot: "", introVideo: "", cvResume: "" },
  step11: { suggestedQuestions: "", specialInstructions: "", easterEgg: "" },
};

export default function QuestionnairePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<QuestionnaireData>(defaultData);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Terminal className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Context Ingestion</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {saveMutation.isPending ? "Saving..." : "Auto-saved"}
            </Badge>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-4 p-4 rounded-md border border-white/10 bg-white/5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            Please complete this form so we can build a personalised experience that represents you authentically. 
            Your own Digital Twin (AI CV). Do not rush, take your time.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <h2 className="text-xl font-semibold">Step {currentStep}: {STEPS[currentStep - 1].title}</h2>
            <span className="text-sm text-muted-foreground">{currentStep} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" data-testid="progress-questionnaire" />
          <p className="text-sm text-muted-foreground mt-2">{STEPS[currentStep - 1].description}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* STEP 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={data.step1.fullName}
                    onChange={e => updateField("step1", "fullName", e.target.value)}
                    placeholder="Jane Smith"
                    data-testid="input-fullname"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Title *</Label>
                  <Input
                    value={data.step1.currentTitle}
                    onChange={e => updateField("step1", "currentTitle", e.target.value)}
                    placeholder="Senior Product Manager"
                    data-testid="input-current-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={data.step1.email}
                    onChange={e => updateField("step1", "email", e.target.value)}
                    placeholder="you@example.com"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number (Include Country Code) *</Label>
                  <Input
                    value={data.step1.phone}
                    onChange={e => updateField("step1", "phone", e.target.value)}
                    placeholder="+44 7700 900000"
                    data-testid="input-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={data.step1.linkedinUrl}
                    onChange={e => updateField("step1", "linkedinUrl", e.target.value)}
                    placeholder="linkedin.com/in/yourname"
                    data-testid="input-linkedin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location (City, Country) *</Label>
                  <Input
                    value={data.step1.location}
                    onChange={e => updateField("step1", "location", e.target.value)}
                    placeholder="London, United Kingdom"
                    data-testid="input-location"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Professional Summary & Career History */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="space-y-5">
                  <div className="p-4 rounded-md border border-white/10 bg-white/5">
                    <p className="text-sm text-muted-foreground">
                      In a few paragraphs, describe your positioning statement (what you do and who you help) 
                      and your Superpower / Differentiator (your unique angle - what makes you different from others with similar titles).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Professional Summary & Superpower *</Label>
                    <Textarea
                      value={data.step2.professionalSummary}
                      onChange={e => updateField("step2", "professionalSummary", e.target.value)}
                      placeholder="Describe your positioning statement and what makes you uniquely different..."
                      className="min-h-[150px]"
                      data-testid="input-professional-summary"
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Career History</h3>
                      <p className="text-sm text-muted-foreground">List your career timeline with key achievements for each role</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data.step2.careerHistory?.map((role, ri) => (
                      <Card key={ri} className="bg-white/5 border-white/10 backdrop-blur-xl relative">
                        <CardContent className="p-5 space-y-4">
                          {data.step2.careerHistory!.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 hover:text-red-500" 
                              onClick={() => removeCareerRole(ri)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Company Name *</Label>
                              <Input
                                value={role.company}
                                onChange={e => updateCareerRole(ri, "company", e.target.value)}
                                placeholder="e.g. Google"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Job Title *</Label>
                              <Input
                                value={role.title}
                                onChange={e => updateCareerRole(ri, "title", e.target.value)}
                                placeholder="e.g. Senior Manager"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Years *</Label>
                            <Input
                              value={role.years}
                              onChange={e => updateCareerRole(ri, "years", e.target.value)}
                              placeholder="2020 - 2025 or 2020 - Present"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Key Achievements *</Label>
                            <Textarea
                              value={role.achievements}
                              onChange={e => updateCareerRole(ri, "achievements", e.target.value)}
                              placeholder="List 2-3 key achievements, one per line"
                              className="min-h-[100px]"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {(!data.step2.careerHistory || data.step2.careerHistory.length < 10) && (
                    <Button variant="ghost" onClick={addCareerRole} className="w-full border-dashed border-white/10">
                      <Plus className="mr-2 h-4 w-4" /> Add Another Role
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Career History */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <p className="text-sm text-muted-foreground">
                    Provide a link to your most recent resume/CV. This helps the AI understand your full career history.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Resume / CV URL *</Label>
                  <Input
                    value={data.step3.resumeUrl}
                    onChange={e => updateField("step3", "resumeUrl", e.target.value)}
                    placeholder="https://drive.google.com/file/d/... or link to your CV"
                    data-testid="input-resume-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can use Google Drive, Dropbox, or any file hosting service. Make sure the link is publicly accessible.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: War Stories */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <p className="text-sm text-muted-foreground">
                    A professional war story is a firsthand account of a high-stakes, challenging work experience.
                    Don't worry about grammar. Brain dump the details. The more context you give (the 'why', the political pressure, 
                    the specific trade-offs), the smarter your AI will be. Minimum 3 required.
                  </p>
                </div>
                {data.step4.stories.map((story, si) => (
                  <Card key={si} className="backdrop-blur-xl">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">War Story {si + 1} {si < 3 && "*"}</h3>
                        {data.step4.stories.length > 3 && (
                          <Button variant="ghost" size="icon" onClick={() => removeStory(si)} data-testid={`button-remove-story-${si}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Story Title {si < 3 && "*"}</Label>
                        <Input
                          value={story.title}
                          onChange={e => updateStory(si, "title", e.target.value)}
                          placeholder={si === 0 ? "e.g., 'The $100M Contingent Workforce Transformation'" : "Enter a descriptive title"}
                          data-testid={`input-story-title-${si}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Challenge (What was the problem or situation? 3-4 sentences) {si < 3 && "*"}</Label>
                        <Textarea
                          value={story.challenge}
                          onChange={e => updateStory(si, "challenge", e.target.value)}
                          placeholder="What was the problem or situation?"
                          className="min-h-[100px]"
                          data-testid={`input-challenge-${si}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Approach (What did YOU specifically do? 3-4 sentences with actions) {si < 3 && "*"}</Label>
                        <Textarea
                          value={story.approach}
                          onChange={e => updateStory(si, "approach", e.target.value)}
                          placeholder="What did you do specifically?"
                          className="min-h-[100px]"
                          data-testid={`input-approach-${si}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Result (What was the measurable outcome? Include metrics: %, $, etc.) {si < 3 && "*"}</Label>
                        <Textarea
                          value={story.result}
                          onChange={e => updateStory(si, "result", e.target.value)}
                          placeholder="What was the measurable outcome?"
                          className="min-h-[80px]"
                          data-testid={`input-result-${si}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {data.step4.stories.length < 10 && (
                  <Button variant="outline" onClick={addStory} data-testid="button-add-story">
                    <Plus className="mr-2 h-4 w-4" /> Add Another War Story
                  </Button>
                )}
              </div>
            )}

            {/* STEP 5: Key Metrics & Achievements */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <p className="text-sm text-muted-foreground">
                    List your 5-10 most quantifiable achievements, one per line.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Example: "Managed $100M+ contingent workforce spend"
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Key Metrics & Achievements *</Label>
                  <Textarea
                    value={data.step5.achievements}
                    onChange={e => updateField("step5", "achievements", e.target.value)}
                    placeholder={"Managed $100M+ contingent workforce spend\nReduced time-to-hire by 40%\nLed a team of 25+ engineers\n..."}
                    className="min-h-[200px]"
                    data-testid="input-achievements"
                  />
                </div>
              </div>
            )}

            {/* STEP 6: Technical Skills & Tools */}
            {currentStep === 6 && (
              <div className="space-y-5">
                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <p className="text-sm text-muted-foreground">
                    List platforms, tools, and methodologies you're proficient in.
                    If it's already in your CV, you can skip this.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Technical Skills & Tools</Label>
                  <Textarea
                    value={data.step6.technicalSkills}
                    onChange={e => updateField("step6", "technicalSkills", e.target.value)}
                    placeholder="e.g., Python, Salesforce, Agile, Google Analytics, SAP, Workday..."
                    className="min-h-[150px]"
                    data-testid="input-technical-skills"
                  />
                </div>
              </div>
            )}

            {/* STEP 7: Voice & Personality */}
            {currentStep === 7 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>How would you describe your general communication style? *</Label>
                  <Select
                    value={data.step7.communicationStyle}
                    onValueChange={v => updateField("step7", "communicationStyle", v)}
                  >
                    <SelectTrigger data-testid="select-communication-style">
                      <SelectValue placeholder="Choose your style" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMUNICATION_STYLES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Words/phrases you USE often *</Label>
                  <Textarea
                    value={data.step7.wordsUsedOften}
                    onChange={e => updateField("step7", "wordsUsedOften", e.target.value)}
                    placeholder="e.g., 'levers', 'trade-offs', 'at scale', 'north star'..."
                    className="min-h-[80px]"
                    data-testid="input-words-used"
                  />
                  <p className="text-xs text-muted-foreground">
                    Hint: Copy some of your emails and ChatGPT will find these for you
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Words/phrases you AVOID *</Label>
                  <Textarea
                    value={data.step7.wordsAvoided}
                    onChange={e => updateField("step7", "wordsAvoided", e.target.value)}
                    placeholder="e.g., 'synergy', 'circle back', 'low-hanging fruit'..."
                    className="min-h-[80px]"
                    data-testid="input-words-avoided"
                  />
                  <p className="text-xs text-muted-foreground">
                    Hint: Think of what annoys you when others use it in a work setting
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Sample of your actual writing</Label>
                  <Textarea
                    value={data.step7.writingSample}
                    onChange={e => updateField("step7", "writingSample", e.target.value)}
                    placeholder="Paste an email, LinkedIn post, or professional document excerpt you've written..."
                    className="min-h-[120px]"
                    data-testid="input-writing-sample"
                  />
                </div>
              </div>
            )}

            {/* STEP 8: Common Questions */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <p className="text-sm text-muted-foreground">
                    What questions do you expect visitors to ask? How should your AI Twin respond?
                    Think about what you've been asked in interviews.
                  </p>
                </div>
                {data.step8.questions.map((q, qi) => (
                  <Card key={qi} className="backdrop-blur-xl">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">Question {qi + 1} {qi < 3 && "*"}</h3>
                        {data.step8.questions.length > 3 && (
                          <Button variant="ghost" size="icon" onClick={() => removeQuestion(qi)} data-testid={`button-remove-question-${qi}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Question {qi < 3 && "*"}</Label>
                        <Input
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Key Points for AI Twin's Response {qi < 3 && "*"}</Label>
                        <Textarea
                          value={q.answer}
                          onChange={e => updateQuestion(qi, "answer", e.target.value)}
                          placeholder="Describe how you'd answer this in your own authentic voice"
                          className="min-h-[80px]"
                          data-testid={`input-answer-${qi}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {data.step8.questions.length < 10 && (
                  <Button variant="outline" onClick={addQuestion} data-testid="button-add-question">
                    <Plus className="mr-2 h-4 w-4" /> Add Another Question
                  </Button>
                )}
              </div>
            )}

            {/* STEP 9: Objection Handling */}
            {currentStep === 9 && (
              <div className="space-y-6">
                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <p className="text-sm text-muted-foreground">
                    Think of potential objection scenarios that interviewers ask.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    e.g., "You don't have experience in X industry"
                  </p>
                </div>
                {data.step9.objections.map((obj, oi) => (
                  <Card key={oi} className="backdrop-blur-xl">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">Objection {oi + 1} {oi < 1 && "*"}</h3>
                        {data.step9.objections.length > 2 && (
                          <Button variant="ghost" size="icon" onClick={() => removeObjection(oi)} data-testid={`button-remove-objection-${oi}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Potential Objection {oi < 1 && "*"}</Label>
                        <Input
                          value={obj.objection}
                          onChange={e => updateObjection(oi, "objection", e.target.value)}
                          placeholder={oi === 0 ? "e.g., You don't have experience in X industry" : oi === 1 ? "e.g., You've never done Y specifically" : "Enter an objection"}
                          data-testid={`input-objection-${oi}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Your Response (How would you address this concern?)</Label>
                        <Textarea
                          value={obj.response}
                          onChange={e => updateObjection(oi, "response", e.target.value)}
                          placeholder="How would you address this concern?"
                          className="min-h-[80px]"
                          data-testid={`input-objection-response-${oi}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {data.step9.objections.length < 10 && (
                  <Button variant="outline" onClick={addObjection} data-testid="button-add-objection">
                    <Plus className="mr-2 h-4 w-4" /> Add Another Objection
                  </Button>
                )}
              </div>
            )}

            {/* STEP 10: Branding & Assets */}
            {currentStep === 10 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Branding Theme *</Label>
                  <div className="grid gap-3">
                    {BRANDING_THEMES.map(theme => (
                      <Card
                        key={theme.value}
                        className={`cursor-pointer transition-colors ${data.step10.brandingTheme === theme.value ? "border-primary" : ""}`}
                        onClick={() => updateField("step10", "brandingTheme", theme.value)}
                        data-testid={`card-theme-${theme.value}`}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${data.step10.brandingTheme === theme.value ? "border-primary" : "border-muted-foreground/30"}`}>
                            {data.step10.brandingTheme === theme.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="font-medium">{theme.label}</p>
                            <p className="text-sm text-muted-foreground">{theme.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Professional Headshot</Label>
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
                      <img src={`/api/uploads/${data.step10.headshot}`} alt="Headshot preview" className="h-16 w-16 rounded-md object-cover" />
                      <Button variant="ghost" size="icon" onClick={() => updateField("step10", "headshot", "")} data-testid="button-remove-headshot">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => headshotInputRef.current?.click()} disabled={isUploadingHeadshot} data-testid="button-upload-headshot">
                      {isUploadingHeadshot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                      Upload Headshot
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">High-resolution professional photo. Square crop works best.</p>
                </div>

                <div className="space-y-2">
                  <Label>Intro Video (60-90s)</Label>
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Video className="h-4 w-4" />
                        <span>Video uploaded</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => updateField("step10", "introVideo", "")} data-testid="button-remove-video">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => videoInputRef.current?.click()} disabled={isUploadingVideo} data-testid="button-upload-video">
                      {isUploadingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                      Upload Intro Video (60-90s)
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">60-90 second introduction. MP4 format recommended, max 50MB.</p>
                </div>

                <div className="space-y-2">
                  <Label>CV / Resume</Label>
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>CV uploaded</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => updateField("step10", "cvResume", "")} data-testid="button-remove-cv">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => cvInputRef.current?.click()} disabled={isUploadingCv} data-testid="button-upload-cv">
                      {isUploadingCv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                      Upload CV / Resume
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">PDF format recommended.</p>
                </div>
              </div>
            )}

            {/* STEP 11: Chatbot Setup */}
            {currentStep === 11 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Suggested Questions for Chatbot Home Screen *</Label>
                  <Textarea
                    value={data.step11.suggestedQuestions}
                    onChange={e => updateField("step11", "suggestedQuestions", e.target.value)}
                    placeholder={"Provide 3-4 questions visitors can click to start the conversation.\ne.g.:\nWhat's your leadership style?\nTell me about your biggest career win\nWhat makes you different from other candidates?\nHow do you approach building teams?"}
                    className="min-h-[120px]"
                    data-testid="input-suggested-questions"
                  />
                  <p className="text-xs text-muted-foreground">
                    Think of these like the starter prompts in ChatGPT's new chat window
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Special Instructions for Implementation</Label>
                  <Textarea
                    value={data.step11.specialInstructions}
                    onChange={e => updateField("step11", "specialInstructions", e.target.value)}
                    placeholder={"e.g., You want emphasis on sales capability, not just ops\ne.g., Avoid mentioning Company X - left on bad terms"}
                    className="min-h-[100px]"
                    data-testid="input-special-instructions"
                  />
                </div>
                <div className="space-y-2">
                  <Label>The 'Easter Egg'</Label>
                  <Textarea
                    value={data.step11.easterEgg}
                    onChange={e => updateField("step11", "easterEgg", e.target.value)}
                    placeholder={"Is there a hidden hobby, favorite book, or personal detail you want the AI to mention ONLY if someone asks about it?\n\ne.g., 'Do you have any hobbies?' -> 'I actually compete in triathlons.'"}
                    className="min-h-[100px]"
                    data-testid="input-easter-egg"
                  />
                </div>
              </div>
            )}

            {/* STEP 12: Review & Submit */}
            {currentStep === 12 && (
              <div className="space-y-6">
                <Card className="backdrop-blur-xl">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Review Your Submission</h3>
                    <div className="space-y-4">
                      <ReviewSection title="Basic Information" complete={!!data.step1.fullName && !!data.step1.currentTitle}>
                        <p>{data.step1.fullName} - {data.step1.currentTitle}</p>
                        {data.step1.location && <p className="text-sm text-muted-foreground">{data.step1.location}</p>}
                      </ReviewSection>

                      <ReviewSection title="Professional Summary" complete={!!data.step2.professionalSummary}>
                        <p className="text-sm text-muted-foreground line-clamp-2">{data.step2.professionalSummary || "Not provided"}</p>
                      </ReviewSection>

                      <ReviewSection title="Career History" complete={!!data.step3.resumeUrl}>
                        <p className="text-sm text-muted-foreground">{data.step3.resumeUrl ? "Resume linked" : "No resume provided"}</p>
                      </ReviewSection>

                      <ReviewSection title="War Stories" complete={data.step4.stories.filter(s => s.title).length >= 3}>
                        <p className="text-sm text-muted-foreground">{data.step4.stories.filter(s => s.title).length} stories provided</p>
                      </ReviewSection>

                      <ReviewSection title="Key Metrics & Achievements" complete={!!data.step5.achievements}>
                        <p className="text-sm text-muted-foreground">{data.step5.achievements ? `${data.step5.achievements.split("\n").filter(Boolean).length} achievements listed` : "Not provided"}</p>
                      </ReviewSection>

                      <ReviewSection title="Technical Skills" complete={!!data.step6.technicalSkills}>
                        <p className="text-sm text-muted-foreground">{data.step6.technicalSkills ? "Skills listed" : "Not provided (optional)"}</p>
                      </ReviewSection>

                      <ReviewSection title="Voice & Personality" complete={!!data.step7.communicationStyle}>
                        <p className="text-sm text-muted-foreground">Style: {COMMUNICATION_STYLES.find(s => s.value === data.step7.communicationStyle)?.label || "Not set"}</p>
                      </ReviewSection>

                      <ReviewSection title="Common Questions" complete={data.step8.questions.filter(q => q.question).length >= 3}>
                        <p className="text-sm text-muted-foreground">{data.step8.questions.filter(q => q.question).length} Q&A pairs provided</p>
                      </ReviewSection>

                      <ReviewSection title="Objection Handling" complete={data.step9.objections.filter(o => o.objection).length >= 1}>
                        <p className="text-sm text-muted-foreground">{data.step9.objections.filter(o => o.objection).length} objections addressed</p>
                      </ReviewSection>

                      <ReviewSection title="Branding & Assets" complete={!!data.step10.brandingTheme}>
                        <p className="text-sm text-muted-foreground">
                          Theme: {BRANDING_THEMES.find(t => t.value === data.step10.brandingTheme)?.label || "Not selected"}
                          {data.step10.headshot && " • Headshot uploaded"}
                          {data.step10.introVideo && " • Video uploaded"}
                          {data.step10.cvResume && " • CV uploaded"}
                        </p>
                      </ReviewSection>

                      <ReviewSection title="Chatbot Setup" complete={!!data.step11.suggestedQuestions}>
                        <p className="text-sm text-muted-foreground">
                          {data.step11.suggestedQuestions ? "Starter questions configured" : "Not configured"}
                          {data.step11.easterEgg ? " | Easter egg set" : ""}
                        </p>
                      </ReviewSection>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <h4 className="font-medium mb-2">What happens next?</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>AI processes your content to build your Digital Twin</li>
                    <li>Your AI CV is generated (typically a few minutes)</li>
                    <li>Preview your Digital Twin and make adjustments</li>
                    <li>Publish and share your link</li>
                  </ol>
                </div>

                <Button
                  onClick={() => submitMutation.mutate(data)}
                  disabled={submitMutation.isPending || !data.step1.fullName || !data.step1.currentTitle}
                  className="w-full"
                  data-testid="button-submit-questionnaire"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Submit & Generate My Digital Twin
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep < 12 && (
          <div className="flex justify-between gap-4 mt-8 flex-wrap">
            <Button variant="outline" onClick={goBack} disabled={currentStep === 1} data-testid="button-prev-step">
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={goNext} data-testid="button-next-step">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
        {currentStep === 12 && (
          <div className="mt-4">
            <Button variant="outline" onClick={goBack} data-testid="button-prev-step">
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewSection({ title, complete, children }: { title: string; complete: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="mt-0.5">
        {complete ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium">{title}</h4>
        {children}
      </div>
    </div>
  );
}
