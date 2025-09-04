"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type Opportunity = {
  id: number;
  title: string;
  industry: string;
  value: string;
};

interface Props {
  opportunities: Opportunity[];
}

export default function OpportunityList({ opportunities }: Props) {
  const tableRef = React.useRef<HTMLDivElement | null>(null);
  const [isExportingCsv, setIsExportingCsv] = React.useState(false);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const exportCSV = async () => {
    try {
      setIsExportingCsv(true);
      const headers = ["Title", "Industry", "Estimated Value"];
      const rows = opportunities.map((o) => [
        o.title,
        o.industry,
        o.value,
      ]);

      // Escape CSV cells
      const toCsvCell = (v: string) =>
        `"${String(v).replace(/"/g, '""')}"`;

      const csv =
        "\uFEFF" + // BOM for Excel
        [headers.map(toCsvCell).join(","), ...rows.map((r) => r.map(toCsvCell).join(","))].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.download = `opportunities-${stamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export CSV.");
    } finally {
      setIsExportingCsv(false);
    }
  };

  const exportPDF = async () => {
    if (!tableRef.current) return;
    try {
      setIsExportingPdf(true);

      // Dynamic imports avoid SSR issues
      const [html2canvasMod, jsPDFMod] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const html2canvas = html2canvasMod.default;
      const { jsPDF } = jsPDFMod;

      // Render table area to canvas
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // sharper
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;

      let heightLeft = imgH;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
      heightLeft -= pageH - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgH - heightLeft);
        pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
        heightLeft -= pageH - margin * 2;
      }

      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      pdf.save(`opportunities-${stamp}.pdf`);
    } catch (e) {
      console.error(e);
      alert(
        "Failed to export PDF. Make sure you've installed:\n\nnpm i html2canvas jspdf"
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (opportunities.length === 0) {
    return <p className="text-sm text-gray-500">No matched opportunities.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button
          onClick={exportCSV}
          disabled={isExportingCsv}
          className="bg-[#7A8063] hover:bg-[#7A8055] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm px-4 py-2 transition"
        >
          {isExportingCsv ? "Exporting…" : "📂 Export CSV"}
        </Button>
        <Button
          onClick={exportPDF}
          disabled={isExportingPdf}
          className="bg-[#7A8063] hover:bg-[#7A8055] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm px-4 py-2 transition"
        >
          {isExportingPdf ? "Exporting…" : "📄 Export PDF"}
        </Button>
      </div>

      <div
        ref={tableRef}
        className="overflow-x-auto border rounded-2xl shadow-sm bg-white"
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#7A8063]/20 text-left text-gray-800">
              <th className="p-3">Title</th>
              <th className="p-3">Industry</th>
              <th className="p-3">Estimated Value</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => (
              <tr
                key={opp.id}
                className="border-b hover:bg-[#7A8055]/10 transition"
              >
                <td className="p-3 font-medium text-gray-800">{opp.title}</td>
                <td className="p-3">{opp.industry}</td>
                <td className="p-3 text-[#7A8063]">{opp.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
