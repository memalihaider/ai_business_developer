"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

import {
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Image as ImageIcon,
  Tag,
  X,
  Sparkles,
} from "lucide-react";

type CaseStudy = {
  id: string;
  title: string;
  client: string;
  industry: string;
  date: string;
  summary: string;
  cover?: string;
  tags: string[];
  metrics?: { label: string; value: string }[];
  draft?: boolean;
};

const MOCK: CaseStudy[] = [
  {
    id: "1",
    title: "B2B Lead Engine for Acme Co.",
    client: "Acme Co.",
    industry: "SaaS",
    date: "2025-07-10",
    summary:
      "Set up AI-driven lead scoring and automated follow-ups; reduced response time by 62%.",
    cover: "/images/acme-cover.jpeg",
    tags: ["Lead Gen", "Email", "Automation"],
    metrics: [
      { label: "Reply Rate", value: "+38%" },
      { label: "Time Saved", value: "12h/wk" },
    ],
  },
  {
    id: "2",
    title: "Proposal Win-Rate Uplift",
    client: "Bright Studio",
    industry: "Design",
    date: "2025-06-15",
    summary:
      "Interactive proposals with tracking increased acceptance rate significantly.",
    cover: "/images/bright-cover.jpeg",
    tags: ["Proposals", "Quotation"],
    metrics: [
      { label: "Win Rate", value: "31% → 47%" },
      { label: "Turnaround", value: "−40%" },
    ],
  },
];

// AI suggestions for each field
const AI_SUGGESTIONS = {
  title: (client: string, industry: string) => 
    `${industry} Lead Generation for ${client}`,
  summary: (client: string, industry: string) => 
    `Implemented AI-powered strategies that increased conversion rates by 45% and reduced customer acquisition costs by 30% for ${client} in the ${industry} industry.`,
  problem: (industry: string) => 
    `The client was struggling with low conversion rates and high customer acquisition costs in the competitive ${industry} market, leading to stagnant growth and missed revenue opportunities.`,
  solution: () => 
    "We developed a comprehensive AI-driven strategy that included personalized outreach, automated follow-ups, and data-driven optimization to target high-value prospects and improve engagement.",
  results: () => 
    "Within 3 months, the campaign achieved a 45% increase in qualified leads, 30% reduction in acquisition costs, and 25% higher conversion rate, resulting in a significant ROI uplift.",
  tags: (industry: string) => 
    industry === "SaaS" ? "AI, Automation, Lead Generation, B2B, SaaS" : 
    industry === "Design" ? "Proposals, Quotations, Design, Creative" : 
    "Marketing, Automation, Growth"
};

export default function PortfolioPage() {
  const [query, setQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string | undefined>();
  const [openBuilder, setOpenBuilder] = useState(false);
  const [openDetail, setOpenDetail] = useState<CaseStudy | null>(null);
  const [data, setData] = useState<CaseStudy[]>(MOCK);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchesQ =
        !query ||
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.client.toLowerCase().includes(query.toLowerCase()) ||
        d.summary.toLowerCase().includes(query.toLowerCase());
      const matchesInd =
        !industryFilter || d.industry.toLowerCase() === industryFilter;
      return matchesQ && matchesInd;
    });
  }, [data, query, industryFilter]);

  const handleDelete = (id: string) =>
    setData((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative rounded-xl p-2 shadow-md mb-3 flex justify-between items-center overflow-hidden">
        <div className="flex items-center justify-between flex-nowrap gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg brand-gradient shadow-soft" />
            <div>
              <h1 className="text-lg text-[#7A8055] font-bold tracking-tight">
                Portfolio & Case Studies
              </h1>
              <p className="text-xs text-[#7A8055]">
                Build, manage, and showcase your client wins—on one page.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-nowrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 opacity-60" />
              <Input
                className="pl-7 w-40 md:w-56 h-7 text-xs"
                placeholder="Search title, client..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Filter */}
            <Select
              onValueChange={(v) => setIndustryFilter(v)}
              value={industryFilter}
            >
              <SelectTrigger className="w-32 h-7 text-xs flex items-center">
                <Filter className="w-3 h-3 mr-1 opacity-60" />
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectGroup>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="ecommerce">eCommerce</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Export / Share */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-brand text-white bg-[#7A8063] hover:bg-[#7A8055] h-7 text-xs px-2"
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  Export / Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 text-xs">
                <DropdownMenuLabel>Export</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => alert("Export PDF")}>
                  <FileText className="w-3 h-3 mr-1" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert("Export CSV")}>
                  <Download className="w-3 h-3 mr-1" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Share</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => alert("Public Link Copied")}>
                  Copy Public Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert("Share to LinkedIn")}>
                  Share to LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add New */}
            <Dialog open={openBuilder} onOpenChange={setOpenBuilder}>
              <DialogTrigger asChild>
                <Button
                  className="h-7 text-xs px-2 bg-[#7A8063] hover:bg-[#7A8055]"
                >
                  + Add New Case Study
                </Button>
              </DialogTrigger>
              <CaseStudyBuilder
                onCancel={() => setOpenBuilder(false)}
                onSave={(payload) => {
                  setData((prev) => [
                    {
                      ...payload,
                      id: String(Date.now()),
                      date: new Date().toISOString().slice(0, 10),
                    },
                    ...prev,
                  ]);
                  setOpenBuilder(false);
                }}
              />
            </Dialog>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-215">
        {filtered.map((item) => (
          <Card
            key={item.id}
            className="rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-[#7A8055]"
          >
            {item.cover ? (
              <div className="w-full h-40 overflow-hidden flex items-center justify-center bg-gray-100">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-40 w-full brand-gradient" />
            )}

            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.title}</CardTitle>
              <div className="text-xs text-muted-foreground">
                {item.client} • {item.industry} • {item.date}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm">{item.summary}</p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="border-brand text-brand"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {t}
                  </Badge>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-brand text-brand"
                    onClick={() => setOpenDetail(item)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-brand text-brand"
                    onClick={() => setOpenBuilder(true)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-brand text-brand"
                    onClick={() => alert("Downloading PDF...")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail View */}
      <Dialog open={!!openDetail} onOpenChange={() => setOpenDetail(null)}>
        {openDetail && (
          <CaseStudyDetail data={openDetail} onClose={() => setOpenDetail(null)} />
        )}
      </Dialog>
    </div>
  );
}

/* -------------------- Builder with AI Autofill -------------------- */
function CaseStudyBuilder({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (data: Omit<CaseStudy, "id" | "date">) => void;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(true);

  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [industry, setIndustry] = useState("");
  const [summary, setSummary] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [results, setResults] = useState("");
  const [tags, setTags] = useState<string>("");
  const [techStack, setTechStack] = useState("");

  const progress = (step / 4) * 100;

  // Generate AI suggestions based on current inputs
  const generateAISuggestion = (field: keyof typeof AI_SUGGESTIONS) => {
    switch (field) {
      case 'title':
        return AI_SUGGESTIONS.title(client || "Client", industry || "Industry");
      case 'summary':
        return AI_SUGGESTIONS.summary(client || "Client", industry || "Industry");
      case 'problem':
        return AI_SUGGESTIONS.problem(industry || "Industry");
      case 'solution':
        return AI_SUGGESTIONS.solution();
      case 'results':
        return AI_SUGGESTIONS.results();
      case 'tags':
        return AI_SUGGESTIONS.tags(industry || "Industry");
      default:
        return "";
    }
  };

  // AI Autofill component
  const AIAutofill = ({ field, onClick }: { field: keyof typeof AI_SUGGESTIONS, onClick: () => void }) => (
    <div className="flex items-center mt-1 text-xs text-muted-foreground">
      <Sparkles className="w-3 h-3 mr-1" />
      <span className="flex-1 truncate">{generateAISuggestion(field)}</span>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-5 px-2 text-xs"
        onClick={onClick}
      >
        Use
      </Button>
    </div>
  );

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between text-[#7A8063]">
          <span>Create Case Study</span>
          <span className="text-xs text-muted-foreground">Step {step} / 4</span>
        </DialogTitle>
      </DialogHeader>

      <Progress
        value={progress}
        className="mb-4 [&>div]:bg-[#7A8063]"
      />

      {/* Steps */}
      {step === 1 && (
        <div className="grid grid-cols-2 gap-4 text-[#7A8063]">
          <div className="col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            <AIAutofill 
              field="title" 
              onClick={() => setTitle(generateAISuggestion('title'))} 
            />
          </div>
          <div>
            <Label>Client</Label>
            <Input value={client} onChange={(e) => setClient(e.target.value)} />
          </div>
          <div>
            <Label>Industry</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., SaaS, Design, eCommerce"
            />
          </div>
          <div className="col-span-2">
            <Label>Executive Summary</Label>
            <Textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short overview of the project and outcome..."
            />
            <AIAutofill 
              field="summary" 
              onClick={() => setSummary(generateAISuggestion('summary'))} 
            />
          </div>
          <div className="col-span-2">
            <Label>Technology Stack</Label>
            <Textarea
              rows={3}
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Technologies used are..."
            />
          </div>
          <div className="col-span-2">
            <Label>Tags (comma separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Lead Gen, Email, Automation"
            />
            <AIAutofill 
              field="tags" 
              onClick={() => setTags(generateAISuggestion('tags'))} 
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-4 text-[#7A8063]">
          <div className="col-span-2">
            <Label>Problem</Label>
            <Textarea
              rows={4}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />
            <AIAutofill 
              field="problem" 
              onClick={() => setProblem(generateAISuggestion('problem'))} 
            />
          </div>
          <div className="col-span-2">
            <Label>Solution</Label>
            <Textarea
              rows={4}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
            />
            <AIAutofill 
              field="solution" 
              onClick={() => setSolution(generateAISuggestion('solution'))} 
            />
          </div>
          <div className="col-span-2">
            <Label>Product Features</Label>
            <Textarea
              rows={4}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label>Results (with metrics)</Label>
            <Textarea
              rows={4}
              value={results}
              onChange={(e) => setResults(e.target.value)}
            />
            <AIAutofill 
              field="results" 
              onClick={() => setResults(generateAISuggestion('results'))} 
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-[#7A8063]">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4" />
              <h4 className="font-medium">Uploads</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              (Placeholder) Drag & drop images, charts, PDFs, client logos.
            </p>
            <Button variant="outline" className="border-brand text-brand">
              Upload Files
            </Button>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Template</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="border rounded-lg p-3 text-left hover:bg-[var(--brand-10)]">
                Problem → Solution → Results
              </button>
              <button className="border rounded-lg p-3 text-left hover:bg-[var(--brand-10)]">
                Executive Summary → Story → Metrics
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3 text-[#7A8063]">
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Preview</h4>
            <p className="text-sm">
              <strong>{title || "Untitled Case Study"}</strong> — {client || "Client"} ({industry || "Industry"})
            </p>
            <p className="text-sm text-muted-foreground mt-1">{summary}</p>
            <Separator className="my-3" />
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div>
                <h5 className="font-medium mb-1">Problem</h5>
                <p className="text-muted-foreground">{problem || "—"}</p>
              </div>
              <div>
                <h5 className="font-medium mb-1">Solution</h5>
                <p className="text-muted-foreground">{solution || "—"}</p>
              </div>
              <div>
                <h5 className="font-medium mb-1">Results</h5>
                <p className="text-muted-foreground">{results || "—"}</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Switch
                      checked={!draft}
                      onCheckedChange={(v) => setDraft(!v)}
                      className="bg-black data-[state=checked]:bg-[#7A8063]"
                    />
                    <span className="text-sm text-[#7A8063]">Publish immediately</span>
              </div>
              <div className="text-sm">
                Tags:{" "}
                <span className="text-muted-foreground">
                  {tags || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <DialogFooter className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 mr-auto">
          <Button
            variant="outline"
            className="border-brand text-brand text-[#7A8063]"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Back
          </Button>
          <Button
            variant="outline"
            className="border-brand text-brand text-[#7A8063]"
            onClick={() => setStep((s) => Math.min(4, s + 1))}
          >
            {step === 4 ? "Review" : "Next"}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-[#7A8063]">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          {step === 4 ? (
            <Button
              variant="outline"
               className="border-brand text-brand text-[#7A8063]"
              onClick={() =>
                onSave({
                  title,
                  client,
                  industry: industry.toLowerCase(),
                  summary,
                  tags: (tags || "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                  draft,
                })
              }
            >
              Publish
            </Button>
          ) : (
            <Button
              variant="outline"
               className="border-brand text-brand text-[#7A8063]"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
            >
              Continue
            </Button>
          )}
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

/* -------------------- Detail (Showcase) -------------------- */
function CaseStudyDetail({
  data,
  onClose,
}: {
  data: CaseStudy;
  onClose: () => void;
}) {
  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>{data.title}</span>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogTitle>
      </DialogHeader>

      {data.cover ? (
        <img
          src={data.cover}
          alt={data.title}
          className="rounded-xl w-full h-36 object-cover mb-4"
        />
      ) : (
        <div className="rounded-xl overflow-hidden mb-4 brand-gradient h-36 w-full" />
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <section>
            <h3 className="font-semibold">Executive Summary</h3>
            <p className="text-sm text-muted-foreground mt-1">{data.summary}</p>
          </section>

          <Separator />

          <section className="grid md:grid-cols-3 gap-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">Problem</h4>
              <p className="text-muted-foreground">
                (Placeholder) Describe the client's challenges in detail.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Solution</h4>
              <p className="text-muted-foreground">
                (Placeholder) Outline the AI workflows and automations used.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Results</h4>
              <p className="text-muted-foreground">
                (Placeholder) Quantify the impact with concrete metrics.
              </p>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-medium">Visuals</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-video rounded-lg border" />
              <div className="aspect-video rounded-lg border" />
              <div className="aspect-video rounded-lg border" />
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Case Study Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Client</span>
                <span>{data.client}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Industry</span>
                <span className="capitalize">{data.industry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{data.date}</span>
              </div>

              <Separator />

              <div className="space-y-1">
                <span className="text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {data.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="border-brand text-brand"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button className="flex-1 bg-brand text-white hover:opacity-90">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" className="flex-1 border-brand text-brand">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </aside>
      </div>
    </DialogContent>
  );
}