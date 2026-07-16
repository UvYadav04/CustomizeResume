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
    "Performance-oriented AI Software Engineer focused on building LLM-powered applications, scalable AI systems, and production-ready backend architectures with expertise in Generative AI, RAG pipelines, agentic workflows, system design, and backend engineering, leveraging Data Structures and Algorithmic knowledge to build efficient and scalable systems at scale.",
  skills: {
    "Programming Languages": [
      { name: "C++", bold: false },
      { name: "Python", bold: false },
      { name: "JavaScript", bold: false },
      { name: "TypeScript", bold: false },
      { name: "SQL", bold: false },
      { name: "C", bold: false }
    ],

    Frontend: [
      { name: "React.js", bold: false },
      { name: "Next.js", bold: false },
      { name: "HTML5", bold: false },
      { name: "CSS3", bold: false },
      { name: "Tailwind CSS", bold: false },
      { name: "Redux", bold: false },
      { name: "Zustand", bold: false },
      { name: "TanStack Query", bold: false },
      { name: "ShadCN UI", bold: false }
    ],

    Backend: [
      { name: "Node.js", bold: false },
      { name: "Express.js", bold: false },
      { name: "FastAPI", bold: false },
      { name: "REST APIs", bold: false },
      { name: "WebSockets", bold: false },
      { name: "SSE", bold: false },
      { name: "JWT", bold: false },
      { name: "OAuth 2.0", bold: false },
      { name: "Microservices", bold: false },
      { name: "Kafka", bold: false },
      { name: "BullMQ", bold: false },
      { name: "Cron Jobs", bold: false },
      { name: "Prisma ORM", bold: false }
    ],

    Databases: [
      { name: "MongoDB", bold: false },
      { name: "PostgreSQL", bold: false },
      { name: "MySQL", bold: false },
      { name: "Redis", bold: false },
      { name: "ChromaDB", bold: false },
      { name: "Qdrant", bold: false },
      { name: "pgvector", bold: false },
      { name: "Vector Search", bold: false },
      { name: "Hybrid Search", bold: false },
      { name: "HNSW", bold: false }
    ],

    "AI / GenAI": [
      { name: "LLMs", bold: false },
      { name: "RAG", bold: false },
      { name: "AI Agents", bold: false },
      { name: "Multi-Agent Systems", bold: false },
      { name: "LangChain", bold: false },
      { name: "LangGraph", bold: false },
      { name: "Prompt Engineering", bold: false },
      { name: "Fine-Tuning", bold: false },
      { name: "LoRA", bold: false },
      { name: "QLoRA", bold: false },
      { name: "Ollama", bold: false }
    ],

    "Machine Learning": [
      { name: "PyTorch", bold: false },
      { name: "Scikit-learn", bold: false },
      { name: "NumPy", bold: false },
      { name: "Pandas", bold: false },
      { name: "Transformers", bold: false },
      { name: "BERT", bold: false },
      { name: "GPT", bold: false },
      { name: "CNNs", bold: false },
      { name: "RNNs", bold: false },
      { name: "LSTMs", bold: false },
      { name: "GRUs", bold: false },
      { name: "GNNs", bold: false },
      { name: "Transfer Learning", bold: false },
      { name: "Diffusion Models", bold: false },
      { name: "Stable Diffusion", bold: false },
      { name: "VAE", bold: false }
    ],

    "Software Engineering": [
      { name: "Data Structures & Algorithms", bold: false },
      { name: "OOPs", bold: false },
      { name: "SOLID Principles", bold: false },
      { name: "Design Patterns", bold: false },
      { name: "System Design", bold: false },
      { name: "Low-Level Design", bold: false },
      { name: "High-Level Design", bold: false },
      { name: "Distributed Systems", bold: false },
      { name: "Caching", bold: false },
    ],

    "Libraries & Frameworks": [
      { name: "Cesium.js", bold: false },
      { name: "Pydantic", bold: false },
    ],

    "Cloud / DevOps / Tools": [
      { name: "Docker", bold: false },
      { name: "AWS", bold: false },
      { name: "Nginx", bold: false },
      { name: "Git", bold: false },
      { name: "GitHub", bold: false },
      { name: "CI/CD", bold: false },
      { name: "OpenAI", bold: false },
    ]
  },
  experience: [
    {
      companyName: "AeroYantra",
      role: "Software Engineer Intern",
      duration: "Jun 2025 - May 2026",
      location: "Noida",
      points: [
        "Engineered 12+ interactive map-based tools using Cesium primitives for real-time spatial calculations, eliminating dependency on on-site measurements.",
        "Architected a multi-format overlay ingestion pipeline supporting PDF, DXF, KML/KMZ, and IFC for seamless geospatial visualization.",
        "Built a synchronized drone simulation system aligning real-time map movement with video playback using telemetry data for spatial-temporal analysis.",
        "Reduced API calls by 30% and improved map load performance by re-architecting data fetching workflows, while lowering authentication-related support queries by 30% through OTP login, magic-link authentication, and password recovery flows."
      ],
      skillsUsed: [
        { name: "React", bold: false },
        { name: "Node.js", bold: false },
        { name: "Express.js", bold: false },
        { name: "MongoDB", bold: false },
        { name: "Cesium.js", bold: false },
        { name: "Redux", bold: false },
        { name: "Python", bold: false },
        { name: "GitLab", bold: false },
        { name: "Geospatial Visualization", bold: false }
      ]
    },
    {
      companyName: "SapmenC",
      role: "Software Engineer Intern",
      duration: "Feb 2025 - Jul 2025",
      location: "Remote",
      points: [
        "Developed a project management platform with List, Kanban, and Calendar views, streamlining task allocation work-flows and reducing manual coordination effort by 15+ hours per week.",
        "Enhanced application performance and security using Next.js SSR, Zod validation, and Zustand state management, resulting in 40% faster page loads, 20–25% improved query efficiency, and a 30–40% reduction in unauthorized access incidents.",
        "Implemented a WebSocket-powered real-time messaging system with file-sharing support, enabling low-latency communication and seamless collaboration between brands and influencers on the Brandfolio platform."
      ],
      skillsUsed: [
        { name: "React", bold: false },
        { name: "Next.js", bold: false },
        { name: "TanStack Query", bold: false },
        { name: "Prisma", bold: false },
        { name: "SQL", bold: false },
        { name: "MongoDB", bold: false },
        { name: "Zustand", bold: false },
        { name: "Node.js", bold: false },
        { name: "Express.js", bold: false }
      ]
    }
  ],
  projects: [
    {
      name: "Architekt AI — AI-Worfklow based System Design Platform",
      about:
        "Built an AI-powered system design platform that generates complete and validated software architectures in 15 seconds. Improved output reliability using 2 AI validation agents with retry and fallback mechanisms, and developed an AI assistant that answers system design questions in 2-3 seconds.",
      techStack: [
        { name: "Agentic AI", bold: false },
        { name: "LangGraph", bold: false },
        { name: "LangChain", bold: false },
        { name: "Qdrant", bold: false },
        { name: "MongoDB", bold: false },
        { name: "React", bold: false },
        { name: "TypeScript", bold: false },
        { name: "Nginx", bold: false }
      ],
      links: [
        { label: "Live", url: "https://architektai.duckdns.org" },
        { label: "GitHub", url: "https://github.com/UvYadav04/Architekt-AI---server" }
      ]
    },
    {
      name: "Research Simplified — AI-Powered Research Paper Simplifier",
      about:
        "Built a real-time PDF processing pipeline that delivers section-wise simplified outputs in 10-12 seconds. Engineered a RAG-powered conversational system with 2-3 second response times and reduced LLM calls by 20% through relevance-based context filtering and re-ranking.",
      techStack: [
        { name: "LangChain", bold: false },
        { name: "Redis Vector DB", bold: false },
        { name: "MongoDB", bold: false },
        { name: "React", bold: false },
        { name: "TypeScript", bold: false },
        { name: "Python", bold: false },
        { name: "AWS", bold: false },
        { name: "Nginx", bold: false }
      ],
      links: [
        { label: "Live", url: "https://researchsimplified.duckdns.org" },
        { label: "GitHub", url: "https://github.com/UvYadav04/ResearchSimplified-server" }
      ]
    },
    {
      name: "Z-Bot — RAG-Based PDF Conversational AI",
      about:
        "Built a RAG-powered conversational platform that enables users to chat with PDFs using LangChain, LangGraph, and Qdrant. Achieved 3-4 second response times and reduced LLM latency by 30% through optimized retrieval of relevant document context and chat history, while enabling persistent document and conversation storage.",
      techStack: [
        { name: "RAG", bold: false },
        { name: "LangChain", bold: false },
        { name: "LangGraph", bold: false },
        { name: "Qdrant", bold: false },
        { name: "FastAPI", bold: false },
        { name: "React", bold: false },
        { name: "TypeScript", bold: false },
        { name: "Python", bold: false },
        { name: "AWS", bold: false }
      ],
      links: [
        { label: "Live", url: "http://z-bot.duckdns.org/" },
        { label: "GitHub", url: "https://github.com/UvYadav04/Z.bot-RAG---client" }
      ]
    }
  ],
  education: [
    {
      institution: "Indian Institute of Information Technology Vadodara",
      degree: "B.Tech in Computer Science and Engineering",
      duration: "Nov 2022 - May 2026",
      location: "India",
      score: "CGPA: 7.50/10",
      coursework: [
        "Data Structures and Algorithms",
        "Operating Systems",
        "Database Management Systems",
        "Computer Networks",
        "Object-Oriented Programming",
        "Machine Learning"
      ]
    }
  ]
};
