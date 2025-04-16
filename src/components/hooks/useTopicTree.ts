import { useState, useEffect } from "react";
import type { TopicDTO, BreadcrumbItemViewModel, TreeNodeViewModel } from "../../types";
import { getSupabaseClient } from "../../lib/supabase";

interface GetTopicsParams {
  limit: number;
  offset: number;
}

// Function to get topics from Supabase
const getTopics = async (supabase: any, userId: string, params: GetTopicsParams) => {
  const { data, error, count } = await supabase
    .from("topics")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  if (error) throw error;

  return {
    data: data as TopicDTO[],
    count: count || 0,
    total: count || 0,
  };
};

// Transform topics to tree nodes
const transformTopicsToTreeNodes = (topics: TopicDTO[]): TreeNodeViewModel[] => {
  // Create a map for quick access
  const topicMap = new Map<string, TopicDTO>();
  topics.forEach((topic) => {
    topicMap.set(topic.id, topic);
  });

  // Create nodes
  const nodes: TreeNodeViewModel[] = [];
  const nodeMap = new Map<string, TreeNodeViewModel>();

  // First pass: create all nodes
  topics.forEach((topic) => {
    const node: TreeNodeViewModel = {
      id: topic.id,
      title: topic.title,
      children: [],
      isExpanded: false,
      level: 0, // Will be calculated in second pass
      type: "topic",
    };
    nodeMap.set(topic.id, node);
  });

  // Second pass: establish hierarchy and calculate levels
  topics.forEach((topic) => {
    const node = nodeMap.get(topic.id);
    if (!node) return;

    if (topic.parent_id && nodeMap.has(topic.parent_id)) {
      const parentNode = nodeMap.get(topic.parent_id);
      if (parentNode) {
        parentNode.children.push(node);
        node.level = parentNode.level + 1;
      }
    } else {
      // Root level topic
      nodes.push(node);
      node.level = 0;
    }
  });

  return nodes;
};

export const useTopicTree = () => {
  // State
  const [topics, setTopics] = useState<TopicDTO[]>([]);
  const [nodes, setNodes] = useState<TreeNodeViewModel[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load topics from API
  const loadTopics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();
      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (!userId) {
        throw new Error("User is not logged in");
      }

      const response = await getTopics(supabase, userId, { limit: 100, offset: 0 });
      setTopics(response.data);

      // Transform API response to tree view model
      const treeNodes = transformTopicsToTreeNodes(response.data);
      setNodes(treeNodes);
    } catch (err) {
      setError("Failed to load topics: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Select a node
  const selectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  // Toggle node expansion
  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Generate breadcrumb path for selected node
  const getBreadcrumbPath = (nodeId: string): BreadcrumbItemViewModel[] => {
    const result: BreadcrumbItemViewModel[] = [];

    // Find the node
    const findNodePath = (
      nodes: TreeNodeViewModel[],
      targetId: string,
      path: BreadcrumbItemViewModel[] = []
    ): boolean => {
      for (const node of nodes) {
        const currentPath = [...path, { id: node.id, title: node.title, level: node.level }];

        if (node.id === targetId) {
          result.push(...currentPath);
          return true;
        }

        if (node.children.length > 0 && findNodePath(node.children, targetId, currentPath)) {
          return true;
        }
      }

      return false;
    };

    findNodePath(nodes, nodeId, []);
    return result;
  };

  // Load topics on component mount
  useEffect(() => {
    loadTopics();
  }, []);

  return {
    topics,
    nodes,
    selectedNodeId,
    expandedNodeIds,
    isLoading,
    error,
    loadTopics,
    selectNode,
    toggleNodeExpansion,
    getBreadcrumbPath,
  };
};
