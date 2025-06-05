import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import {
  Plan,
  ISharedStrings,
  OrgWorkflowStepD,
  Passage,
  PassageD,
  Section,
  Discussion,
  GraphicD,
  GroupMembership,
  MediaFile,
  OrgWorkflowStep,
  PlanD,
  ProjectD,
  SectionD,
  SharedResourceD,
  WorkflowStep,
  Bible,
  BibleD,
} from '../model';
import {
  Box,
  LinearProgress,
  Tabs,
  Tab,
  Typography,
  Select,
  MenuItem,
} from '@mui/material';
import {
  GrowingSpacer,
  PaddedBox,
  TabActions,
  TabAppBar,
  PriButton,
  AltButton,
  FilterButton,
} from '../control';
import { useSnackBar } from '../hoc/SnackBar';
import { useSelector } from 'react-redux';
import { sharedSelector } from '../selector';
import { useProjectPermissions } from '../utils/useProjectPermissions';
import { useOrbitData } from '../hoc/useOrbitData';
import { OrganizationSchemeStepD } from '../model/organizationSchemeStep';
import { usePlanType, useBible } from '../crud';
import {
  TreeBuilder,
  ProgressTreeNode as TreeNodeType,
} from '../utils/TreeBuilder';
import ProgressTreeNode from './ProgressTreeNode';

interface IProps {
  projectPlans: Plan[];
  planColumn?: boolean;
  floatTop?: boolean;
  step?: string;
  orgSteps?: OrgWorkflowStepD[];
}

export function SimpleReportsTab(props: IProps) {
  // ORBIT DATA is part of the key to this
  const passages = useOrbitData<PassageD[]>('passage');
  const sections = useOrbitData<SectionD[]>('section');
  const sharedresources = useOrbitData<SharedResourceD[]>('sharedresource');
  const plans = useOrbitData<PlanD[]>('plan');
  const projects = useOrbitData<ProjectD[]>('project');
  const mediafiles = useOrbitData<MediaFile[]>('mediafile');
  const discussions = useOrbitData<Discussion[]>('discussion');
  const groupmemberships = useOrbitData<GroupMembership[]>('groupmembership');
  const bibles = useOrbitData<BibleD[]>('bible');
  const graphics = useOrbitData<GraphicD[]>('graphic');
  const workflowSteps = useOrbitData<WorkflowStep[]>('workflowstep');
  const orgWorkflowSteps = useOrbitData<OrgWorkflowStep[]>('orgworkflowstep');
  const organizationSchemeSteps = useOrbitData<OrganizationSchemeStepD[]>(
    'organizationschemestep'
  );
  const getPlanType = usePlanType();

  const [plan, setPlan] = useGlobal('plan');
  const [isScripture, setScripture] = useState(false);

  // console.log('bibles', bibles);

  enum WorkflowType {
    Draft = 'draft',
    Render = 'Render',
  }

  // const t: IReportsTabStrings = useSelector(reportsTabSelector);
  const ts: ISharedStrings = useSelector(sharedSelector);
  const { showMessage } = useSnackBar();
  const { canPublish } = useProjectPermissions();

  // Basic state
  const [busy, setBusy] = useGlobal('importexportBusy');
  const [filter, setFilter] = useState(false);
  const [reportTab, setReportTab] = useState(0);

  const [minimumStep, setMinimumStep] = useState<number | undefined>(undefined);

  const [selectedSections, setSelectedSections] = useState<Section[]>([]);
  const [selectedPassages, setSelectedPassages] = useState<Passage[]>([]);
  const [workflowPassages, setWorkflowPassages] = useState<Passage[]>([]);
  const [selectedGraphics, setSelectedGraphics] = useState<GraphicD[]>([]);

  const [hasBible, setHasBible] = useState<boolean>(false);
  const [org] = useGlobal('organization');

  const [bible, setBible] = useState<Bible | undefined>(undefined);

  const { getOrgBible } = useBible();
  const { projectPlans } = props;
  // console.log('props', props);

  useEffect(() => {
    if (projectPlans.length === 1) {
      if (plan === '') {
        setPlan(projectPlans[0].id as string); //set the global plan
        setScripture(getPlanType(projectPlans[0].id as string).scripture);
      } else {
        setScripture(getPlanType(plan).scripture);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPlans, plan]);

  const draftWorkflowSteps = orgWorkflowSteps.filter((step) => {
    return step.attributes?.process === WorkflowType.Draft;
  });

  const renderWorkflowSteps = workflowSteps.filter((step) => {
    return step.attributes?.process === WorkflowType.Render;
  });

  // filter by attributes.sequencenum, keep in order
  const draftWorkflowStepNames = draftWorkflowSteps
    .sort((a, b) => {
      return a.attributes?.sequencenum - b.attributes?.sequencenum;
    })
    .map((step) => {
      return step.attributes?.name;
    });

  const renderWorkflowStepNames = renderWorkflowSteps
    .sort((a, b) => {
      return a.attributes?.sequencenum - b.attributes?.sequencenum;
    })
    .map((step) => {
      return step.attributes?.name;
    });

  // works for both workflowSteps and orgWorkflowSteps
  const [selectedWorkflowSteps, setSelectedWorkflowSteps] = useState<
    WorkflowStep[]
  >([]);
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<
    WorkflowStep | undefined
  >(undefined);

  useEffect(() => {
    if (org) {
      // console.log('Organization changed:', org);
      var bible = getOrgBible(org);
      setHasBible((bible?.attributes.bibleName ?? '') !== '');
      setBible(bible);
      // console.log('Bible for org:', bible);
    } else {
      // console.log('no org');
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  // Initialize selectedWorkflowSteps with draft workflow steps
  useEffect(() => {
    if (draftWorkflowSteps.length > 0) {
      setSelectedWorkflowSteps(draftWorkflowSteps);
    }

    const selectedSections = sections
      .filter((section) => {
        const sectionData = section.relationships?.plan.data;
        if (Array.isArray(sectionData)) {
          return sectionData.some((item) => item.id === projectPlans[0].id);
        }
        return sectionData?.id === projectPlans[0].id;
      })
      .sort((a, b) => {
        return (
          (a.attributes?.sequencenum || 0) - (b.attributes?.sequencenum || 0)
        );
      });
    setSelectedSections(selectedSections);

    const selectedPassages = passages.filter((passage) => {
      const passageSection = passage.relationships?.section.data;
      if (Array.isArray(passageSection)) {
        return passageSection.some((passageSectionList) =>
          selectedSections.some(
            (section) => section.id === passageSectionList.id
          )
        );
      }
      return selectedSections.some(
        (section) => section.id === passageSection?.id
      );
    });
    setSelectedPassages(selectedPassages);

    const tempSelectedGraphics = graphics.filter((graphic) => {
      if (graphic.attributes?.resourceType === 'section') {
        // graphic.attributes?.resourceId is in the selected sections ID
        return selectedSections.some(
          (section) =>
            section.keys?.remoteId === String(graphic.attributes?.resourceId)
        );
      }
      return false;
    });

    setSelectedGraphics(tempSelectedGraphics);
    console.log('Selected Graphics', tempSelectedGraphics);
  }, []);

  const planId = projectPlans[0]?.id;
  const planName = projectPlans[0]?.attributes?.name;

  const planSections = sections.filter((section) => {
    const planData = section.relationships?.plan.data;
    if (Array.isArray(planData)) {
      return planData.some((item) => item.id === planId);
    }
    return planData?.id === planId;
  });

  // passage should be in any planSections
  const planPassages = passages.filter((passage) => {
    const sectionData = passage.relationships?.section.data;
    if (Array.isArray(sectionData)) {
      return sectionData.some((item) => {
        return planSections.some((section) => section.id === item.id);
      });
    }
    return planSections.some((section) => section.id === sectionData?.id);
  });

  // Build tree structure using TreeBuilder
  const treeData = useMemo(() => {
    if (!planId || !selectedWorkflowStep) {
      return [];
    }

    const treeBuilder = new TreeBuilder({
      planId,
      groupByChapters: true,
      calculateProgress: true,
      selectedWorkflowStep,
    });

    return treeBuilder.buildUnifiedTree(selectedSections, selectedPassages);
  }, [planId, selectedWorkflowStep, selectedSections, selectedPassages]);

  // Get overall progress from tree data
  const overallProgress = useMemo(() => {
    if (treeData.length === 0) {
      return {
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        total: 0,
        percentage: 0,
      };
    }

    // Aggregate progress from all root nodes
    const totals = treeData.reduce(
      (acc, node) => ({
        completed: acc.completed + node.progress.completed,
        inProgress: acc.inProgress + node.progress.inProgress,
        notStarted: acc.notStarted + node.progress.notStarted,
        total: acc.total + node.progress.total,
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
  }, [treeData]);

  // Placeholder handlers
  const handleFilter = () => setFilter(!filter);

  const handleReportTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setReportTab(newValue);
  };

  const handleWorkflowStepChange = (step: WorkflowStep | undefined) => {
    setSelectedWorkflowStep(step);
    if (step) {
      const tempSelectedPassages = planPassages.filter((passage) => {
        const passageData = passage.attributes?.stepComplete;
        const passageSteps = passageData ? JSON.parse(passageData) : undefined;
        if (passageSteps && passageSteps.completed) {
          return passageSteps.completed.some((stepItem: any) => {
            return (
              stepItem.complete === true &&
              stepItem.stepid === step?.keys?.remoteId
            );
          });
        }
        return false;
      });
      setWorkflowPassages(tempSelectedPassages);
      console.log('Workflow Passages', tempSelectedPassages);
    }
  };

  // Recursive function to render tree nodes
  const renderTreeNode = (node: TreeNodeType): JSX.Element => {
    const { data, progress, nodeType, children } = node;

    // Determine label based on node type
    const getLabel = () => {
      if (nodeType === 'section') {
        const section = data as Section;
        console.log('Section', section);
        return section.attributes?.name || `Section ${section.id}`;
      } else if (nodeType === 'chapter') {
        const passage = data as Passage;
        // console.log('Chapter Passage', passage);
        return passage.attributes?.title || `Chapter: ${passage.id}`;
      } else {
        const passage = data as Passage;
        // console.log('Passage', passage);
        return `${passage.attributes?.reference || passage.id}`;
      }
    };

    // Determine progress display based on node type
    const getProgressData = () => {
      if (nodeType === 'passage') {
        return (
          <Box>
            <Typography variant="body2">
              {`Progress: ${progress.percentage}%`}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ fontSize: '0.8rem' }}
            >
              {`Status: ${
                progress.percentage === 100
                  ? 'Complete'
                  : progress.percentage > 0
                  ? 'In Progress'
                  : 'Not Started'
              }`}
            </Typography>
          </Box>
        );
      } else {
        return (
          <Box>
            <Typography variant="body2">
              {nodeType === 'section'
                ? `Passages: ${progress.total}`
                : `Chapter Passages: ${progress.total}`}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ fontSize: '0.8rem' }}
            >
              {`Complete: ${progress.completed} | In Progress: ${progress.inProgress} | Not Started: ${progress.notStarted}`}
            </Typography>
          </Box>
        );
      }
    };

    const getStatusItems = () => {
      const statusItems = [];
      if (nodeType === 'chapter') {
        const passage = data as Passage;
        // if passage is chapter, check for graphics
        const isChapter = String(passage.attributes?.sequencenum).indexOf('.') !== -1;
        if (isChapter) {
          const chapterGraphics = selectedGraphics.filter((graphic) => {
            return (
              String(graphic.attributes?.resourceId) ===
              String(passage.keys?.remoteId)
            );
          });
          if (chapterGraphics.length > 0) {
            statusItems.push({
              label: 'Has Graphics',
              completed: true,
            });
          } else {
            statusItems.push({
              label: 'No Graphics',
              completed: false,
            });
          }
        }

      } else if (nodeType === 'section') {
        const section = data as Section;
        console.log('Section Data', section);
        const sectionRemoteId = section.keys?.remoteId;
        const sectionHasGraphics = selectedGraphics.some(
          (graphic) => String(graphic.attributes?.resourceId) === sectionRemoteId
        );
        if (sectionHasGraphics) {
          statusItems.push({
            label: 'Has Graphics',
            completed: true,
          });
        } else {
          statusItems.push({
            label: 'No Graphics',
            completed: false,
          });
        }
      }

      console.log('Status Items', statusItems);
      return statusItems;
    }

    console.log('Rendering node:', node.id, 'Type:', nodeType);
    console.log('status', getStatusItems());

    return (
      <ProgressTreeNode
        key={node.id}
        initialProgress={progress.percentage}
        label={getLabel()}
        data={getProgressData()}
        initialExpanded={false}
        autoProgress={nodeType !== 'passage'}
        statusItems={getStatusItems()}
      >
        {children.map((child: TreeNodeType) => renderTreeNode(child))}
      </ProgressTreeNode>
    );
  };

  const getReport = (): JSX.Element | null => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '80%' }}>
        <Select
          sx={{ mt: 4 }}
          labelId="select-workflow-step-label"
          id="select-workflow-step"
          value={selectedWorkflowStep?.keys?.remoteId || ''}
          label={'Select Workflow Step'}
          displayEmpty
          renderValue={
            selectedWorkflowStep ? undefined : () => 'Select a workflow step'
          }
          onChange={(event) => {
            const selectedId = event.target.value;
            const selectedStep = selectedWorkflowSteps.find(
              (step) => step.keys?.remoteId === selectedId
            );
            handleWorkflowStepChange(selectedStep);
          }}
        >
          {selectedWorkflowSteps.map((step) => (
            <MenuItem key={step.keys?.remoteId} value={step.keys?.remoteId}>
              {step.attributes?.name}
            </MenuItem>
          ))}
        </Select>
        <Typography variant="h6">{'General Report'}</Typography>
        <Typography variant="body1">
          {`Plan ID: ${planId}`}
          <br />
          {' passage count: ' + selectedPassages.length}
        </Typography>
        <Typography variant="body2">{`Plan Name: ${planName}`}</Typography>

        {/* Overall progress stats */}
        {selectedWorkflowStep && (
          <Box
            sx={{
              my: 2,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant="h6">
              Overall Progress: {overallProgress.percentage}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={overallProgress.percentage}
              sx={{ my: 1, height: 10 }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 1,
              }}
            >
              <Typography variant="body2" color="primary">
                Complete: {overallProgress.completed} (
                {overallProgress.total > 0
                  ? Math.round(
                      (overallProgress.completed / overallProgress.total) * 100
                    )
                  : 0}
                %)
              </Typography>
              <Typography variant="body2" color="secondary">
                In Progress: {overallProgress.inProgress} (
                {overallProgress.total > 0
                  ? Math.round(
                      (overallProgress.inProgress / overallProgress.total) * 100
                    )
                  : 0}
                %)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Not Started: {overallProgress.notStarted} (
                {overallProgress.total > 0
                  ? Math.round(
                      (overallProgress.notStarted / overallProgress.total) * 100
                    )
                  : 0}
                %)
              </Typography>
            </Box>
          </Box>
        )}
        {/* Render tree structure using TreeBuilder */}
        {selectedWorkflowStep && treeData.map(renderTreeNode)}
        <PriButton
          variant="contained"
          onClick={() => {
            showMessage('General Report button clicked');
          }}
          sx={{ mt: 2 }}
        >
          {'Generate General Report'}
        </PriButton>
        <AltButton
          variant="outlined"
          onClick={() => {
            window.location.reload();
          }}
          sx={{ mt: 2 }}
        >
          {'Cancel'}
        </AltButton>
      </Box>
    );
  };

  return (
    <Box
      id="SimpleReportsTab"
      sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      <PaddedBox>
        <Box>{getReport()}</Box>
      </PaddedBox>
    </Box>
  );
}

export default SimpleReportsTab;
