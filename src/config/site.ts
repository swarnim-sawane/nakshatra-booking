export const brandName = "Celestial Guidance";

export const navigation = [
  { label: "About", href: "/#about" },
  { label: "The consultation", href: "/#consultation" },
  { label: "FAQs", href: "/#faqs" },
] as const;

export const sessionFacts = [
  "Private one-to-one session",
  "60 minutes",
  "Google Meet from anywhere",
  "Payment through Razorpay in Cal ID",
] as const;

export const howItWorks = [
  { title: "Choose a time", description: "Select an available time on the booking page." },
  {
    title: "Share the requested details and pay securely",
    description: "Complete the questions and payment within Cal ID.",
  },
  {
    title: "Meet privately",
    description: "Receive the Google Meet invitation and join at the chosen time.",
  },
] as const;

export const explorationTopics = [
  "Patterns you are noticing",
  "A decision or transition in view",
  "Questions you want to explore",
] as const;

export const faqItems = [
  {
    question: "How do I confirm my booking?",
    answer: "Cal ID shows the confirmation after the booking flow is complete and sends the meeting details to you.",
  },
  {
    question: "Which timezone does the calendar use?",
    answer: "The configured session timezone is Asia/Kolkata; the session is planned for 60 minutes.",
  },
  {
    question: "Where does the session take place?",
    answer: "The consultation takes place privately on Google Meet using the invitation from Cal ID.",
  },
  {
    question: "What should I prepare?",
    answer: "Bring the questions or themes you would like to explore. Cal ID will show any details needed to complete the booking.",
  },
] as const;
