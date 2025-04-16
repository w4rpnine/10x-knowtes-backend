import React, { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { BreadcrumbItem } from "./BreadcrumbItem";
import type { BreadcrumbItemViewModel } from "../types";
import { useTopicTree } from "./hooks/useTopicTree";

export const BreadcrumbPath: React.FC = () => {
  const { selectedNodeId, getBreadcrumbPath, selectNode } = useTopicTree();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItemViewModel[]>([]);

  // Update breadcrumbs when selected node changes
  useEffect(() => {
    if (selectedNodeId) {
      const path = getBreadcrumbPath(selectedNodeId);
      setBreadcrumbs(path);
    } else {
      setBreadcrumbs([]);
    }
  }, [selectedNodeId, getBreadcrumbPath]);

  // Handle clicking on a breadcrumb item
  const handleBreadcrumbClick = (id: string) => {
    selectNode(id);
  };

  // Handle clicking on home
  const handleHomeClick = () => {
    selectNode("");
  };

  return (
    <ol className="flex items-center space-x-1 text-sm">
      <li>
        <button
          onClick={handleHomeClick}
          className="flex items-center text-muted-foreground hover:text-foreground"
          aria-label="Home"
        >
          <Home className="h-4 w-4" />
        </button>
      </li>

      {breadcrumbs.length > 0 && (
        <>
          <li>
            <span className="text-muted-foreground mx-1">/</span>
          </li>

          {breadcrumbs.map((item, index) => (
            <BreadcrumbItem
              key={item.id}
              item={item}
              isLast={index === breadcrumbs.length - 1}
              onClick={handleBreadcrumbClick}
            />
          ))}
        </>
      )}
    </ol>
  );
};
