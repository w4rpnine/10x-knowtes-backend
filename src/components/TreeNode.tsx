import React from "react";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import { cn } from "../lib/utils";

export interface TreeNodeViewModel {
  id: string;
  title: string;
  children: TreeNodeViewModel[];
  isExpanded: boolean;
  level: number;
  type: "topic" | "note";
}

interface TreeNodeProps {
  node: TreeNodeViewModel;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  expandedNodeIds: Set<string>;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node, isSelected, onSelect, onToggle, expandedNodeIds }) => {
  const isExpanded = expandedNodeIds.has(node.id);
  const hasChildren = node.children.length > 0;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        onSelect(node.id);
        e.preventDefault();
        break;
      case "ArrowRight":
        if (hasChildren && !isExpanded) {
          onToggle(node.id);
        }
        e.preventDefault();
        break;
      case "ArrowLeft":
        if (isExpanded) {
          onToggle(node.id);
        }
        e.preventDefault();
        break;
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer text-sm",
          isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
        )}
        style={{ paddingLeft: `${node.level * 12 + 4}px` }}
        onClick={() => onSelect(node.id)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {hasChildren ? (
          <button
            type="button"
            className="w-4 h-4 mr-1 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            tabIndex={-1}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4 h-4 mr-1"></span>
        )}

        {node.type === "topic" ? (
          <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
        ) : (
          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
        )}

        <span className="truncate">{node.title}</span>
      </div>

      {hasChildren && isExpanded && (
        <div className="pl-2" role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              isSelected={isSelected}
              onSelect={onSelect}
              onToggle={onToggle}
              expandedNodeIds={expandedNodeIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};
