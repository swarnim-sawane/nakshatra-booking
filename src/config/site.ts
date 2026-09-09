export const brandName = "Nakshatra";

export const navigation = [
  { label: "About Nilima", href: "/#about" },
  { label: "What she reads", href: "/#consultation" },
  { label: "How it works", href: "/#experience" },
  { label: "Get in touch", href: "/#contact" },
] as const;

// Replace only these destinations when the real social profiles are available.
export const socialProfiles = [
  { label: "Instagram", href: "https://www.instagram.com/nakshatra.placeholder/", icon: "instagram" },
  { label: "Facebook", href: "https://www.facebook.com/nakshatra.placeholder/", icon: "facebook" },
] as const;

export const consultationFaqItems = [
  {
    question: "What kind of question is suitable for a consultation?",
    answer:
      "A focused question about a decision, recurring pattern, relationship, period of change or important date gives Nilima useful context. You do not need to know which astrological technique applies.",
  },
  {
    question: "What can a Kundli reading clarify—and what can it not decide for me?",
    answer:
      "A reading can help you understand patterns, timing and the considerations around a choice. It does not remove your agency, replace professional medical, legal or financial advice, or guarantee a particular outcome.",
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
    question: "Can I discuss a sensitive personal or relationship matter privately?",
    answer:
      "Yes. Share only what is relevant and what you are comfortable discussing. Birth details and questions are submitted through the secure booking flow and used to prepare and conduct the consultation.",
  },
  {
    question: "Will the consultation tell me exactly what will happen?",
    answer:
      "No responsible reading can promise a fixed future. Nilima explains the tendencies and timing she sees, including uncertainty, so you can make a more considered decision.",
  },
  {
    question: "Are traditional remedies or nuskhe guaranteed to work?",
    answer:
      "No. Where relevant, Nilima may suggest a traditional nuskha or practical step as guidance. It is not presented as a guaranteed result or a substitute for professional care.",
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
