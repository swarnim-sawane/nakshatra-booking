import { FaFacebookF, FaInstagram } from "react-icons/fa6";
import { socialProfiles } from "../config/site";

type SocialLinksProps = {
  as?: "div" | "nav";
  className?: string;
  label: string;
};

const icons = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
};

export default function SocialLinks({ as = "nav", className = "", label }: SocialLinksProps) {
  const links = socialProfiles.map((profile) => {
        const Icon = icons[profile.icon];
        return (
          <a
            aria-label={profile.label}
            className="social-link"
            href={profile.href}
            key={profile.label}
            rel="noreferrer noopener"
            target="_blank"
          >
            <Icon aria-hidden="true" size={17} strokeWidth={1.7} />
          </a>
        );
      });

  const commonProps = {
    "aria-label": label,
    className: `social-links ${className}`.trim(),
  };

  return as === "div" ? (
    <div {...commonProps} role="group">{links}</div>
  ) : (
    <nav {...commonProps}>{links}</nav>
  );
}
