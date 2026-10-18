import { Component, type ReactNode } from "react";
import { EmptyState } from "./EmptyState";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class HomeErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <EmptyState
          message="Something went wrong loading your courses"
          actionLabel="Retry"
          onAction={() => this.setState({ failed: false })}
        />
      );
    }
    return this.props.children;
  }
}
