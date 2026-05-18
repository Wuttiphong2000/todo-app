import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TodoCard from "../components/TodoCard";
import type { Todo } from "../types";

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "test-id",
    title: "Test Todo",
    description: null,
    status: "pending",
    priority: "medium",
    tagIds: [],
    subtasks: [],
    dueDate: null,
    recurrence: null,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    ...overrides,
  };
}

function renderCard(todo: Todo) {
  return render(
    <MemoryRouter>
      <TodoCard todo={todo} tags={[]} />
    </MemoryRouter>
  );
}

describe("TodoCard", () => {
  it("renders the todo title", () => {
    renderCard(makeTodo({ title: "Write tests" }));
    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });

  it("renders high priority badge", () => {
    renderCard(makeTodo({ priority: "high" }));
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it("renders low priority badge", () => {
    renderCard(makeTodo({ priority: "low" }));
    expect(screen.getByText(/low/i)).toBeInTheDocument();
  });

  it("shows subtask progress when subtasks exist", () => {
    renderCard(
      makeTodo({
        subtasks: [
          { id: "s1", title: "Step 1", completed: true, createdAt: new Date().toISOString() },
          { id: "s2", title: "Step 2", completed: false, createdAt: new Date().toISOString() },
        ],
      })
    );
    expect(screen.getByText(/1\s*\/\s*2/)).toBeInTheDocument();
  });
});
