import React from "react";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbItemViewModel } from "../types";

interface BreadcrumbItemProps {
  item: BreadcrumbItemViewModel;
  isLast: boolean;
  onClick: (id: string) => void;
}

export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ item, isLast, onClick }) => {
  return (
    <>
      <li>
        <button
          onClick={() => onClick(item.id)}
          className={`text-sm hover:underline ${isLast ? "font-medium" : "text-muted-foreground"}`}
          aria-current={isLast ? "page" : undefined}
        >
          {item.title}
        </button>
      </li>

      {!isLast && (
        <li>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </li>
      )}
    </>
  );
};
