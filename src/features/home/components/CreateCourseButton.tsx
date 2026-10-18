import { useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../../shared/ui/Button";
import { AddIcon } from "../../../shared/ui/icons";

export function CreateCourseButton() {
  const navigate = useNavigate();
  const pressed = useRef(false);

  const onClick = () => {
    if (pressed.current) return;
    pressed.current = true;
    navigate("/courses/new");
  };

  return (
    <Button
      icon={<AddIcon className="size-5" />}
      className="min-h-12 sm:min-h-10"
      onClick={onClick}
    >
      Create a course
    </Button>
  );
}
