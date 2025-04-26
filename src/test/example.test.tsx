import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Komponent do testów - w rzeczywistości powinien być zaimportowany z aplikacji
const Button = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick}>{children}</button>
);

describe("Button", () => {
  it("renderuje tekst przycisku", () => {
    render(<Button onClick={vi.fn()}>Kliknij mnie</Button>);
    expect(screen.getByText("Kliknij mnie")).toBeInTheDocument();
  });

  it("wywołuje onClick po kliknięciu", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Kliknij mnie</Button>);

    await userEvent.click(screen.getByText("Kliknij mnie"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("używa mocka dla bardziej złożonych scenariuszy", () => {
    // Przykład mockowania API
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Zastępujemy globalną funkcję fetch naszym mockiem
    vi.stubGlobal("fetch", mockFetch);

    // Wywołujemy fetch
    fetch("/api/endpoint");

    // Sprawdzamy czy została wywołana z odpowiednimi parametrami
    expect(mockFetch).toHaveBeenCalledWith("/api/endpoint");
  });
});
