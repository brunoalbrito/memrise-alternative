import { ArrowDropDownIcon, GlobeIcon, FlagIcon, SchoolIcon } from "../../../shared/ui/icons";
import { Menu, type MenuItem } from "../../../shared/ui/Menu";
import type { Category, FilterValue } from "../model/types";

interface FilterMenuProps {
  filter: FilterValue;
  categories: Category[];
  onChange: (filter: FilterValue) => void;
}

export function FilterMenu({ filter, categories, onChange }: FilterMenuProps) {
  const items: MenuItem[] = [
    { kind: "label", label: "Filter Results" },
    {
      kind: "item",
      id: "all",
      label: "All Courses",
      icon: <GlobeIcon className="size-5" />,
      checked: filter === "all",
    },
    {
      kind: "item",
      id: "goal",
      label: "With Goal Set",
      icon: <FlagIcon className="size-5" />,
      checked: filter === "goal",
    },
    {
      kind: "item",
      id: "teaching",
      label: "Teaching",
      icon: <SchoolIcon className="size-5" />,
      checked: filter === "teaching",
    },
    ...(categories.length > 0
      ? ([
          { kind: "separator" },
          { kind: "label", label: "By Category" },
          ...categories.map(
            (category): MenuItem => ({
              kind: "item",
              id: `cat:${category.id}`,
              label: category.name,
              icon: <span aria-hidden="true">{category.icon}</span>,
              checked: filter === `cat:${category.id}`,
            }),
          ),
        ] as MenuItem[])
      : []),
  ];

  return (
    <Menu
      label="Filter courses"
      items={items}
      onSelect={(id) => onChange(id as FilterValue)}
      trigger={(props) => (
        <button
          type="button"
          aria-label="Filter courses"
          className="inline-flex h-10 items-center gap-1 rounded-full bg-secondary-container px-3 text-on-secondary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          {...props}
        >
          <GlobeIcon className="size-5" />
          <ArrowDropDownIcon />
        </button>
      )}
    />
  );
}
