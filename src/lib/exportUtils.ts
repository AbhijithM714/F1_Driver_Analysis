"use client";

import { jsPDF } from "jspdf";

export function exportTableToCsv(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTableToJson(data: any, filename: string) {
  if (!data) return;
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateDriverPdfReport(driverData: {
  fullName: string;
  code: string;
  number: number | null;
  nationality: string;
  constructorName: string;
  dob: string;
  stats: {
    totalStarts: number;
    totalWins: number;
    totalPodiums: number;
    totalPoles: number;
    totalPoints: number;
    totalFastestLaps: number;
    winRate: string | number;
    podiumRate: string | number;
    averageFinish: string | number;
    reliabilityRate: number;
    titles?: number;
    recentRaces?: any[];
  };
}) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;

  // Header banner
  doc.setFillColor(15, 15, 17);
  doc.rect(0, 0, 210, 40, "F");

  // Accent red line
  doc.setFillColor(225, 6, 0);
  doc.rect(0, 40, 210, 3, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(driverData.fullName.toUpperCase(), 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  const subtitle = [
    driverData.code,
    driverData.number ? `#${driverData.number}` : null,
    driverData.constructorName,
    driverData.nationality,
  ]
    .filter(Boolean)
    .join(" | ");
  doc.text(subtitle, 14, 28);
  doc.text("FORMULA 1 OFFICIAL CAREER ANALYTICS REPORT", 14, 35);

  // Section: Career Key Metrics
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CAREER SUMMARY", 14, 55);

  const metrics = [
    { label: "Grand Prix Starts", value: String(driverData.stats.totalStarts) },
    { label: "Grand Prix Victories", value: String(driverData.stats.totalWins) },
    { label: "Podium Finishes", value: String(driverData.stats.totalPodiums) },
    { label: "Pole Positions", value: String(driverData.stats.totalPoles) },
    { label: "Career Points", value: String(driverData.stats.totalPoints) },
    { label: "Fastest Laps", value: String(driverData.stats.totalFastestLaps) },
    { label: "Win Rate", value: `${driverData.stats.winRate}%` },
    { label: "Podium Rate", value: `${driverData.stats.podiumRate}%` },
    { label: "Average Finish", value: `P${driverData.stats.averageFinish}` },
    { label: "Finish Reliability", value: `${driverData.stats.reliabilityRate}%` },
    { label: "World Championships", value: String(driverData.stats.titles ?? 0) },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let startY = 65;
  metrics.forEach((m, idx) => {
    const col = idx % 2 === 0 ? 14 : 110;
    const y = startY + Math.floor(idx / 2) * 11;

    // Card background
    doc.setFillColor(245, 245, 248);
    doc.roundedRect(col, y - 6, 85, 9, 1, 1, "F");

    doc.setTextColor(90, 90, 95);
    doc.text(m.label, col + 4, y);

    doc.setTextColor(10, 10, 15);
    doc.setFont("helvetica", "bold");
    doc.text(m.value, col + 78, y, { align: "right" });
    doc.setFont("helvetica", "normal");
  });

  // Section: Recent Grand Prix Results
  const recentRaces = driverData.stats.recentRaces || [];
  if (recentRaces.length > 0) {
    const tableY = 140;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text("RECENT GRAND PRIX RESULTS", 14, tableY);

    // Table Header
    doc.setFillColor(30, 30, 35);
    doc.rect(14, tableY + 5, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("YEAR", 18, tableY + 10.5);
    doc.text("GRAND PRIX", 38, tableY + 10.5);
    doc.text("GRID", 110, tableY + 10.5);
    doc.text("FINISH", 130, tableY + 10.5);
    doc.text("POINTS", 155, tableY + 10.5);
    doc.text("STATUS", 175, tableY + 10.5);

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 35);
    let rowY = tableY + 18;

    recentRaces.slice(0, 10).forEach((r, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 248, 250);
        doc.rect(14, rowY - 4.5, 182, 6.5, "F");
      }
      doc.text(String(r.year), 18, rowY);
      doc.text(String(r.raceName || "").substring(0, 38), 38, rowY);
      doc.text(`P${r.grid}`, 110, rowY);
      doc.text(typeof r.position === "number" ? `P${r.position}` : String(r.position), 130, rowY);
      doc.text(String(r.points), 155, rowY);
      doc.text(String(r.status || "Finished").substring(0, 14), 175, rowY);

      rowY += 7;
    });
  }

  // Footer notes
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 125);
  doc.text(
    `Formula 1 Race Analytics Platform · Verified Ergast & Jolpica Dataset · Generated ${new Date().toLocaleDateString()}`,
    14,
    pageHeight - 10
  );

  doc.save(`${driverData.fullName.toLowerCase().replace(/\s+/g, "_")}_career_analytics.pdf`);
}

