import React from "react";
import { TopicContent } from "./TopicContent";
import { useTopicTree } from "./hooks/useTopicTree";

export const RightPanelContent: React.FC = () => {
  const { selectedNodeId } = useTopicTree();

  // If no node is selected, show the welcome message
  if (!selectedNodeId) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to 10x-knowtes</h1>
        <p className="text-muted-foreground">
          Your personal knowledge management system. Select a topic from the left panel or create a new one to get
          started.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <div className="bg-card rounded-lg p-4 shadow-sm max-w-xs">
            <h3 className="font-medium mb-2">Organize</h3>
            <p className="text-sm text-muted-foreground">
              Create topics to organize your notes in a hierarchical structure.
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm max-w-xs">
            <h3 className="font-medium mb-2">Capture</h3>
            <p className="text-sm text-muted-foreground">
              Write notes with rich text formatting to capture your knowledge.
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm max-w-xs">
            <h3 className="font-medium mb-2">Summarize</h3>
            <p className="text-sm text-muted-foreground">
              Generate summaries of your notes to quickly review important information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If a node is selected, show its content
  return <TopicContent topicId={selectedNodeId} />;
};
