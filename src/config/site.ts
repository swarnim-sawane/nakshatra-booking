export const brandName = "Nakshatra";

export const navigation = [
  { label: "About Nilima", href: "/#about" },
  { label: "What she reads", href: "/#consultation" },
  { label: "How it works", href: "/#experience" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Get in touch", href: "/#contact" },
] as const;

export const socialProfiles = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/nilimasawane?stkn=MXZzM3hxaXJhNWgwag==",
    icon: "instagram",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1CZU35pABz/",
    icon: "facebook",
  },
] as const;

export const consultationFaqItems = [
  {
    question: "What kind of question is suitable for a consultation?",
    answer:
      "A focused question about a decision, recurring pattern, relationship, period of change or important date gives Nilima useful context.",
  },
  {
    question: "What can a Kundli reading help me understand?",
    answer:
      "A reading can help you understand patterns, timing and the considerations around a choice, so you can approach important decisions with greater clarity. The final decision remains yours, while medical, legal and financial matters should continue to be discussed with the appropriate professional.",
  },
  {
    question: "What if my birth time is uncertain?",
    answer:
      "Share the most accurate information you have and say clearly when the time is uncertain. Nilima will explain which parts of the reading can be approached responsibly and which conclusions would be unreliable.",
  },
  {
    question: "How does Nilima prepare before we speak?",
    answer:
      "Nilima prepares your Janam Kundli herself and reviews the question or situation submitted with the booking. This allows the consultation to begin with context rather than spending most of the call gathering background.",
  },
  {
    question: "How are my birth details and personal questions kept private?",
    answer:
      "Your birth details and questions are treated as private and handled through the secure booking process. They are used only to prepare, conduct and manage your consultation—not for marketing, unrelated purposes or judgment. Share only what is relevant and what you feel comfortable discussing.",
  },
  {
    question: "How does Nilima explain future possibilities?",
    answer:
      "Nilima explains the tendencies, timing and possibilities she sees in your chart, including where circumstances and personal choices may influence the outcome. The aim is to help you make a more considered decision, rather than present the future as fixed.",
  },
  {
    question: "How are traditional remedies or nuskhe used in a consultation?",
    answer:
      "If needed, Nilima may suggest a traditional nuskha or practical step and explain why it may be appropriate for your situation. You decide whether to follow it, alongside any professional care or advice you may need.",
  },
] as const;

export const bookingFaqItems = [
  {
    question: "What happens after I choose a consultation time?",
    answer:
      "You provide the requested birth details and questions, review the fee and complete payment securely. Your confirmation email includes the meeting link and booking details.",
  },
  {
    question: "How do I change or cancel a booking?",
    answer:
      "Use the manage-booking link in your confirmation email. Any cancellation or refund follows the terms shown before payment.",
  },
  {
    question: "What should I do if live times do not load on this website?",
    answer:
      "Use the continue-booking button shown in the calendar panel. You can view the complete schedule and continue your booking there.",
  },
] as const;
