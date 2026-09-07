export const brandName = "Celestial Guidance";

export const navigation = [
  { label: "Meet Nilima", href: "/#about" },
  { label: "Readings", href: "/#consultation" },
  { label: "FAQs", href: "/#faqs" },
] as const;

export const sessionFacts = [
  "Three focused readings",
  "30 or 60 minutes",
  "Google Meet from anywhere",
  "Secure online payment through Razorpay",
] as const;

export const howItWorks = [
  {
    title: "Choose your reading",
    description: "Compare the purpose, duration, price, and preparation for each option.",
  },
  {
    title: "Share context and book",
    description:
      "Complete the requested details, choose an available time, and pay securely online through Razorpay.",
  },
  {
    title: "Meet with Nilima",
    description: "Receive the Google Meet invitation and join Nilima at the chosen time.",
  },
] as const;

export const explorationTopics = [
  "A personal question, decision, or transition",
  "The dynamics and needs within a relationship",
  "Supportive timing for a meaningful event",
] as const;

export const faqItems = [
  {
    question: "Do I need an exact birth time?",
    answer:
      "Share the exact birth time when it is known. If it is not known, say so rather than estimating; Cal ID will show the details requested for your chosen reading.",
  },
  {
    question: "What should I prepare?",
    answer:
      "Each reading card lists what to have ready. Cal ID will collect the requested booking details; this website does not collect birth information.",
  },
  {
    question: "How are booking and payment handled?",
    answer:
      "Availability, booking questions, and secure online payment through Razorpay are handled within Cal ID. A Google Meet invitation follows a confirmed booking.",
  },
  {
    question: "Can I reschedule or cancel?",
    answer:
      "Cal ID manages rescheduling and cancellation. Please review the terms presented before confirming your booking.",
  },
  {
    question: "Which reading should I choose first?",
    answer:
      "Choose the reading closest to the question you want to explore: personal context, a relationship, or the timing of an important event.",
  },
  {
    question: "Does astrology replace professional advice?",
    answer:
      "No. These readings offer reflective guidance and do not replace medical, legal, financial, or mental-health advice.",
  },
] as const;
