import type { Resume } from "@/lib/types";

// Default/master resume, seeded once on first load and then persisted to
// localStorage. Edit freely from Settings > Summary/Skills, or by editing
// this file before first run.
export const RESUME_SEED: Resume = {
  name: "Dinesh Yadav",
  contact: {
    email: "dineshnirban01@gmail.com",
    phone: "+91-9813163920",
    location: "Gurugram, India",
    links: [
      { label: "GitHub", url: "https://github.com/Uvyadav04" },
      { label: "LinkedIn", url: "https://linkedin.com/in/dineshyadav" },
      { label: "Portfolio", url: "https://dineshyadav.onrender.com" },
      { label: "LeetCode", url: "https://leetcode.com/u/dineshnirban01" }
    ]
  },
  summary:
    "AI Software Engineer focused on building LLM-powered applications, scalable AI systems, and production-ready backend architectures with expertise in Generative AI, RAG pipelines, agentic workflows, system design, and backend engineering, leveraging Data Structures and Algorithms to deliver efficient, reliable software at scale.",
  // Full candidate pool, organized under the same category keys that
  // ROLE_SKILL_LAYOUTS (lib/constants.ts) sources from. Nothing here is
  // pre-trimmed for a specific role - buildRoleScopedResume() hands the
  // WHOLE list per category to the model at generate() time, and the model
  // picks the 5-6 strongest matches for the job description (see
  // prompt.ts). Edit freely from Settings > Skills; every item here is
  // something the person actually has, not a placeholder.
  skills: {
    Languages: [
      { name: "Python", bold: false },
      { name: "TypeScript", bold: false },
      { name: "JavaScript", bold: false },
      { name: "SQL", bold: false },
      { name: "C++", bold: false }
    ],

    "AI Engineering": [
      { name: "LLMs", bold: false },
      { name: "RAG", bold: false },
      { name: "Agentic AI", bold: false },
      { name: "AI Agents", bold: false },
      { name: "Multi-Agent Systems", bold: false },
      { name: "LangChain", bold: false },
      { name: "LangGraph", bold: false },
      { name: "Prompt Engineering", bold: false },
      { name: "Fine-Tuning", bold: false },
      { name: "LoRA", bold: false },
      { name: "QLoRA", bold: false },
      { name: "Ollama", bold: false },
      { name: "Vector Databases", bold: false },
      { name: "ONNX Runtime", bold: false }
    ],

    "Backend Development": [
      { name: "FastAPI", bold: false },
      { name: "Node.js", bold: false },
      { name: "Express.js", bold: false },
      { name: "REST APIs", bold: false },
      { name: "WebSockets", bold: false },
      { name: "JWT", bold: false },
      { name: "OAuth 2.0", bold: false },
      { name: "Microservices", bold: false },
      { name: "BullMQ", bold: false },
      { name: "Cron Jobs", bold: false },
      { name: "Prisma", bold: false },
      { name: "WebAuthn", bold: false }
    ],

    Databases: [
      { name: "MongoDB", bold: false },
      { name: "MySQL", bold: false },
      { name: "PostgreSQL", bold: false },
      { name: "Redis", bold: false },
      { name: "Redis Vector DB", bold: false },
      { name: "Vector Databases", bold: false }
    ],

    "Frontend Development": [
      { name: "React", bold: false },
      { name: "Next.js", bold: false },
      { name: "Redux", bold: false },
      { name: "RTK Query", bold: false },
      { name: "Zustand", bold: false },
      { name: "TanStack Query", bold: false },
      { name: "HTML5", bold: false },
      { name: "CSS3", bold: false },
      { name: "Tailwind CSS", bold: false },
      { name: "ShadCN UI", bold: false },
      { name: "Cesium.js", bold: false }
    ],

    "Distributed Systems": [
      { name: "Redis Pub/Sub", bold: false },
      { name: "SSE", bold: false },
      { name: "Worker Queues", bold: false },
      { name: "Kafka", bold: false },
      { name: "Caching", bold: false }
    ],

    "Cloud & Infrastructure": [
      { name: "Docker", bold: false },
      { name: "Kubernetes", bold: false },
      { name: "AWS", bold: false },
      { name: "Nginx", bold: false },
      { name: "Git", bold: false },
      { name: "GitHub", bold: false },
      { name: "GitLab", bold: false },
      { name: "CI/CD", bold: false }
    ],

    "Observability": [
      { name: "Prometheus", bold: false },
      { name: "Grafana", bold: false },
      { name: "Loki", bold: false },
      { name: "Langfuse", bold: false },
      { name: "OpenTelemetry", bold: false }
    ]
  },
  experience: [
    {
      companyName: "BC2RI",
      role: "Software Developer",
      duration: "May 2026 - Aug 2026",
      location: "Remote",
      points: [
        "Owned end-to-end frontend development of the company's MVP using React, TypeScript, Redux, and RTK Query, delivering a scalable healthcare platform supporting providers, patients, and caregivers.",
        "Designed role-based application architecture with protected routing, reusable UI components, and integration of 30+ REST APIs featuring centralized error handling, caching, and predictable state management.",
        "Implemented passwordless authentication using WebAuthn Passkeys and added core workflow features, including request approval/rejection systems and role-specific dashboards, enhancing security and user experience."
      ],
      skillsUsed: [
        { name: "React", bold: false },
        { name: "TypeScript", bold: false },
        { name: "RTK Query", bold: false },
        { name: "REST APIs", bold: false },
        { name: "WebAuthn", bold: false }
      ]
    },
    {
      companyName: "AeroYantra",
      role: "Software Engineer Intern",
      duration: "Jun 2025 - May 2026",
      location: "Noida",
      points: [
        "Engineered 12+ interactive geospatial analysis tools using React and Cesium, enabling real-time distance, area, elevation, and spatial measurements that accelerated infrastructure planning and curbed dependence on manual site surveys.",

        "Created a multi-format geospatial visualization pipeline supporting PDF, DXF, KML/KMZ, and IFC overlays, and synchronized telemetry-driven drone simulations with video playback for accurate spatio-temporal infrastructure analysis.",

        "Refactored frontend map rendering by restructuring client-side workflows and caching base map resources, cutting API requests by 30% while adding secure authentication flows that lowered user support queries."
      ],
      skillsUsed: [
        { name: "React", bold: false },
        { name: "Node.js", bold: false },
        { name: "Express.js", bold: false },
        { name: "MongoDB", bold: false },
        { name: "Cesium.js", bold: false }
      ]
    },
    {
      companyName: "SapmenC",
      role: "Software Engineer Intern",
      duration: "Feb 2025 - Jul 2025",
      location: "Remote",
      points: [
        "Built a collaborative project management platform featuring Kanban, List, Calendar, and WebSocket-based live messaging, streamlining task coordination and reducing manual team communication by 15+ hours per week.",

        "Optimized application performance using Next.js SSR, Zod schema validation, and Zustand state management, achieving 40% faster page loads and 25% higher query efficiency through seamless client-server data synchronization."
      ],
      skillsUsed: [
        { name: "Next.js", bold: false },
        { name: "Zustand", bold: false },
        { name: "Prisma", bold: false },
        { name: "Node.js", bold: false },
        { name: "MongoDB", bold: false }
      ]
    }
  ],
  projects: [
    // Hidden from the rendered resume per request - restore by uncommenting
    // this entry (and moving it back into the array) whenever it's needed
    // again.
    // {
    //   name: "Architekt AI — AI-Worfklow based System Design Platform",
    //   points: [
    //     "Built an AI-powered system design platform that generates complete, validated software architectures in 15 seconds.",
    //     "Improved output reliability using 2 AI validation agents with retry and fallback mechanisms.",
    //     "Developed an AI assistant that answers system design questions in 2-3 seconds."
    //   ],
    //   techStack: [
    //     { name: "LangGraph", bold: false },
    //     { name: "LangChain", bold: false },
    //     { name: "Qdrant", bold: false },
    //     { name: "React", bold: false },
    //     { name: "TypeScript", bold: false }
    //   ],
    //   links: [
    //     { label: "Live", url: "https://architektai.duckdns.org" },
    //     { label: "GitHub", url: "https://github.com/UvYadav04/Architekt-AI---server" }
    //   ]
    // },
    {
      name: "AgentLytics — Distributed Multi-Agent AI Platform for Intelligent Data Analysis",
      points: [
        "Architected a distributed AI data exploration platform using FastAPI, Redis, ARQ, Docker, and specialized agents, enabling conversational analysis of CSV, Excel, PDF, and TXT files with automated insights, visualizations, reports, and CSV exports in under 60 seconds.",
        "Slashed request routing latency from 3–4 seconds to under 200 ms with an ONNX-based intent classifier, dynamic agent routing, and a pre-warmed Docker sandbox pool that eliminated 4–5 second Python execution cold starts.",
        "Deployed isolated Document (RAG + ChromaDB) and Tabular (Docker sandbox) agents with dedicated memory, improving orchestration efficiency and response accuracy for complex analytical workflows."
      ],
      techStack: [
        { name: "FastAPI", bold: false },
        { name: "Redis", bold: false },
        { name: "Docker", bold: false },
        { name: "Python", bold: false },
        { name: "ReactJS", bold: false },
        { name: "Redux", bold: false },
        { name: "SSE", bold: false }
      ],
      links: [
        { label: "Live", url: "https://agentlytics.duckdns.org" },
        { label: "GitHub", url: "https://github.com/UvYadav04/Agentlytics-Server" }
      ]
    },
    {
      name: "Research Simplified — AI-Powered Research Paper Simplifier",
      points: [
        "Streamlined a low-latency research paper simplification pipeline through intelligent preprocessing, relevance-based chunk filtering, and parallel LLM inference, trimming LLM calls by 20% and delivering section-wise simplified explanations in 10–12 seconds.",

        "Delivered a production-grade RAG chatbot using Qdrant, cross-encoder re-ranking, and relevance classification, surfacing highly relevant context to produce grounded, context-aware responses in 2–3 seconds with improved retrieval accuracy."
      ],
      techStack: [
        { name: "LangChain", bold: false },
        { name: "Redis Vector DB", bold: false },
        { name: "Python", bold: false },
        { name: "MongoDB", bold: false },
        { name: "React", bold: false }
      ],
      links: [
        { label: "Live", url: "https://researchsimplified.duckdns.org" },
        { label: "GitHub", url: "https://github.com/UvYadav04/ResearchSimplified-server" }
      ]
    }
  ],
  education: [
    {
      institution: "Indian Institute of Information Technology Vadodara",
      degree: "B.Tech in Computer Science and Engineering",
      duration: "Nov 2022 - May 2026",
      location: "India",
      coursework: [
        "Data Structures and Algorithms",
        "Operating Systems",
        "Database Management Systems",
        "Computer Networks",
        "Object-Oriented Programming",
        "Machine Learning"
      ]
    }
  ],
  // Hidden from the rendered resume for now - restore by uncommenting.
  // extraCurricular: [
  //   "Participated in Hack-IIITV, a hackathon organized by IIIT Vadodara, and built a working prototype within 24 hours.",
  //   "Solved 900+ Data Structures and Algorithms problems on LeetCode, maintaining a contest rating of 1645.",
  //   "Secured 2nd position at RoboArena, a competitive car-racing event, by engineering and testing the team's vehicle design."
  // ]
};
