"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmailComposer() {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 📨 Handle Send
  const handleSend = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!to || !subject) {
      setErrorMessage("Please fill all required fields (To, Subject).");
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

    setLoading(true);

    try {
      // 👉 Replace with real backend later
      const backendConnected = false;

      if (!backendConnected) {
        throw new Error("Backend not connected. Cannot generate email.");
      }

      const res = await fetch("/api/generateEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      if (!res.ok) throw new Error("Failed to generate email");

      const data = await res.json();
      setBody(data.generatedEmail);
      if (editorRef.current) editorRef.current.innerHTML = data.generatedEmail;

      setSuccessMessage("✅ Email generated & sent successfully!");
    } catch (err: any) {
      setErrorMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    setErrorMessage("");
    setSuccessMessage("💾 Draft Saved! (Demo only)");
    console.log({ to, cc, bcc, subject, body, attachments });
  };

  const formatText = (command: string) => {
    document.execCommand(command, false, "");
    if (editorRef.current) setBody(editorRef.current.innerHTML);
  };

  const handleEditorInput = () => {
    if (editorRef.current) setBody(editorRef.current.innerHTML);
  };

  return (
    <div className="min-h-screen p-6 bg-white text-black">
      <div className="max-w-4xl mx-auto space-y-6 bg-white p-8 rounded-2xl shadow-lg border">
        <h1 className="text-2xl font-bold">📧 AI-Powered Email Composer</h1>

        {/* Messages */}
        {errorMessage && (
          <div className="p-3 rounded bg-red-100 text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded bg-green-100 text-green-700">
            {successMessage}
          </div>
        )}

        {/* Fields */}
        <div className="space-y-2">
          <Label htmlFor="to">To *</Label>
          <Input
            id="to"
            type="email"
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-gray-50 text-black"
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
            className="bg-gray-50 text-black"
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
            className="bg-gray-50 text-black"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            type="text"
            placeholder="Enter subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-gray-50 text-black flex-1"
          />
        </div>

        {/* Rich Text Toolbar */}
        <div className="space-y-2">
          <Label>Email Body *</Label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => formatText("bold")}
              className="px-3 py-1 rounded bg-[#7A8063] text-white hover:bg-[#7A8055] transition"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => formatText("italic")}
              className="px-3 py-1 rounded bg-[#7A8063] text-white hover:bg-[#7A8055] transition"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => formatText("underline")}
              className="px-3 py-1 rounded bg-[#7A8063] text-white hover:bg-[#7A8055] transition"
            >
              U
            </button>
          </div>
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            className="min-h-[150px] p-3 border rounded bg-gray-50 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 rounded bg-[#7A8063] text-white hover:bg-[#7A8055] transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {loading ? "Sending..." : "Generate Email"}
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded bg-[#7A8063] text-white hover:bg-[#7A8055] transition"
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
}
