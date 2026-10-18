import { useState } from "react";
import { IconButton } from "../../../shared/ui/IconButton";
import { MoreVertIcon } from "../../../shared/ui/icons";
import { Menu, type MenuItem } from "../../../shared/ui/Menu";
import type { Course, GoalValue } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";
import { GoalDialog } from "./GoalDialog";
import { RemoveCourseDialog } from "./RemoveCourseDialog";

interface CourseOptionsMenuProps {
  course: Course;
  goal?: GoalValue;
}

export function CourseOptionsMenu({ course, goal }: CourseOptionsMenuProps) {
  const [dialog, setDialog] = useState<"goal" | "remove" | null>(null);
  const setGoal = useLearnerStore((state) => state.setGoal);

  const items: MenuItem[] = [
    { kind: "item", id: "set-goal", label: "Set daily goal" },
    ...(goal !== undefined
      ? [{ kind: "item", id: "clear-goal", label: "Clear goal" } as MenuItem]
      : []),
    { kind: "item", id: "remove", label: "Remove course" },
  ];

  const onSelect = (id: string) => {
    if (id === "set-goal") setDialog("goal");
    else if (id === "clear-goal") setGoal(course.id, null);
    else if (id === "remove") setDialog("remove");
  };

  return (
    <>
      <Menu
        label={`Options for ${course.title}`}
        align="right"
        items={items}
        onSelect={onSelect}
        trigger={(props) => (
          <IconButton aria-label="Course options" {...props}>
            <MoreVertIcon />
          </IconButton>
        )}
      />
      {dialog === "goal" && (
        <GoalDialog
          courseId={course.id}
          courseTitle={course.title}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "remove" && (
        <RemoveCourseDialog
          courseId={course.id}
          courseTitle={course.title}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
