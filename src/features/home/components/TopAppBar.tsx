import { Link, NavLink } from "react-router";
import { PersonIcon } from "../../../shared/ui/icons";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/courses", label: "Courses", end: false },
  { to: "/groups", label: "Groups", end: false },
];

export function TopAppBar() {
  return (
    <header className="bg-surface-container">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-4xl items-center gap-1 px-2 sm:gap-2 sm:px-4"
      >
        <span className="mr-2 text-title-large font-medium text-primary sm:mr-6">
          MemBetter
        </span>
        <ul className="flex flex-1 items-center gap-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative flex h-10 items-center rounded-full px-3 text-label-large font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4 ${
                    isActive
                      ? "bg-secondary-container text-on-secondary-container"
                      : "text-on-surface-variant hover:bg-on-surface/8"
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <Link
          to="/profile"
          aria-label="Profile"
          className="inline-flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <PersonIcon />
        </Link>
      </nav>
    </header>
  );
}
