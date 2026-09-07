type BookingActionProps = {
  label?: string;
  class?: string;
};

export default function BookingAction({ label = "Book a consultation", class: className = "" }: BookingActionProps) {
  return (
    <a className={`button button--primary ${className}`.trim()} href="/book/">
      {label}
    </a>
  );
}
