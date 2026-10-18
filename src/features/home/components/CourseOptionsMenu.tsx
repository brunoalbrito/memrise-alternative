import { useState } from "react";
import { isDesktop } from "../../../shared/api";
import { IconButton } from "../../../shared/ui/IconButton";
import { ArrowDropDownIcon, MoreVertIcon } from "../../../shared/ui/icons";
import { Menu, type MenuItem } from "../../../shared/ui/Menu";
import type { Course, GoalValue } from "../model/types";
import { useHomeExtensions } from "../context/HomeExtensions";
import { useLearnerStore } from "../store/learnerStore";
import { GoalDialog } from "./GoalDialog";
import { NewWordsDialog } from "./NewWordsDialog";
import { RemoveCourseDialog } from "./RemoveCourseDialog";

interface CourseOptionsMenuProps {
  course: Course;
  goal?: GoalValue;
  /** When set, the trigger is a text button with this label instead of the three-dot icon. */
  triggerLabel?: string;
  onRemoved?: () => void;
}

export function CourseOptionsMenu({
  course,
  goal,
  triggerLabel,
  onRemoved,
}: CourseOptionsMenuProps) {
  const [dialog, setDialog] = useState<"goal" | "remove" | "newwords" | null>(null);
  const setGoal = useLearnerStore((state) => state.setGoal);
  const { exportCourse } = useHomeExtensions();

  const items: MenuItem[] = [
    { kind: "item", id: "set-goal", label: "Set daily goal" },
    ...(isDesktop() ? [{ kind: "item", id: "new-words", label: "New words per day" } as MenuItem] : []),
    ...(goal !== undefined
      ? [{ kind: "item", id: "clear-goal", label: "Clear goal" } as MenuItem]
      : []),
    ...(exportCourse ? [{ kind: "item", id: "export", label: "Export course" } as MenuItem] : []),
    { kind: "item", id: "remove", label: "Remove course" },
  ];

  const onSelect = (id: string) => {
    if (id === "set-goal") setDialog("goal");
    else if (id === "new-words") setDialog("newwords");
    else if (id === "clear-goal") setGoal(course.id, null);
    else if (id === "export") exportCourse?.(course);
    else if (id === "remove") setDialog("remove");
  };

  return (
    <>
      <Menu
        label={`Options for ${course.title}`}
        align="right"
        items={items}
        onSelect={onSelect}
        trigger={(props) =>
          triggerLabel ? (
            <button
              type="button"
              className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-label-large font-medium text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...props}
            >
              <ArrowDropDownIcon />
              {triggerLabel}
            </button>
          ) : (
            <IconButton aria-label="Course options" {...props}>
              <MoreVertIcon />
            </IconButton>
          )
        }
      />
      {dialog === "goal" && (
        <GoalDialog
          courseId={course.id}
          courseTitle={course.title}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "newwords" && (
        <NewWordsDialog courseId={course.id} courseTitle={course.title} onClose={() => setDialog(null)} />
      )}
      {dialog === "remove" && (
        <RemoveCourseDialog
          courseId={course.id}
          courseTitle={course.title}
          onClose={() => setDialog(null)}
          onRemoved={onRemoved}
        />
      )}
    </>
  );
}
