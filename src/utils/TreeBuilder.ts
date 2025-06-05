import { BaseModel } from '../model/baseModel';
import { Passage, Section } from '../model';

/**
 * Generic tree node structure that can hold any BaseModel entity
 */
export interface TreeNode<T extends BaseModel = BaseModel> {
  id: string;
  data: T;
  children: TreeNode<T>[];
  level: number;
  sequenceNum: number;
  nodeType: 'section' | 'passage' | 'chapter';
  parent?: TreeNode<T>;
}

/**
 * Progress information for tree nodes
 */
export interface ProgressInfo {
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
  percentage: number;
}

/**
 * Enhanced tree node with progress tracking
 */
export interface ProgressTreeNode<T extends BaseModel = BaseModel>
  extends TreeNode<T> {
  children: ProgressTreeNode<T>[];
  progress: ProgressInfo;
  childProgress?: ProgressInfo; // Aggregated from children
}

/**
 * Configuration for tree building
 */
export interface TreeBuilderConfig {
  planId: string;
  groupByChapters?: boolean;
  calculateProgress?: boolean;
  selectedWorkflowStep?: any;
}

/**
 * Generic tree builder class that creates unified tree structures
 * for both sections and passages based on their inheritance from BaseModel
 */
export class TreeBuilder {
  private config: TreeBuilderConfig;

  constructor(config: TreeBuilderConfig) {
    this.config = config;
  }

  /**
   * Build a unified tree structure from sections and passages
   */
  buildUnifiedTree(
    sections: Section[],
    passages: Passage[]
  ): ProgressTreeNode[] {
    // Filter data for the current plan and ensure valid IDs
    const planSections = this.filterByPlan(sections).filter(
      (section) => section.id != null
    );
    const planPassages = this.filterPassagesByPlan(
      passages,
      planSections
    ).filter((passage) => passage.id != null);

    // Sort sections by sequence number and level
    const sortedSections = this.sortSections(planSections);

    // Build the hierarchical tree
    const rootNodes = this.buildSectionHierarchy(sortedSections, planPassages);

    // Calculate progress if requested
    if (this.config.calculateProgress) {
      this.calculateTreeProgress(rootNodes);
    }

    return rootNodes;
  }

  /**
   * Filter sections by plan ID
   */
  private filterByPlan(sections: Section[]): Section[] {
    return sections.filter((section) => {
      const planData = section.relationships?.plan?.data;
      if (Array.isArray(planData)) {
        return planData.some((item) => item.id === this.config.planId);
      }
      return planData?.id === this.config.planId;
    });
  }

  /**
   * Filter passages by plan sections
   */
  private filterPassagesByPlan(
    passages: Passage[],
    planSections: Section[]
  ): Passage[] {
    return passages.filter((passage) => {
      const sectionData = passage.relationships?.section?.data;
      if (Array.isArray(sectionData)) {
        return sectionData.some((item) =>
          planSections.some((section) => section.id === item.id)
        );
      }
      return planSections.some((section) => section.id === sectionData?.id);
    });
  }

  /**
   * Sort sections by sequence number and level for proper hierarchy
   */
  private sortSections(sections: Section[]): Section[] {
    return sections.sort((a, b) => {
      const seqA = a.attributes?.sequencenum || 0;
      const seqB = b.attributes?.sequencenum || 0;
      return seqA - seqB;
    });
  }

  /**
   * Build hierarchical structure based on section levels
   */
  private buildSectionHierarchy(
    sections: Section[],
    passages: Passage[]
  ): ProgressTreeNode[] {
    const rootNodes: ProgressTreeNode[] = [];
    let index = 0;

    while (index < sections.length) {
      const result = this.buildSectionSubtree(sections, passages, index, 1);
      if (result.node) {
        rootNodes.push(result.node);
      }
      index = result.nextIndex;
    }

    return rootNodes;
  }

  /**
   * Recursively build section subtree with proper nesting
   */
  private buildSectionSubtree(
    sections: Section[],
    passages: Passage[],
    startIndex: number,
    currentLevel: number
  ): { node: ProgressTreeNode | null; nextIndex: number } {
    if (startIndex >= sections.length) {
      return { node: null, nextIndex: startIndex };
    }

    const section = sections[startIndex];
    const sectionLevel = section.attributes?.level || 1;

    // If this section is at a higher level than expected, don't process it here
    if (sectionLevel < currentLevel) {
      return { node: null, nextIndex: startIndex };
    }

    // If this section is at our current level, process it
    if (sectionLevel === currentLevel) {
      // Create section node
      const sectionNode: ProgressTreeNode = {
        id: section.id!, // We've already filtered for non-null IDs
        data: section,
        children: [],
        level: sectionLevel,
        sequenceNum: section.attributes?.sequencenum || 0,
        nodeType: 'section',
        progress: this.createEmptyProgress(),
      };

      let index = startIndex + 1;

      // Add child sections
      while (index < sections.length) {
        const childResult = this.buildSectionSubtree(
          sections,
          passages,
          index,
          currentLevel + 1
        );

        if (childResult.node) {
          childResult.node.parent = sectionNode;
          sectionNode.children.push(childResult.node);
          index = childResult.nextIndex;
        } else {
          break;
        }
      }

      // Add passages for this section
      this.addPassagesToSection(sectionNode, passages);

      return { node: sectionNode, nextIndex: index };
    }

    // Skip sections that are at deeper levels than we're currently processing
    return { node: null, nextIndex: startIndex + 1 };
  }

  /**
   * Add passages to a section node, with optional chapter grouping
   */
  private addPassagesToSection(
    sectionNode: ProgressTreeNode,
    allPassages: Passage[]
  ): void {
    // Get passages for this section
    const sectionPassages = allPassages.filter((passage) => {
      const sectionData = passage.relationships?.section?.data;
      if (Array.isArray(sectionData)) {
        return sectionData.some((item) => item.id === sectionNode.id);
      }
      return sectionData?.id === sectionNode.id;
    });

    if (this.config.groupByChapters) {
      this.addPassagesWithChapterGrouping(sectionNode, sectionPassages);
    } else {
      this.addPassagesDirectly(sectionNode, sectionPassages);
    }
  }

  /**
   * Add passages with chapter header grouping based on sequence numbers
   */
  private addPassagesWithChapterGrouping(
    sectionNode: ProgressTreeNode,
    passages: Passage[]
  ): void {
    // Sort passages by sequence number
    const sortedPassages = passages.sort(
      (a, b) =>
        (a.attributes?.sequencenum || 0) - (b.attributes?.sequencenum || 0)
    );

    // Group passages by chapter headers (decimal sequence numbers)
    const chapterGroups: {
      chapterHeader?: Passage;
      passages: Passage[];
    }[] = [];

    let currentGroup: {
      chapterHeader?: Passage;
      passages: Passage[];
    } = { passages: [] };

    sortedPassages.forEach((passage) => {
      const seqNum = passage.attributes?.sequencenum || 0;
      const isChapterHeader = String(seqNum).includes('.');

      if (isChapterHeader) {
        // Start a new group with this chapter header
        if (currentGroup.passages.length > 0 || currentGroup.chapterHeader) {
          chapterGroups.push(currentGroup);
        }
        currentGroup = {
          chapterHeader: passage,
          passages: [],
        };
      } else {
        // Add regular passage to current group
        currentGroup.passages.push(passage);
      }
    });

    // Add the last group
    if (currentGroup.passages.length > 0 || currentGroup.chapterHeader) {
      chapterGroups.push(currentGroup);
    }

    // Create tree nodes for each group
    chapterGroups.forEach((group) => {
      if (group.chapterHeader) {
        // Create chapter node
        const chapterNode: ProgressTreeNode = {
          id: `chapter_${group.chapterHeader.id!}`, // We've already filtered for non-null IDs
          data: group.chapterHeader,
          children: [],
          level: sectionNode.level + 1,
          sequenceNum: group.chapterHeader.attributes?.sequencenum || 0,
          nodeType: 'chapter',
          parent: sectionNode,
          progress: this.createEmptyProgress(),
        };

        // Add passages to chapter
        group.passages.forEach((passage) => {
          const passageNode: ProgressTreeNode = {
            id: passage.id!, // We've already filtered for non-null IDs
            data: passage,
            children: [],
            level: chapterNode.level + 1,
            sequenceNum: passage.attributes?.sequencenum || 0,
            nodeType: 'passage',
            parent: chapterNode,
            progress: this.createEmptyProgress(),
          };
          chapterNode.children.push(passageNode);
        });

        sectionNode.children.push(chapterNode);
      } else {
        // Add passages directly to section
        group.passages.forEach((passage) => {
          const passageNode: ProgressTreeNode = {
            id: passage.id!, // We've already filtered for non-null IDs
            data: passage,
            children: [],
            level: sectionNode.level + 1,
            sequenceNum: passage.attributes?.sequencenum || 0,
            nodeType: 'passage',
            parent: sectionNode,
            progress: this.createEmptyProgress(),
          };
          sectionNode.children.push(passageNode);
        });
      }
    });
  }

  /**
   * Add passages directly without chapter grouping
   */
  private addPassagesDirectly(
    sectionNode: ProgressTreeNode,
    passages: Passage[]
  ): void {
    const sortedPassages = passages.sort(
      (a, b) =>
        (a.attributes?.sequencenum || 0) - (b.attributes?.sequencenum || 0)
    );

    sortedPassages.forEach((passage) => {
      const passageNode: ProgressTreeNode = {
        id: passage.id!, // We've already filtered for non-null IDs
        data: passage,
        children: [],
        level: sectionNode.level + 1,
        sequenceNum: passage.attributes?.sequencenum || 0,
        nodeType: 'passage',
        parent: sectionNode,
        progress: this.createEmptyProgress(),
      };
      sectionNode.children.push(passageNode);
    });
  }

  /**
   * Calculate progress for all nodes in the tree
   */
  private calculateTreeProgress(nodes: ProgressTreeNode[]): void {
    nodes.forEach((node) => {
      this.calculateNodeProgress(node);
    });
  }

  /**
   * Recursively calculate progress for a node and its children
   */
  private calculateNodeProgress(node: ProgressTreeNode): void {
    // First calculate progress for all children
    node.children.forEach((child) => {
      this.calculateNodeProgress(child);
    });

    if (node.nodeType === 'passage') {
      // For passages, calculate individual progress
      node.progress = this.calculatePassageProgress(node.data as Passage);
    } else {
      // For sections and chapters, aggregate from children
      node.progress = this.aggregateChildProgress(node.children);
    }
  }

  /**
   * Calculate progress for a single passage
   */
  private calculatePassageProgress(passage: Passage): ProgressInfo {
    if (!this.config.selectedWorkflowStep) {
      return this.createEmptyProgress();
    }

    const passageData = passage.attributes?.stepComplete;
    const passageSteps = passageData ? JSON.parse(passageData) : undefined;
    const passageStep = passageSteps?.completed?.find(
      (stepItem: any) =>
        stepItem.stepid === this.config.selectedWorkflowStep?.keys?.remoteId
    );

    const isComplete = passageStep?.complete === true;
    const isInProgress =
      passageStep && !passageStep.complete && (passageStep.progress || 0) > 0;

    return {
      completed: isComplete ? 1 : 0,
      inProgress: isInProgress ? 1 : 0,
      notStarted: !isComplete && !isInProgress ? 1 : 0,
      total: 1,
      percentage: isComplete ? 100 : passageStep?.progress || 0,
    };
  }

  /**
   * Aggregate progress from child nodes
   */
  private aggregateChildProgress(children: ProgressTreeNode[]): ProgressInfo {
    if (children.length === 0) {
      return this.createEmptyProgress();
    }

    const totals = children.reduce(
      (acc, child) => ({
        completed: acc.completed + child.progress.completed,
        inProgress: acc.inProgress + child.progress.inProgress,
        notStarted: acc.notStarted + child.progress.notStarted,
        total: acc.total + child.progress.total,
      }),
      { completed: 0, inProgress: 0, notStarted: 0, total: 0 }
    );

    return {
      ...totals,
      percentage:
        totals.total > 0
          ? Math.round((totals.completed / totals.total) * 100)
          : 0,
    };
  }

  /**
   * Create empty progress info
   */
  private createEmptyProgress(): ProgressInfo {
    return {
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      total: 0,
      percentage: 0,
    };
  }

  /**
   * Get all leaf nodes (passages) from the tree
   */
  static getLeafNodes(nodes: ProgressTreeNode[]): ProgressTreeNode[] {
    const leaves: ProgressTreeNode[] = [];

    function collectLeaves(node: ProgressTreeNode) {
      if (node.children.length === 0) {
        leaves.push(node);
      } else {
        node.children.forEach(collectLeaves);
      }
    }

    nodes.forEach(collectLeaves);
    return leaves;
  }

  /**
   * Filter tree nodes by type
   */
  static filterNodesByType(
    nodes: ProgressTreeNode[],
    type: 'section' | 'passage' | 'chapter'
  ): ProgressTreeNode[] {
    const filtered: ProgressTreeNode[] = [];

    function collectByType(node: ProgressTreeNode) {
      if (node.nodeType === type) {
        filtered.push(node);
      }
      node.children.forEach(collectByType);
    }

    nodes.forEach(collectByType);
    return filtered;
  }

  /**
   * Find a node by ID in the tree
   */
  static findNodeById(
    nodes: ProgressTreeNode[],
    id: string
  ): ProgressTreeNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      const found = TreeBuilder.findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
    return null;
  }
}
