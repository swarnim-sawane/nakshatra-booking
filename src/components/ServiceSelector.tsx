import {
  consultationServices,
  type ConsultationService,
} from "../config/services";

type ServiceSelectorProps = {
  activeService: ConsultationService;
  onSelect: (service: ConsultationService) => void;
};

function formatPrice(priceInr: ConsultationService["priceInr"]) {
  return `₹${priceInr.toLocaleString("en-IN")}`;
}

export default function ServiceSelector({
  activeService,
  onSelect,
}: ServiceSelectorProps) {
  return (
    <section className="service-selector" aria-labelledby="service-selector-title">
      <div className="service-selector__heading">
        <p className="booking-page__eyebrow">Choose a reading</p>
        <h2 id="service-selector-title">What would you like to explore?</h2>
      </div>
      <nav className="service-selector__options" aria-label="Available readings">
        {consultationServices.map((service) => {
          const isActive = service.slug === activeService.slug;

          return (
            <a
              href={service.hash}
              aria-current={isActive ? "true" : undefined}
              className="service-selector__option"
              key={service.slug}
              onClick={() => onSelect(service)}
            >
              <span className="service-selector__name">{service.name}</span>
              <span className="service-selector__meta">
                {service.durationMinutes} minutes · {formatPrice(service.priceInr)}
              </span>
            </a>
          );
        })}
      </nav>
    </section>
  );
}
