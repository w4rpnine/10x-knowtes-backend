import React from "react";
import { TreeNode } from "./TreeNode";
import { useTopicTree } from "./hooks/useTopicTree";

export const TopicTree: React.FC = () => {
  const { nodes, selectedNodeId, expandedNodeIds, isLoading, error, loadTopics, selectNode, toggleNodeExpansion } =
    useTopicTree();

  // Retry loading on error
  const handleRetry = () => {
    loadTopics();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-6 w-full bg-muted animate-pulse rounded" />
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-6 w-5/6 bg-muted animate-pulse rounded" />
        <div className="h-6 w-4/5 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
        <p>{error}</p>
        <button onClick={handleRetry} className="mt-2 underline text-sm">
          Retry
        </button>
      </div>
    );
  }

  // Render empty state
  if (nodes.length === 0) {
    return (
      <div className="text-muted-foreground text-sm text-center py-4">
        No topics found. Create your first topic to get started.
      </div>
    );
  }

  // Render tree
  return (
    <div className="space-y-1" role="tree" aria-label="Topics">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          onSelect={selectNode}
          onToggle={toggleNodeExpansion}
          expandedNodeIds={expandedNodeIds}
        />
      ))}
    </div>
  );
};
