export interface MockSite {
  id: string;
  name: string;
  url: string;
  connected: boolean;
  lastScannedAt: string;
  wpUsername: string;
  plan: "free" | "pro" | "agency";
  pagesUsed: number;
  pagesLimit: number;
}

export interface MockKPIs {
  healthScore: number;
  healthDelta: number;
  totalPages: number;
  pagesDelta: number;
  suggestionsReady: number;
  orphansCount: number;
  brokenCount: number;
  orphanScore: number;
  depthScore: number;
  anchorScore: number;
  brokenScore: number;
}

export interface MockSuggestion {
  id: string;
  sourceTitle: string;
  sourcePath: string;
  targetTitle: string;
  targetPath: string;
  anchorText: string;
  sourceParagraph: string;
  relevance: number;
  status: "pending" | "applied" | "dismissed";
  createdAt: string;
}

export interface MockOrphanPage {
  id: string;
  title: string;
  path: string;
  wordCount: number;
  publishedDate: string;
  inboundCount: number;
  outboundCount: number;
  candidates: {
    sourceTitle: string;
    sourcePath: string;
    suggestedAnchor: string;
    relevance: number;
  }[];
}

export interface MockBrokenLink {
  id: string;
  sourceTitle: string;
  sourcePath: string;
  targetUrl: string;
  anchorText: string;
  statusCode: number;
  type: "404" | "redirect";
  redirectTarget?: string;
  foundAt: string;
}

export interface MockReportSnapshot {
  week: string;
  date: string;
  healthScore: number;
  orphanScore: number;
  depthScore: number;
  anchorScore: number;
  brokenScore: number;
  pagesScanned: number;
  orphans: number;
  broken: number;
  applied: number;
}

export interface MockActivityItem {
  id: string;
  action: "link_applied" | "link_undone" | "link_dismissed" | "scan_completed";
  description: string;
  target: string;
  timeAgo: string;
  canUndo?: boolean;
}

export const MOCK_SITE: MockSite = {
  id: "site_greenleaf_01",
  name: "Greenleaf Gardening",
  url: "https://greenleafgardening.com",
  connected: true,
  lastScannedAt: "Nov 12, 2026, 14:32 UTC",
  wpUsername: "sarah_seo",
  plan: "free",
  pagesUsed: 18,
  pagesLimit: 20,
};

export const MOCK_KPIS: MockKPIs = {
  healthScore: 78,
  healthDelta: 6,
  totalPages: 312,
  pagesDelta: 14,
  suggestionsReady: 42,
  orphansCount: 18,
  brokenCount: 7,
  orphanScore: 70,
  depthScore: 82,
  anchorScore: 76,
  brokenScore: 84,
};

export const MOCK_SUGGESTIONS: MockSuggestion[] = [
  {
    id: "sug_01",
    sourceTitle: "How to Compost in Winter",
    sourcePath: "/how-to-compost-in-winter/",
    targetTitle: "Best Compost Bins for Cold Climates (2026)",
    targetPath: "/best-compost-bins-cold-climates-2026/",
    anchorText: "best compost bins 2026",
    sourceParagraph:
      "When temperatures dip below freezing, standard compost tumblers halt bacterial decomposition unless insulated. Choosing one of the best compost bins 2026 with double-walled thermal lining ensures your kitchen scraps breakdown throughout January without freezing solid.",
    relevance: 0.94,
    status: "pending",
    createdAt: "2 hours ago",
  },
  {
    id: "sug_02",
    sourceTitle: "Pruning Fruit Trees: Step-by-Step Guide",
    sourcePath: "/pruning-fruit-trees-guide/",
    targetTitle: "Essential Gardening Tools for Beginners",
    targetPath: "/essential-gardening-tools/",
    anchorText: "sterilize shears",
    sourceParagraph:
      "Before making any cuts across your apple and pear branches, make sure you sterilize shears with isopropyl alcohol to prevent transferring fire blight bacteria between healthy limbs.",
    relevance: 0.91,
    status: "pending",
    createdAt: "3 hours ago",
  },
  {
    id: "sug_03",
    sourceTitle: "Organic Pest Control: Complete Playbook",
    sourcePath: "/organic-pest-control/",
    targetTitle: "Natural Garden Sprays That Actually Work",
    targetPath: "/natural-garden-sprays/",
    anchorText: "neem oil dilution",
    sourceParagraph:
      "Aphids congregate under young pepper leaves in early summer. An organic neem oil dilution combined with Castile soap breaks down soft-bodied insects without harming pollinating honeybees.",
    relevance: 0.88,
    status: "pending",
    createdAt: "5 hours ago",
  },
  {
    id: "sug_04",
    sourceTitle: "Tomato Blight Prevention Tips",
    sourcePath: "/tomato-blight-prevention/",
    targetTitle: "Drip Irrigation Setup for Vegetable Raised Beds",
    targetPath: "/drip-irrigation-setup/",
    anchorText: "drip irrigation lines",
    sourceParagraph:
      "Overhead watering splashes fungal spores from the soil onto lower foliage. Switching your raised beds to drip irrigation lines keeps leaves dry and dramatically reduces septoria leaf spot.",
    relevance: 0.87,
    status: "pending",
    createdAt: "1 day ago",
  },
  {
    id: "sug_05",
    sourceTitle: "Container Gardening in Small Apartments",
    sourcePath: "/container-gardening-apartments/",
    targetTitle: "Best Potting Soil Mixes for Vegetables",
    targetPath: "/best-potting-soil-mixes/",
    anchorText: "aerated potting soil",
    sourceParagraph:
      "Balcony containers dry out much faster than ground soil, yet compacted garden dirt will suffocate roots. Always fill planters with high quality aerated potting soil containing perlite and worm castings.",
    relevance: 0.85,
    status: "pending",
    createdAt: "1 day ago",
  },
  {
    id: "sug_06",
    sourceTitle: "Companion Planting Guide for Herbs",
    sourcePath: "/companion-planting-herbs/",
    targetTitle: "How to Grow Basil Indoors All Year",
    targetPath: "/how-to-grow-basil-indoors/",
    anchorText: "fresh genovese basil",
    sourceParagraph:
      "Planting marigolds alongside tomatoes deters root-knot nematodes while fragrant fresh genovese basil repels thrips and hornworms naturally.",
    relevance: 0.82,
    status: "applied",
    createdAt: "2 days ago",
  },
];

export const MOCK_ORPHANS: MockOrphanPage[] = [
  {
    id: "orp_01",
    title: "Overwintering Dahlia Tubers: A Complete Frost Guide",
    path: "/overwintering-dahlia-tubers/",
    wordCount: 1840,
    publishedDate: "Nov 2, 2026",
    inboundCount: 0,
    outboundCount: 6,
    candidates: [
      {
        sourceTitle: "Fall Garden Prep Checklist",
        sourcePath: "/fall-garden-prep-checklist/",
        suggestedAnchor: "digging up tender dahlias",
        relevance: 0.93,
      },
      {
        sourceTitle: "Perennial Flower Care Through Winter",
        sourcePath: "/perennial-flower-care-winter/",
        suggestedAnchor: "storing dahlia tubers",
        relevance: 0.89,
      },
      {
        sourceTitle: "Bulb Planting Calendar by Hardiness Zone",
        sourcePath: "/bulb-planting-calendar/",
        suggestedAnchor: "overwintering tuber care",
        relevance: 0.84,
      },
    ],
  },
  {
    id: "orp_02",
    title: "Soil pH Testing: Home Kits vs Laboratory Results",
    path: "/soil-ph-testing-guide/",
    wordCount: 1420,
    publishedDate: "Oct 28, 2026",
    inboundCount: 0,
    outboundCount: 4,
    candidates: [
      {
        sourceTitle: "Why Your Hydrangeas Aren't Blooming Blue",
        sourcePath: "/hydrangea-blooming-blue/",
        suggestedAnchor: "test your soil acidity",
        relevance: 0.91,
      },
      {
        sourceTitle: "Blueberry Bush Planting Blueprint",
        sourcePath: "/blueberry-bush-planting/",
        suggestedAnchor: "testing soil pH balance",
        relevance: 0.87,
      },
    ],
  },
  {
    id: "orp_03",
    title: "DIY Greenhouse Heating on a Budget",
    path: "/diy-greenhouse-heating/",
    wordCount: 2150,
    publishedDate: "Oct 19, 2026",
    inboundCount: 0,
    outboundCount: 8,
    candidates: [
      {
        sourceTitle: "Cold Frame Gardening for Winter Greens",
        sourcePath: "/cold-frame-gardening-winter/",
        suggestedAnchor: "efficient greenhouse heaters",
        relevance: 0.89,
      },
    ],
  },
  {
    id: "orp_04",
    title: "Rain Barrel Installation & Water Conservation",
    path: "/rain-barrel-installation/",
    wordCount: 1290,
    publishedDate: "Sep 14, 2026",
    inboundCount: 0,
    outboundCount: 5,
    candidates: [
      {
        sourceTitle: "Drought Tolerant Gardening Practices",
        sourcePath: "/drought-tolerant-gardening/",
        suggestedAnchor: "installing rainwater barrels",
        relevance: 0.92,
      },
    ],
  },
];

export const MOCK_BROKEN_LINKS: MockBrokenLink[] = [
  {
    id: "brk_01",
    sourceTitle: "Pruning Fruit Trees Guide",
    sourcePath: "/pruning-fruit-trees-guide/",
    targetUrl: "https://greenleafgardening.com/orchard-shears-review-2023",
    anchorText: "recommended orchard shears",
    statusCode: 404,
    type: "404",
    foundAt: "Checked 4 hours ago",
  },
  {
    id: "brk_02",
    sourceTitle: "Organic Pest Control: Complete Playbook",
    sourcePath: "/organic-pest-control/",
    targetUrl: "https://greenleafgardening.com/slug-traps-beer-method",
    anchorText: "beer trap tutorial",
    statusCode: 404,
    type: "404",
    foundAt: "Checked 4 hours ago",
  },
  {
    id: "brk_03",
    sourceTitle: "How to Build Raised Garden Beds",
    sourcePath: "/how-to-build-raised-beds/",
    targetUrl: "https://greenleafgardening.com/cedar-lumber-calculator",
    anchorText: "wood dimension calculator",
    statusCode: 301,
    type: "redirect",
    redirectTarget: "https://greenleafgardening.com/tools/bed-calculator",
    foundAt: "Checked 4 hours ago",
  },
  {
    id: "brk_04",
    sourceTitle: "Seed Starting for Spring 2026",
    sourcePath: "/seed-starting-guide/",
    targetUrl: "https://greenleafgardening.com/heat-mats-comparison-old",
    anchorText: "best seedling heating mats",
    statusCode: 404,
    type: "404",
    foundAt: "Checked yesterday",
  },
  {
    id: "brk_05",
    sourceTitle: "Garlic Planting in Autumn",
    sourcePath: "/garlic-planting-autumn/",
    targetUrl: "https://greenleafgardening.com/hardneck-vs-softneck",
    anchorText: "choosing hardneck garlic varieties",
    statusCode: 301,
    type: "redirect",
    redirectTarget: "https://greenleafgardening.com/guides/garlic-varieties",
    foundAt: "Checked yesterday",
  },
];

export const MOCK_REPORT_HISTORY: MockReportSnapshot[] = [
  { week: "Aug 25", date: "2026-08-25", healthScore: 62, orphanScore: 54, depthScore: 68, anchorScore: 60, brokenScore: 66, pagesScanned: 240, orphans: 32, broken: 15, applied: 0 },
  { week: "Sep 01", date: "2026-09-01", healthScore: 64, orphanScore: 56, depthScore: 70, anchorScore: 62, brokenScore: 68, pagesScanned: 248, orphans: 30, broken: 14, applied: 3 },
  { week: "Sep 08", date: "2026-09-08", healthScore: 65, orphanScore: 58, depthScore: 71, anchorScore: 62, brokenScore: 70, pagesScanned: 255, orphans: 28, broken: 12, applied: 5 },
  { week: "Sep 15", date: "2026-09-15", healthScore: 67, orphanScore: 60, depthScore: 73, anchorScore: 64, brokenScore: 72, pagesScanned: 264, orphans: 26, broken: 11, applied: 6 },
  { week: "Sep 22", date: "2026-09-22", healthScore: 66, orphanScore: 59, depthScore: 72, anchorScore: 63, brokenScore: 71, pagesScanned: 270, orphans: 27, broken: 12, applied: 2 },
  { week: "Sep 29", date: "2026-09-29", healthScore: 69, orphanScore: 62, depthScore: 75, anchorScore: 66, brokenScore: 74, pagesScanned: 278, orphans: 24, broken: 10, applied: 8 },
  { week: "Oct 06", date: "2026-10-06", healthScore: 71, orphanScore: 64, depthScore: 77, anchorScore: 68, brokenScore: 76, pagesScanned: 286, orphans: 22, broken: 9, applied: 11 },
  { week: "Oct 13", date: "2026-10-13", healthScore: 70, orphanScore: 63, depthScore: 76, anchorScore: 67, brokenScore: 75, pagesScanned: 292, orphans: 23, broken: 9, applied: 4 },
  { week: "Oct 20", date: "2026-10-20", healthScore: 73, orphanScore: 66, depthScore: 79, anchorScore: 71, brokenScore: 78, pagesScanned: 299, orphans: 21, broken: 8, applied: 9 },
  { week: "Oct 27", date: "2026-10-27", healthScore: 72, orphanScore: 65, depthScore: 78, anchorScore: 70, brokenScore: 77, pagesScanned: 304, orphans: 22, broken: 8, applied: 5 },
  { week: "Nov 03", date: "2026-11-03", healthScore: 75, orphanScore: 68, depthScore: 80, anchorScore: 73, brokenScore: 81, pagesScanned: 308, orphans: 19, broken: 7, applied: 12 },
  { week: "Nov 10", date: "2026-11-10", healthScore: 78, orphanScore: 70, depthScore: 82, anchorScore: 76, brokenScore: 84, pagesScanned: 312, orphans: 18, broken: 7, applied: 14 },
];

export const MOCK_ACTIVITY: MockActivityItem[] = [
  {
    id: "act_101",
    action: "link_applied",
    description: "Applied link in 'Companion Planting Guide for Herbs'",
    target: "Target: /how-to-grow-basil-indoors/",
    timeAgo: "2 hours ago",
    canUndo: true,
  },
  {
    id: "act_102",
    action: "link_applied",
    description: "Applied link in 'Indoor Herb Gardening Secrets'",
    target: "Target: /essential-gardening-tools/",
    timeAgo: "5 hours ago",
    canUndo: true,
  },
  {
    id: "act_103",
    action: "scan_completed",
    description: "Automated scan finished for 312 pages",
    target: "Found 14 new suggestions, 1 broken link",
    timeAgo: "Yesterday, 03:00 UTC",
  },
  {
    id: "act_104",
    action: "link_dismissed",
    description: "Dismissed suggestion for 'Winter Mulching Guide'",
    target: "Irrelevant match anchor",
    timeAgo: "2 days ago",
  },
  {
    id: "act_105",
    action: "link_applied",
    description: "Applied link in 'Beginners Guide to Composting'",
    target: "Target: /best-compost-bins-cold-climates-2026/",
    timeAgo: "3 days ago",
    canUndo: true,
  },
];

export const MOCK_SETTINGS = {
  siteName: "Greenleaf Gardening",
  siteUrl: "https://greenleafgardening.com",
  wpUsername: "sarah_seo",
  connected: true,
  scanFrequency: "weekly" as const,
  minRelevance: 0.75,
  requireApproval: true,
  ignorePatterns: [
    "/privacy-policy",
    "/terms-of-service",
    "/author/*",
    "/category/*",
    "/cart",
    "/checkout",
  ],
};

export const MOCK_PLANS = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    sitesLimit: 1,
    pagesLimit: 20,
    description: "Essential linking tool for testing on small blogs.",
    features: [
      "1 WordPress site",
      "Up to 20 indexed pages",
      "Contextual link suggestions",
      "Manual scan on demand",
      "1-click undo history",
    ],
    cta: "Current Plan",
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 9,
    priceYearly: 79,
    badge: "Most Popular",
    sitesLimit: 1,
    pagesLimit: 500,
    description: "For active content creators, SEO freelancers and publishers.",
    features: [
      "1 WordPress site",
      "Up to 500 indexed pages",
      "Automated weekly scans",
      "Weekly link-health email report",
      "Orphan page detection",
      "Broken link monitoring & fixes",
      "Bulk apply (up to 25 at once)",
      "Printable PDF report exports",
    ],
    cta: "Upgrade to Pro",
    current: false,
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: 29,
    priceYearly: 279,
    sitesLimit: 10,
    pagesLimit: 5000,
    description: "Scale internal link optimization across your entire client roster.",
    features: [
      "Up to 10 WordPress sites",
      "5,000 pages per site",
      "White-label weekly email reports",
      "3 team seats included",
      "Priority scan queue",
      "Custom anchor text exclusion rules",
      "Priority email & chat support",
    ],
    cta: "Upgrade to Agency",
    current: false,
  },
];
