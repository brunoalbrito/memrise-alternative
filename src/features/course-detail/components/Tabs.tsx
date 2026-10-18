import { useRef, type KeyboardEvent, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Tabs({
  tabs,
  selectedId,
  onSelect,
  label,
  action,
  children,
}: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const tab = tabs[next];
    onSelect(tab.id);
    refs.current[tab.id]?.focus();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant">
        <div role="tablist" aria-label={label} className="flex">
          {tabs.map((tab, index) => {
            const selected = tab.id === selectedId;
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  refs.current[tab.id] = element;
                }}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => onSelect(tab.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`relative h-12 px-4 text-label-large font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                  selected
                    ? "text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-on-surface-variant hover:bg-on-surface/8"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {action}
      </div>
      <div
        role="tabpanel"
        id={`panel-${selectedId}`}
        aria-labelledby={`tab-${selectedId}`}
        className="pt-4"
      >
        {children}
      </div>
    </div>
  );
}
