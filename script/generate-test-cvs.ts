/**
 * One-off generator for the 3 sample CV fixtures used by seed-test.ts.
 * Run manually whenever the fixture content needs to change: tsx script/generate-test-cvs.ts
 * The output PDFs are committed to test-fixtures/ — this script does not run at seed time.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface CvSpec {
  filename: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  roles: Array<{ title: string; company: string; years: string; bullets: string[] }>;
  skills: string;
}

const CVS: CvSpec[] = [
  {
    filename: "cv-senior-ops.pdf",
    name: "Priya Nair",
    title: "Head of Operations",
    email: "priya.nair.test@example.com",
    phone: "+65 9123 4567",
    location: "Singapore",
    linkedin: "linkedin.com/in/priyanairtest",
    summary:
      "Operations leader with 18 years in financial services, running regional back-office and client servicing teams across Singapore, Hong Kong and India. Built and scaled operations functions through two acquisitions and a core banking migration.",
    roles: [
      {
        title: "Head of Operations, APAC",
        company: "Meridian Trust Bank",
        years: "2019 - Present",
        bullets: [
          "Run a 140-person operations team across 3 countries covering settlements, client servicing and reconciliation",
          "Led the core banking migration for 40,000 accounts with zero client-impacting downtime",
          "Cut average settlement turnaround from 3.2 days to 1.1 days by redesigning the exceptions queue",
          "Reduced operating cost per transaction by 22% over 3 years through process automation",
        ],
      },
      {
        title: "Director, Client Operations",
        company: "Meridian Trust Bank",
        years: "2015 - 2019",
        bullets: [
          "Built the client onboarding function from scratch, taking onboarding time from 14 days to 3 days",
          "Managed integration of a 60-person team following the acquisition of a regional custody business",
          "Owned the regulatory reporting relationship with MAS during 2 audit cycles, zero findings",
        ],
      },
      {
        title: "Operations Manager",
        company: "Straits Fund Services",
        years: "2010 - 2015",
        bullets: [
          "Managed fund administration for a $2.1B AUM book across 30 fund structures",
          "Introduced a daily NAV exception dashboard that cut late NAVs from 8% to under 1%",
        ],
      },
      {
        title: "Operations Analyst",
        company: "Straits Fund Services",
        years: "2007 - 2010",
        bullets: [
          "Processed daily trade settlements and corporate actions for institutional fund clients",
          "Promoted twice in 3 years",
        ],
      },
    ],
    skills:
      "Operations Strategy, Regulatory Reporting (MAS), Core Banking Migration, Process Automation, Vendor Management, Team Leadership, Fund Administration, Client Onboarding, Risk & Controls",
  },
  {
    filename: "cv-tech-lead.pdf",
    name: "Marcus Tan",
    title: "Engineering Manager",
    email: "marcus.tan.test@example.com",
    phone: "+1 415 555 0142",
    location: "Remote (PST)",
    linkedin: "linkedin.com/in/marcustantest",
    summary:
      "Engineering manager with 12 years building and leading SaaS product teams. Spent the last 5 years scaling backend platforms at high-growth startups, from first engineer to a 20-person org.",
    roles: [
      {
        title: "Engineering Manager",
        company: "Fluxbase",
        years: "2021 - Present",
        bullets: [
          "Lead a 14-engineer team across 3 squads shipping the core billing and usage platform",
          "Scaled the platform from 2M to 40M events/day without a rewrite, through incremental sharding",
          "Reduced production incidents by 65% by introducing a formal on-call rotation and postmortem process",
          "Grew the team from 4 to 14 engineers, hired 6 directly",
        ],
      },
      {
        title: "Senior Software Engineer to Staff Engineer",
        company: "Fluxbase",
        years: "2019 - 2021",
        bullets: [
          "Designed the multi-tenant data architecture that became the foundation for the platform's growth",
          "Led the migration from a monolith to 6 core services with zero customer-facing downtime",
        ],
      },
      {
        title: "Software Engineer",
        company: "Rennet Data",
        years: "2015 - 2019",
        bullets: [
          "Built the real-time analytics pipeline processing 500K events/minute at peak",
          "Shipped the first version of the customer-facing dashboard, adopted by 80% of paying customers within 6 months",
        ],
      },
      {
        title: "Software Engineer",
        company: "Bitworks Labs",
        years: "2013 - 2015",
        bullets: [
          "Full-stack engineer on a 6-person team building an early SaaS scheduling product",
        ],
      },
    ],
    skills:
      "Engineering Management, Distributed Systems, Backend Architecture, Python, Go, Postgres, Kafka, AWS, Team Building, Incident Management, Hiring",
  },
  {
    filename: "cv-marketing-vp.pdf",
    name: "Elena Rodrigues",
    title: "VP Marketing",
    email: "elena.rodrigues.test@example.com",
    phone: "+852 6234 5678",
    location: "Hong Kong",
    linkedin: "linkedin.com/in/elenarodriguestest",
    summary:
      "Marketing leader with 15 years in FMCG, running brand and growth marketing across APAC. Built the regional marketing function for a consumer brand from a single-market team to a 6-country operation.",
    roles: [
      {
        title: "VP Marketing, APAC",
        company: "Verdant Foods Group",
        years: "2020 - Present",
        bullets: [
          "Own a $45M annual marketing budget across 6 markets and a 25-person regional team",
          "Grew market share in the core snacking category from 11% to 17% over 3 years",
          "Launched the brand's first regional D2C channel, reaching $8M in annual revenue in 18 months",
          "Cut media waste by 30% by consolidating from 12 agencies to 3 regional partners",
        ],
      },
      {
        title: "Senior Marketing Director",
        company: "Verdant Foods Group",
        years: "2016 - 2020",
        bullets: [
          "Led the rebrand of the group's flagship product line, driving a 9-point increase in brand awareness",
          "Built the regional marketing team from 3 to 18 people across Hong Kong, Singapore and Taiwan",
        ],
      },
      {
        title: "Marketing Manager",
        company: "Colline Consumer Brands",
        years: "2012 - 2016",
        bullets: [
          "Ran the annual campaign calendar for a $60M portfolio of household brands",
          "Managed the launch of 4 new product lines, 3 of which exceeded first-year revenue targets",
        ],
      },
      {
        title: "Brand Executive",
        company: "Colline Consumer Brands",
        years: "2009 - 2012",
        bullets: [
          "Supported brand management for the group's largest product category by revenue",
        ],
      },
    ],
    skills:
      "Brand Strategy, Growth Marketing, D2C, Media Planning, P&L Ownership, Team Leadership, Consumer Insights, Agency Management, FMCG",
  },
];

async function generateCv(spec: CvSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([595, 842]); // A4
  const margin = 50;
  const width = 595 - margin * 2;
  let y = 842 - margin;

  const lineHeight = 14;
  const pageBottom = 60;

  function ensureSpace(needed: number) {
    if (y - needed < pageBottom) {
      page = doc.addPage([595, 842]);
      y = 842 - margin;
    }
  }

  function drawText(text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; gapAfter?: number } = {}) {
    const size = opts.size ?? 10;
    const useFont = opts.bold ? boldFont : font;
    const color = opts.color ? rgb(...opts.color) : rgb(0, 0, 0);
    const maxWidth = width;

    // naive word wrap
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (useFont.widthOfTextAtSize(test, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    for (const l of lines) {
      ensureSpace(lineHeight);
      page.drawText(l, { x: margin, y, size, font: useFont, color });
      y -= lineHeight;
    }
    if (opts.gapAfter) y -= opts.gapAfter;
  }

  drawText(spec.name, { size: 20, bold: true, gapAfter: 2 });
  drawText(spec.title, { size: 13, color: [0.25, 0.25, 0.25], gapAfter: 4 });
  drawText(`${spec.email}  |  ${spec.phone}  |  ${spec.location}  |  ${spec.linkedin}`, { size: 9, color: [0.35, 0.35, 0.35], gapAfter: 12 });

  drawText("SUMMARY", { size: 11, bold: true, gapAfter: 4 });
  drawText(spec.summary, { size: 10, gapAfter: 14 });

  drawText("EXPERIENCE", { size: 11, bold: true, gapAfter: 6 });
  for (const role of spec.roles) {
    drawText(`${role.title} — ${role.company}`, { size: 10.5, bold: true, gapAfter: 1 });
    drawText(role.years, { size: 9, color: [0.4, 0.4, 0.4], gapAfter: 3 });
    for (const bullet of role.bullets) {
      drawText(`•  ${bullet}`, { size: 9.5, gapAfter: 1 });
    }
    y -= 8;
  }

  drawText("SKILLS", { size: 11, bold: true, gapAfter: 4 });
  drawText(spec.skills, { size: 9.5, gapAfter: 0 });

  return doc.save();
}

async function main() {
  const outDir = path.resolve(__dirname, "..", "test-fixtures");
  fs.mkdirSync(outDir, { recursive: true });

  for (const spec of CVS) {
    const bytes = await generateCv(spec);
    const outPath = path.join(outDir, spec.filename);
    fs.writeFileSync(outPath, bytes);
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
