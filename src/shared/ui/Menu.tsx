import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { CheckIcon } from "./icons";

export type MenuItem =
  | {
      kind: "item";
      id: string;
      label: string;
      icon?: ReactNode;
      /** When defined the item behaves as a radio option. */
      checked?: boolean;
    }
  | { kind: "label"; label: string }
  | { kind: "separator" };

export interface MenuTriggerProps {
  ref: RefObject<HTMLButtonElement | null>;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  onClick: () => void;
}

interface MenuProps {
  trigger: (props: MenuTriggerProps) => ReactNode;
  items: MenuItem[];
  onSelect: (id: string) => void;
  label: string;
  align?: "left" | "right";
}

export function Menu({
  trigger,
  items,
  onSelect,
  label,
  align = "left",
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const entries = popupRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemradio"]',
    );
    if (!entries || entries.length === 0) return;
    const checked = Array.from(entries).find(
      (el) => el.getAttribute("aria-checked") === "true",
    );
    (checked ?? entries[0]).focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const entries = Array.from(
      popupRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemradio"]',
      ) ?? [],
    );
    const index = entries.indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        entries[(index + 1) % entries.length]?.focus();
        break;
      case "ArrowUp":
        event.preventDefault();
        entries[(index - 1 + entries.length) % entries.length]?.focus();
        break;
      case "Home":
        event.preventDefault();
        entries[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        entries[entries.length - 1]?.focus();
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {trigger({
        ref: triggerRef,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        onClick: () => setOpen((value) => !value),
      })}
      {open && (
        <div
          ref={popupRef}
          role="menu"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={`absolute z-20 mt-1 min-w-60 rounded-m3-md bg-surface-container py-2 shadow-m3-2 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, i) => {
            if (item.kind === "separator") {
              return (
                <div
                  key={`sep-${i}`}
                  role="separator"
                  className="my-2 h-px bg-outline-variant"
                />
              );
            }
            if (item.kind === "label") {
              return (
                <div
                  key={`label-${item.label}`}
                  role="presentation"
                  className="px-4 py-2 text-label-large font-medium text-on-surface-variant"
                >
                  {item.label}
                </div>
              );
            }
            const radio = item.checked !== undefined;
            return (
              <button
                key={item.id}
                type="button"
                role={radio ? "menuitemradio" : "menuitem"}
                aria-checked={radio ? item.checked : undefined}
                tabIndex={-1}
                onClick={() => {
                  onSelect(item.id);
                  close(true);
                }}
                className={`flex h-12 w-full items-center gap-3 px-4 text-left text-body-large text-on-surface hover:bg-on-surface/8 focus-visible:bg-on-surface/12 focus-visible:outline-none ${
                  item.checked ? "bg-secondary-container/60" : ""
                }`}
              >
                {item.icon && (
                  <span className="flex size-6 items-center justify-center text-on-surface-variant">
                    {item.icon}
                  </span>
                )}
                <span className="flex-1">{item.label}</span>
                {item.checked && <CheckIcon className="size-5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
