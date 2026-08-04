// ============================================================
// Single source of content truth.
// Every claim below is pulled from Rishabh_Somvanshi_Resume (2026)
// or directly observable in the linked live apps. Do not add
// metrics or achievements that aren't in the resume.
// ============================================================

export const identity = {
  name: 'Rishabh Somvanshi',
  title: 'Senior Frontend Engineer · React',
  location: 'Noida, India',
  email: 'rishabhsomvanshi@gmail.com',
  linkedin: 'https://linkedin.com/in/rishabh-somvanshi-149103135',
  github: 'https://github.com/Rishabh-somvanshi',
  resume: '/Rishabh_Somvanshi_Resume.pdf',
  currently: 'Senior Developer @ Accenture — UnitedHealth Group (Optum)',
}

export const hero = {
  lead: [
    { t: '6.5+ years building and scaling React applications for ' },
    { t: 'Fortune 500 clients', strong: true },
    { t: ' — UnitedHealth Group, Albertsons, Fiserv, and Estée Lauder — across healthcare, fintech, retail, and enterprise.' },
  ],
  stats: [
    { val: '6.5', suffix: '+', label: 'Years of React' },
    { val: '4', suffix: '', label: 'Fortune 500 clients' },
    { val: '3', suffix: '', label: 'Awards in 6 months' },
  ],
}

export const experience = [
  {
    role: 'Senior Developer',
    org: 'Accenture',
    client: 'UnitedHealth Group — Optum · Curo platform',
    dates: 'May 2024 — Present',
    duration: '2+ yrs',
    points: [
      'Own React modules end-to-end on Curo, Optum’s care-management platform used by clinical and care-coordination teams — from requirement analysis with onshore stakeholders through production release.',
      'Built reusable, accessible UI components and standardized Redux state-management patterns, reducing duplicated code and speeding up delivery of new screens.',
      'Improved performance and reliability of data-heavy clinical workflows through code-splitting, memoization, and render optimization; review code and mentor junior developers in a regulated healthcare environment.',
    ],
    tags: ['React', 'Redux', 'REST APIs', 'Accessibility', 'Healthcare'],
  },
  {
    role: 'Application Developer',
    org: 'TCS',
    client: 'Albertsons',
    dates: 'Jul 2023 — May 2024',
    duration: '11 mos',
    points: [
      'Developed the BulkGiftCard web application in React — real-time order tracking, secure file upload and handling, and MSAL (Azure AD) single sign-on.',
      'Built a Gift Card Case Management system with detailed case views, attachments, and activity logs, streamlining support workflows for operations teams.',
      'Designed a gift card devaluation module covering expiry tracking, fee calculation, and partial redemption — improving maintainability and reducing manual processing.',
    ],
    award: '3 client awards in 6 months — Applause · Best Performer · On-The-Spot',
    tags: ['React', 'MSAL / Azure AD', 'Secure file handling', 'Retail'],
  },
  {
    role: 'Technology Analyst',
    org: 'Infosys',
    client: 'Fiserv',
    dates: 'Nov 2021 — Jun 2023',
    duration: '1 yr 8 mos',
    points: [
      'Led development of prepaid gift-card management modules for major banking clients, implementing EMV 3DS and OTP-based security flows in React.',
      'Enhanced the CloseTheLoop application — extended prepaid and credit-card functionality and improved the cardholder self-service experience.',
      'Coordinated backend, QA, and client SMEs to deliver releases on schedule in an Agile environment.',
    ],
    tags: ['React', 'EMV 3DS', 'OTP flows', 'Fintech'],
  },
  {
    role: 'Senior Systems Engineer',
    org: 'Infosys',
    client: 'Estée Lauder',
    dates: 'Dec 2019 — Nov 2021',
    duration: '2 yrs',
    points: [
      'Enhanced the PLM system UI for product-lifecycle workflows and managed product master data — material master, FG, WIP, BOM — supporting global product launches.',
      'Delivered UI improvements that simplified data entry and reduced errors for business users.',
    ],
    tags: ['UI Engineering', 'PLM', 'Enterprise data'],
  },
  {
    role: 'B.Tech, Electronics & Communication',
    org: 'SRM University',
    client: null,
    dates: '2015 — 2019',
    duration: '84.44%',
    education: true,
    points: [
      'Where the fundamentals were built — data structures, algorithms, and a 5★ rating in Problem Solving on HackerRank.',
    ],
    tags: ['DSA', 'C / Python', '5★ HackerRank'],
  },
]

export const studies = [
  {
    id: '01',
    name: 'Wedding Command Centre',
    url: 'https://wedding-commander.netlify.app/',
    urlLabel: 'wedding-commander.netlify.app',
    tagline:
      'A zero-backend planning tool built for a real 500-guest, multi-ceremony Lucknow wedding.',
    problem:
      'Indian weddings run five ceremonies deep — engagement, mehendi, haldi, sangeet, wedding day — with vendors, venues, and a serious budget scattered across spreadsheets, chats, and memory. Coordinating one for 500 guests needed a single source of truth.',
    approach:
      'A self-contained command centre: a drag-and-drop task board filtered by ceremony and category, a line-by-line ₹ budget planner with per-category rollups, venue and vendor pipelines with status tracking, a 24-point venue-visit checklist, and a milestone timeline. Every edit auto-saves locally, with JSON import/export for backup.',
    outcome:
      'One tool replaced the spreadsheet sprawl — in live use planning an actual wedding from engagement through the big day, at zero hosting cost.',
    tags: ['JavaScript', 'Drag & drop board', 'Local-first persistence', 'Zero backend'],
    visual: 'wedding',
  },
  {
    id: '02',
    name: 'Expense Tracker',
    url: 'https://expense-tracker-monumental.netlify.app/',
    urlLabel: 'expense-tracker-monumental.netlify.app',
    tagline: 'Dark-first expense logging built around one metric: seconds to log a spend.',
    problem:
      'Most expense apps put a form marathon and an account signup between you and logging a ₹40 chai. If logging isn’t instant, the habit dies and the data lies.',
    approach:
      'A dark, mobile-first tracker optimized for speed of entry — quick categorized logging, monthly views, and per-category breakdowns that show where the money actually goes. Client-side only: no accounts, no sync, no waiting.',
    outcome:
      'A personal daily driver for spend tracking — loads instantly, works entirely on-device, and makes the monthly picture visible at a glance.',
    tags: ['JavaScript', 'Mobile-first', 'Client-side only', 'Data visualization'],
    visual: 'expense',
  },
]

export const skills = {
  groups: [
    {
      label: 'Core Frontend',
      items: [
        { name: 'React.js' },
        { name: 'Redux & Redux-Saga' },
        { name: 'JavaScript (ES6+)' },
        { name: 'TypeScript', note: 'working knowledge' },
        { name: 'HTML5 & CSS3' },
        { name: 'Responsive design' },
      ],
    },
    {
      label: 'UI Systems',
      items: [
        { name: 'Material UI' },
        { name: 'Ant Design' },
        { name: 'Tailwind CSS' },
        { name: 'Bootstrap 5' },
        { name: 'Bulma' },
        { name: 'jQuery' },
      ],
    },
    {
      label: 'Integration & Security',
      items: [
        { name: 'RESTful APIs' },
        { name: 'MSAL / Azure AD authentication' },
        { name: 'EMV 3DS' },
        { name: 'OTP-based flows' },
        { name: 'Secure file handling' },
      ],
    },
    {
      label: 'Tools & Practices',
      items: [
        { name: 'Git & Bitbucket' },
        { name: 'JIRA' },
        { name: 'Agile / Scrum' },
        { name: 'Code reviews' },
        { name: 'CI-driven workflows' },
        { name: 'Mentoring' },
      ],
    },
  ],
  domains: [
    'Healthcare (UnitedHealth Group)',
    'Fintech (Fiserv)',
    'Retail (Albertsons)',
    'Enterprise PLM (Estée Lauder)',
  ],
  credentials:
    '5★ Problem Solving — HackerRank · Data Structures (Udemy) · Python (Coursera) · Client recognitions: Applause, Best Performer of the Month, On-The-Spot, Insta Award',
}
