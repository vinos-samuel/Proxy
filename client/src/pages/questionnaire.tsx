import { useState, useEffect } from "react";
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
  User, Briefcase, BookOpen, Heart, Upload, Send, Sparkles
} from "lucide-react";
import { Link } from "wouter";

const STEPS = [
  { id: 1, title: "Identity", icon: User, description: "Who you are professionally" },
  { id: 2, title: "Career History", icon: Briefcase, description: "Your work experience" },
  { id: 3, title: "Signature Stories", icon: BookOpen, description: "Key career moments (CAR format)" },
  { id: 4, title: "Philosophy", icon: Heart, description: "Your thinking and values" },
  { id: 5, title: "Assets", icon: Upload, description: "Photo and resume" },
  { id: 6, title: "Review", icon: Send, description: "Review and submit" },
];

const TONES = [
  { value: "direct", label: "Direct & Senior" },
  { value: "warm", label: "Warm & Approachable" },
  { value: "technical", label: "Technical & Precise" },
  { value: "casual", label: "Casual & Conversational" },
];

const STORY_TYPES = [
  { value: "failure", label: "Failure / Lesson" },
  { value: "conflict", label: "Stakeholder Conflict" },
  { value: "commercial", label: "Commercial Growth" },
  { value: "influence", label: "Influence / Change Management" },
  { value: "data-driven", label: "Data-Driven Decision" },
  { value: "building", label: "Building from Zero" },
  { value: "consultative", label: "Consultative Approach" },
  { value: "buy-in", label: "Gaining Buy-In" },
];

interface QuestionnaireData {
  step1: {
    fullName: string;
    roleTitle: string;
    positioning: string;
    persona: string;
    tone: string;
  };
  step2: {
    careers: Array<{
      companyName: string;
      roleTitle: string;
      duration: string;
      facts: string[];
    }>;
  };
  step3: {
    stories: Array<{
      type: string;
      title: string;
      challenge: string;
      approach: string;
      result: string;
      scale: string;
    }>;
  };
  step4: {
    influences: string;
    limitations: string;
    contactEmail: string;
    contactPhone: string;
    contactLinkedin: string;
  };
  step5: {
    photoUrl: string;
    resumeUrl: string;
  };
}

const defaultData: QuestionnaireData = {
  step1: { fullName: "", roleTitle: "", positioning: "", persona: "", tone: "direct" },
  step2: { careers: [{ companyName: "", roleTitle: "", duration: "", facts: [""] }] },
  step3: { stories: [{ type: "failure", title: "", challenge: "", approach: "", result: "", scale: "" }] },
  step4: { influences: "", limitations: "", contactEmail: "", contactPhone: "", contactLinkedin: "" },
  step5: { photoUrl: "", resumeUrl: "" },
};

export default function QuestionnairePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<QuestionnaireData>(defaultData);

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
      setData({ ...defaultData, ...(existingProfile.questionnaireData as any) });
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
      toast({ title: "Submitted!", description: "AI is processing your content. This may take a moment." });
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const progress = (currentStep / STEPS.length) * 100;

  const goNext = () => {
    if (currentStep < STEPS.length) {
      saveMutation.mutate(data);
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const updateStep1 = (field: string, value: string) => {
    setData(d => ({ ...d, step1: { ...d.step1, [field]: value } }));
  };

  const addCareer = () => {
    if (data.step2.careers.length < 5) {
      setData(d => ({
        ...d,
        step2: {
          careers: [...d.step2.careers, { companyName: "", roleTitle: "", duration: "", facts: [""] }],
        },
      }));
    }
  };

  const removeCareer = (idx: number) => {
    setData(d => ({
      ...d,
      step2: { careers: d.step2.careers.filter((_, i) => i !== idx) },
    }));
  };

  const updateCareer = (idx: number, field: string, value: any) => {
    setData(d => ({
      ...d,
      step2: {
        careers: d.step2.careers.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
      },
    }));
  };

  const addFact = (careerIdx: number) => {
    setData(d => ({
      ...d,
      step2: {
        careers: d.step2.careers.map((c, i) =>
          i === careerIdx ? { ...c, facts: [...c.facts, ""] } : c
        ),
      },
    }));
  };

  const updateFact = (careerIdx: number, factIdx: number, value: string) => {
    setData(d => ({
      ...d,
      step2: {
        careers: d.step2.careers.map((c, i) =>
          i === careerIdx
            ? { ...c, facts: c.facts.map((f, fi) => (fi === factIdx ? value : f)) }
            : c
        ),
      },
    }));
  };

  const addStory = () => {
    if (data.step3.stories.length < 8) {
      setData(d => ({
        ...d,
        step3: {
          stories: [...d.step3.stories, { type: "failure", title: "", challenge: "", approach: "", result: "", scale: "" }],
        },
      }));
    }
  };

  const removeStory = (idx: number) => {
    setData(d => ({
      ...d,
      step3: { stories: d.step3.stories.filter((_, i) => i !== idx) },
    }));
  };

  const updateStory = (idx: number, field: string, value: string) => {
    setData(d => ({
      ...d,
      step3: {
        stories: d.step3.stories.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
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
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Questionnaire</span>
            </div>
          </Link>
          <Badge variant="secondary" className="text-xs">
            {saveMutation.isPending ? "Saving..." : "Auto-saved"}
          </Badge>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <h2 className="text-xl font-semibold">Step {currentStep}: {STEPS[currentStep - 1].title}</h2>
            <span className="text-sm text-muted-foreground">{currentStep} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" data-testid="progress-questionnaire" />
          <p className="text-sm text-muted-foreground mt-2">{STEPS[currentStep - 1].description}</p>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={data.step1.fullName}
                    onChange={e => updateStep1("fullName", e.target.value)}
                    placeholder="Jane Smith"
                    data-testid="input-fullname"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current / Target Role Title</Label>
                  <Input
                    value={data.step1.roleTitle}
                    onChange={e => updateStep1("roleTitle", e.target.value)}
                    placeholder="Senior Product Manager"
                    data-testid="input-role-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>One-Line Positioning Statement</Label>
                  <Input
                    value={data.step1.positioning}
                    onChange={e => updateStep1("positioning", e.target.value)}
                    placeholder='I am a product leader who turns complex problems into elegant solutions'
                    data-testid="input-positioning"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Professional Persona Description</Label>
                  <Textarea
                    value={data.step1.persona}
                    onChange={e => updateStep1("persona", e.target.value)}
                    placeholder="Describe your professional personality, how you approach work..."
                    className="min-h-[100px]"
                    data-testid="input-persona"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Tone</Label>
                  <Select value={data.step1.tone} onValueChange={v => updateStep1("tone", v)}>
                    <SelectTrigger data-testid="select-tone">
                      <SelectValue placeholder="Choose a tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {data.step2.careers.map((career, ci) => (
                  <Card key={ci} className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">Company {ci + 1}</h3>
                        {data.step2.careers.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeCareer(ci)} data-testid={`button-remove-career-${ci}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Company Name</Label>
                          <Input
                            value={career.companyName}
                            onChange={e => updateCareer(ci, "companyName", e.target.value)}
                            placeholder="Acme Corp"
                            data-testid={`input-company-${ci}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role Title</Label>
                          <Input
                            value={career.roleTitle}
                            onChange={e => updateCareer(ci, "roleTitle", e.target.value)}
                            placeholder="Product Manager"
                            data-testid={`input-career-role-${ci}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration</Label>
                          <Input
                            value={career.duration}
                            onChange={e => updateCareer(ci, "duration", e.target.value)}
                            placeholder="2020 - 2023"
                            data-testid={`input-duration-${ci}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Key Achievements / Facts</Label>
                        {career.facts.map((fact, fi) => (
                          <Input
                            key={fi}
                            value={fact}
                            onChange={e => updateFact(ci, fi, e.target.value)}
                            placeholder={`Achievement ${fi + 1}`}
                            data-testid={`input-fact-${ci}-${fi}`}
                          />
                        ))}
                        {career.facts.length < 10 && (
                          <Button variant="outline" size="sm" onClick={() => addFact(ci)} data-testid={`button-add-fact-${ci}`}>
                            <Plus className="mr-1 h-3 w-3" /> Add Fact
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {data.step2.careers.length < 5 && (
                  <Button variant="outline" onClick={addCareer} data-testid="button-add-career">
                    <Plus className="mr-2 h-4 w-4" /> Add Company
                  </Button>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Share 1-8 signature stories in Challenge-Approach-Result format.
                </p>
                {data.step3.stories.map((story, si) => (
                  <Card key={si} className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">Story {si + 1}</h3>
                        {data.step3.stories.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeStory(si)} data-testid={`button-remove-story-${si}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Story Type</Label>
                          <Select value={story.type} onValueChange={v => updateStory(si, "type", v)}>
                            <SelectTrigger data-testid={`select-story-type-${si}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STORY_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Story Title</Label>
                          <Input
                            value={story.title}
                            onChange={e => updateStory(si, "title", e.target.value)}
                            placeholder="How I turned a failing project around"
                            data-testid={`input-story-title-${si}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Challenge</Label>
                        <Textarea
                          value={story.challenge}
                          onChange={e => updateStory(si, "challenge", e.target.value)}
                          placeholder="What was the situation or problem?"
                          className="min-h-[80px]"
                          data-testid={`input-challenge-${si}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Approach</Label>
                        <Textarea
                          value={story.approach}
                          onChange={e => updateStory(si, "approach", e.target.value)}
                          placeholder="What did you do specifically?"
                          className="min-h-[80px]"
                          data-testid={`input-approach-${si}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Result</Label>
                        <Textarea
                          value={story.result}
                          onChange={e => updateStory(si, "result", e.target.value)}
                          placeholder="What was the outcome? Include metrics if possible."
                          className="min-h-[80px]"
                          data-testid={`input-result-${si}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Scale / Context</Label>
                        <Input
                          value={story.scale}
                          onChange={e => updateStory(si, "scale", e.target.value)}
                          placeholder="Company size, team scope, budget..."
                          data-testid={`input-scale-${si}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {data.step3.stories.length < 8 && (
                  <Button variant="outline" onClick={addStory} data-testid="button-add-story">
                    <Plus className="mr-2 h-4 w-4" /> Add Story
                  </Button>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Key Books / Influences</Label>
                  <Textarea
                    value={data.step4.influences}
                    onChange={e => setData(d => ({ ...d, step4: { ...d.step4, influences: e.target.value } }))}
                    placeholder="Books, mentors, or experiences that shaped your thinking..."
                    className="min-h-[100px]"
                    data-testid="input-influences"
                  />
                </div>
                <div className="space-y-2">
                  <Label>What You Don't Claim Expertise In</Label>
                  <Textarea
                    value={data.step4.limitations}
                    onChange={e => setData(d => ({ ...d, step4: { ...d.step4, limitations: e.target.value } }))}
                    placeholder="Areas where you prefer to defer to others..."
                    className="min-h-[80px]"
                    data-testid="input-limitations"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      value={data.step4.contactEmail}
                      onChange={e => setData(d => ({ ...d, step4: { ...d.step4, contactEmail: e.target.value } }))}
                      placeholder="you@example.com"
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone (optional)</Label>
                    <Input
                      value={data.step4.contactPhone}
                      onChange={e => setData(d => ({ ...d, step4: { ...d.step4, contactPhone: e.target.value } }))}
                      placeholder="+1 555-000-0000"
                      data-testid="input-contact-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn URL</Label>
                    <Input
                      value={data.step4.contactLinkedin}
                      onChange={e => setData(d => ({ ...d, step4: { ...d.step4, contactLinkedin: e.target.value } }))}
                      placeholder="linkedin.com/in/yourname"
                      data-testid="input-contact-linkedin"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-medium">Photo URL</h3>
                    <p className="text-sm text-muted-foreground">
                      Provide a URL to your professional photo. You can use LinkedIn, Gravatar, or any image hosting service.
                    </p>
                    <Input
                      value={data.step5.photoUrl}
                      onChange={e => setData(d => ({ ...d, step5: { ...d.step5, photoUrl: e.target.value } }))}
                      placeholder="https://example.com/your-photo.jpg"
                      data-testid="input-photo-url"
                    />
                    {data.step5.photoUrl && (
                      <div className="w-24 h-24 rounded-md overflow-hidden bg-muted">
                        <img src={data.step5.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-medium">Resume / CV PDF URL</h3>
                    <p className="text-sm text-muted-foreground">
                      Optional: Provide a link to your resume or CV PDF.
                    </p>
                    <Input
                      value={data.step5.resumeUrl}
                      onChange={e => setData(d => ({ ...d, step5: { ...d.step5, resumeUrl: e.target.value } }))}
                      placeholder="https://example.com/resume.pdf"
                      data-testid="input-resume-url"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Review Your Answers</h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">IDENTITY</h4>
                        <div className="space-y-1">
                          <p><strong>{data.step1.fullName || "—"}</strong></p>
                          <p className="text-sm text-muted-foreground">{data.step1.roleTitle || "No role set"}</p>
                          <p className="text-sm">{data.step1.positioning || "No positioning statement"}</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {TONES.find(t => t.value === data.step1.tone)?.label || data.step1.tone}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          CAREER HISTORY ({data.step2.careers.length} {data.step2.careers.length === 1 ? "company" : "companies"})
                        </h4>
                        {data.step2.careers.map((c, i) => (
                          <div key={i} className="mb-2">
                            <p className="font-medium">{c.companyName || "—"} — {c.roleTitle || "—"}</p>
                            <p className="text-xs text-muted-foreground">{c.duration}</p>
                            <p className="text-xs text-muted-foreground">{c.facts.filter(Boolean).length} facts</p>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          SIGNATURE STORIES ({data.step3.stories.length})
                        </h4>
                        {data.step3.stories.map((s, i) => (
                          <div key={i} className="mb-2 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {STORY_TYPES.find(t => t.value === s.type)?.label || s.type}
                            </Badge>
                            <span className="text-sm">{s.title || "Untitled"}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">CONTACT</h4>
                        <p className="text-sm">{data.step4.contactEmail || "No email"}</p>
                        {data.step4.contactLinkedin && (
                          <p className="text-sm text-muted-foreground">{data.step4.contactLinkedin}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-indigo-500/20 bg-indigo-500/5 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <Sparkles className="h-8 w-8 text-indigo-400 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Ready to Submit?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      AI will process your answers and build your Digital Twin's knowledge base.
                    </p>
                    <Button
                      onClick={() => submitMutation.mutate(data)}
                      disabled={submitMutation.isPending}
                      className="px-8"
                      data-testid="button-submit-questionnaire"
                    >
                      {submitMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Submit & Process with AI</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-white/5">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 1}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={goNext} data-testid="button-next-step">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`h-2 rounded-full transition-all ${
                step.id === currentStep ? "w-8 bg-indigo-500" : step.id < currentStep ? "w-2 bg-indigo-500/50" : "w-2 bg-white/10"
              }`}
              data-testid={`step-indicator-${step.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
