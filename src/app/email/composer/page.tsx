"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  Edit3, 
  Send, 
  Save, 
  Paperclip, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  Link,
  Image,
  Sparkles,
  Mail,
  User,
  Building,
  MessageSquare,
  Target,
  Zap,
  RefreshCw,
  Copy,
  Download,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

type CompositionMode = 'manual' | 'ai';
type EmailType = 'business' | 'marketing' | 'follow-up' | 'thank-you' | 'custom';
type EmailTone = 'professional' | 'friendly' | 'formal' | 'casual';

export default function EmailComposer() {
  // Basic email fields
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // UI state
  const [mode, setMode] = useState<CompositionMode>('manual');
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // AI generation fields
  const [emailType, setEmailType] = useState<EmailType>('business');
  const [emailTone, setEmailTone] = useState<EmailTone>('professional');
  const [purpose, setPurpose] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [context, setContext] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [callToAction, setCallToAction] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [newKeyPoint, setNewKeyPoint] = useState("");
  
  const editorRef = useRef<HTMLDivElement>(null);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Handle AI Email Generation
  const handleAIGenerate = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!purpose.trim()) {
      setErrorMessage("Please provide the purpose of your email.");
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        type: emailType,
        tone: emailTone,
        purpose: purpose.trim(),
        recipientName: recipientName.trim() || undefined,
        senderName: senderName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        context: context.trim() || undefined,
        keyPoints: keyPoints.filter(point => point.trim()),
        callToAction: callToAction.trim() || undefined,
        customPrompt: customPrompt.trim() || undefined
      };

      const res = await fetch("/api/generateEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate email");
      }

      const data = await res.json();
      setBody(data.generatedEmail);
      if (editorRef.current) {
        editorRef.current.innerHTML = data.generatedEmail;
      }

      // Auto-generate subject if not provided
      if (!subject.trim()) {
        const subjectSuggestion = `${emailType.charAt(0).toUpperCase() + emailType.slice(1)} Email: ${purpose.slice(0, 50)}${purpose.length > 50 ? '...' : ''}`;
        setSubject(subjectSuggestion);
      }

      setSuccessMessage("✅ Email generated successfully! Review and send when ready.");
    } catch (err: any) {
      setErrorMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Send Email
  const handleSend = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!to || !subject || !body) {
      setErrorMessage("Please fill all required fields (To, Subject, Body).");
      return;
    }
    if (!isValidEmail(to)) {
      setErrorMessage("Please enter a valid 'To' email address.");
      return;
    }
    if (cc && !isValidEmail(cc)) {
      setErrorMessage("Please enter a valid 'CC' email address.");
      return;
    }
    if (bcc && !isValidEmail(bcc)) {
      setErrorMessage("Please enter a valid 'BCC' email address.");
      return;
    }

    // Simulate sending (replace with actual email service integration)
    setLoading(true);
    setTimeout(() => {
      setSuccessMessage("✅ Email sent successfully!");
      setLoading(false);
    }, 2000);
  };

  const handleSaveDraft = () => {
    setErrorMessage("");
    setSuccessMessage("💾 Draft saved successfully!");
    console.log({ to, cc, bcc, subject, body, attachments });
  };

  const formatText = (command: string) => {
    document.execCommand(command, false, "");
    if (editorRef.current) setBody(editorRef.current.innerHTML);
  };

  const handleEditorInput = () => {
    if (editorRef.current) setBody(editorRef.current.innerHTML);
  };

  const addKeyPoint = () => {
    if (newKeyPoint.trim() && !keyPoints.includes(newKeyPoint.trim())) {
      setKeyPoints([...keyPoints, newKeyPoint.trim()]);
      setNewKeyPoint("");
    }
  };

  const removeKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments([...attachments, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(body);
    setSuccessMessage("📋 Email content copied to clipboard!");
  };

  const clearForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setPurpose("");
    setRecipientName("");
    setSenderName("");
    setCompanyName("");
    setContext("");
    setKeyPoints([]);
    setCallToAction("");
    setCustomPrompt("");
    setAttachments([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setSuccessMessage("🗑️ Form cleared successfully!");
  };

  const switchMode = (newMode: CompositionMode) => {
    setMode(newMode);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Email Composer</h1>
                <p className="text-gray-600">Create professional emails with AI assistance or manual composition</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearForm}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Clear
              </Button>
              <Button
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </div>
          </div>

          {/* Mode Selector */}
          <Tabs value={mode} onValueChange={(value) => switchMode(value as CompositionMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Manual Composition
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Generation
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Composition Area */}
          <div className="lg:col-span-2 space-y-6">
            {mode === 'ai' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Email Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailType">Email Type</Label>
                      <Select value={emailType} onValueChange={(value) => setEmailType(value as EmailType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="thank-you">Thank You</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailTone">Tone</Label>
                      <Select value={emailTone} onValueChange={(value) => setEmailTone(value as EmailTone)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Textarea
                      id="purpose"
                      placeholder="Describe the main purpose of your email..."
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientName">Recipient Name</Label>
                      <Input
                        id="recipientName"
                        placeholder="John Doe"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senderName">Your Name</Label>
                      <Input
                        id="senderName"
                        placeholder="Jane Smith"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company</Label>
                      <Input
                        id="companyName"
                        placeholder="Acme Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context">Context</Label>
                    <Textarea
                      id="context"
                      placeholder="Additional context or background information..."
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Key Points</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a key point..."
                        value={newKeyPoint}
                        onChange={(e) => setNewKeyPoint(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addKeyPoint()}
                      />
                      <Button onClick={addKeyPoint} size="sm">
                        Add
                      </Button>
                    </div>
                    {keyPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {keyPoints.map((point, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {point}
                            <button
                              onClick={() => removeKeyPoint(index)}
                              className="ml-1 text-gray-500 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="callToAction">Call to Action</Label>
                    <Input
                      id="callToAction"
                      placeholder="Schedule a meeting, Reply by Friday, etc."
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customPrompt">Additional Instructions</Label>
                    <Textarea
                      id="customPrompt"
                      placeholder="Any specific requirements or style preferences..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>

                  <Button
                    onClick={handleAIGenerate}
                    disabled={loading || !purpose.trim()}
                    className="w-full flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Generate Email
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Email Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Email Composition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipient Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="to" className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      To *
                    </Label>
                    <Input
                      id="to"
                      type="email"
                      placeholder="recipient@example.com"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cc">CC</Label>
                    <Input
                      id="cc"
                      type="email"
                      placeholder="cc@example.com"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bcc">BCC</Label>
                    <Input
                      id="bcc"
                      type="email"
                      placeholder="bcc@example.com"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Enter email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Email Body *</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('bold')}
                        className="p-2"
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('italic')}
                        className="p-2"
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('underline')}
                        className="p-2"
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6 mx-1" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('justifyLeft')}
                        className="p-2"
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('justifyCenter')}
                        className="p-2"
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('justifyRight')}
                        className="p-2"
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('insertUnorderedList')}
                        className="p-2"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInput}
                    className="min-h-[200px] p-4 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      multiple
                      onChange={handleAttachmentUpload}
                      className="flex-1"
                    />
                  </div>
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    onClick={handleSend}
                    disabled={loading || !to || !subject || !body}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {loading ? 'Sending...' : 'Send Email'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    disabled={!body}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            {showPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-green-600" />
                    Email Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>To:</strong> {to || 'recipient@example.com'}
                    </div>
                    {cc && (
                      <div>
                        <strong>CC:</strong> {cc}
                      </div>
                    )}
                    {bcc && (
                      <div>
                        <strong>BCC:</strong> {bcc}
                      </div>
                    )}
                    <div>
                      <strong>Subject:</strong> {subject || 'No subject'}
                    </div>
                    <Separator />
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: body || '<em>Email body will appear here...</em>' }}
                    />
                    {attachments.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <strong>Attachments:</strong>
                          <ul className="mt-1 space-y-1">
                            {attachments.map((file, index) => (
                              <li key={index} className="text-xs text-gray-600">
                                📎 {file.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => switchMode(mode === 'manual' ? 'ai' : 'manual')}
                  className="w-full flex items-center gap-2"
                >
                  {mode === 'manual' ? <Bot className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  Switch to {mode === 'manual' ? 'AI' : 'Manual'} Mode
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearForm}
                  className="w-full flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear All Fields
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use AI mode for quick email generation with specific parameters</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Switch to manual mode for complete control over content</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use the preview panel to review before sending</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Add key points in AI mode for structured content</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
