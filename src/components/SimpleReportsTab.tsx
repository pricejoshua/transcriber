import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import {
  IState,
  Plan,
  ISharedStrings,
  OrgWorkflowStepD,
  Passage,
  BookName,
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
} from '../model';
import {
  Box,
  LinearProgress,
  Tabs,
  Tab,
  Typography,
  Select,
  MenuItem,
  Button,
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
import { camel2Title } from '../utils';
import { usePlanType } from '../crud';
import { set } from 'lodash';
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
  const graphics = useOrbitData<GraphicD[]>('graphic');
  const workflowSteps = useOrbitData<WorkflowStep[]>('workflowstep');
  const orgWorkflowSteps = useOrbitData<OrgWorkflowStep[]>('orgworkflowstep');
  const organizationSchemeSteps = useOrbitData<OrganizationSchemeStepD[]>(
    'organizationschemestep'
  );
  const getPlanType = usePlanType();

  const [plan, setPlan] = useGlobal('plan');
  const [isScripture, setScripture] = useState(false);

  enum WorkflowType {
    Draft = 'draft',
    Render = 'Render',
  }

  const { projectPlans } = props;

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
      const sectionData = passage.relationships?.section.data;
      if (Array.isArray(sectionData)) {
        return sectionData.some((item) => item.id === projectPlans[0].id);
      }
      return sectionData?.id === projectPlans[0].id;
    });
    setSelectedPassages(selectedPassages);

    const selectedGraphics = graphics.filter((graphic) => {
      if (graphic.attributes?.resourceType === 'section') {
        // graphic.attributes?.resourceId is in the selected sections ID
        return selectedSections.some(
          (section) => section.id === String(graphic.attributes?.resourceId)
        );
      }
      return false;
    });

    setSelectedGraphics(selectedGraphics);
    console.log('selectedGraphics', selectedGraphics);
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
  const [selectedGraphics, setSelectedGraphics] = useState<GraphicD[]>([]);

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
      setSelectedPassages(tempSelectedPassages);
    }
  };

  const getReport = (): JSX.Element | null => {
    switch (reportTab) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '80%' }}>
            <Select
              labelId="select-workflow-step-label"
              id="select-workflow-step"
              value={selectedWorkflowStep?.keys?.remoteId || ''}
              label={'Select Workflow Step'}
              displayEmpty
              renderValue={
                selectedWorkflowStep
                  ? undefined
                  : () => 'Select a workflow step'
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
            {selectedWorkflowStep &&
              (() => {
                // Create hierarchical structure based on section levels
                const buildSectionHierarchy = (sections: Section[]) => {
                  const sortedSections = sections.sort(
                    (a, b) =>
                      (a.attributes?.sequencenum || 0) -
                      (b.attributes?.sequencenum || 0)
                  );

                  const renderSectionTree = (
                    currentLevel: number,
                    startIndex: number
                  ): { elements: JSX.Element[]; nextIndex: number } => {
                    const elements: JSX.Element[] = [];
                    let index = startIndex;

                    while (index < sortedSections.length) {
                      const section = sortedSections[index];
                      const sectionLevel = section.attributes?.level || 1;

                      // If we encounter a section at a higher level (lower number), we should stop
                      if (sectionLevel < currentLevel) {
                        break;
                      }

                      // If this section is at our current level, process it
                      if (sectionLevel === currentLevel) {
                        const sectionPassages = selectedPassages.filter(
                          (passage) => {
                            const sectionData =
                              passage.relationships?.section.data;
                            if (Array.isArray(sectionData)) {
                              return sectionData.some(
                                (item) => item.id === section.id
                              );
                            }
                            return sectionData?.id === section.id;
                          }
                        );

                        // Calculate section progress
                        const completedPassages = sectionPassages.filter(
                          (passage) => {
                            const passageData =
                              passage.attributes?.stepComplete;
                            const passageSteps = passageData
                              ? JSON.parse(passageData)
                              : undefined;
                            const passageStep = passageSteps?.completed?.find(
                              (stepItem: any) =>
                                stepItem.stepid ===
                                selectedWorkflowStep?.keys?.remoteId
                            );
                            return passageStep?.complete === true;
                          }
                        );

                        const sectionProgress =
                          sectionPassages.length > 0
                            ? Math.round(
                                (completedPassages.length /
                                  sectionPassages.length) *
                                  100
                              )
                            : 0;

                        // Look ahead to find child sections
                        const childResult = renderSectionTree(
                          currentLevel + 1,
                          index + 1
                        );
                        const childElements = childResult.elements;
                        index = childResult.nextIndex;

                        elements.push(
                          <ProgressTreeNode
                            key={section.id}
                            initialProgress={sectionProgress}
                            label={section.attributes?.name}
                            data={
                              <Typography variant="body2">
                                {`Passages: ${sectionPassages.length}`}
                              </Typography>
                            }
                            initialExpanded={true}
                          >
                            {/* Render child sections first */}
                            {childElements}

                            {/* Then render passages for this section */}
                            {sectionPassages.map((passage) => {
                              const passageData =
                                passage.attributes?.stepComplete;
                              const passageSteps = passageData
                                ? JSON.parse(passageData)
                                : undefined;
                              const passageStep = passageSteps?.completed?.find(
                                (stepItem: any) =>
                                  stepItem.stepid ===
                                  selectedWorkflowStep?.keys?.remoteId
                              );
                              const passageProgress = passageStep
                                ? passageStep.complete
                                  ? 100
                                  : passageStep.progress || 0
                                : 0;

                              return (
                                <ProgressTreeNode
                                  key={passage.id}
                                  initialProgress={passageProgress}
                                  label={passage.attributes?.book}
                                  data={
                                    <Typography variant="body2">
                                      {`Progress: ${passageProgress}%`}
                                    </Typography>
                                  }
                                >
                                  <Typography variant="body2">
                                    {`Passage ID: ${passage.id}`}
                                  </Typography>
                                  <Typography variant="body2">
                                    {`Passage Step: ${
                                      passageStep?.stepid || 'None'
                                    }`}
                                  </Typography>
                                </ProgressTreeNode>
                              );
                            })}
                          </ProgressTreeNode>
                        );
                      } else {
                        // If we encounter a section at a lower level (higher number), skip it
                        // as it should be handled by a parent section
                        index++;
                      }
                    }

                    return { elements, nextIndex: index };
                  };

                  return renderSectionTree(1, 0).elements;
                };

                return buildSectionHierarchy(selectedSections);
              })()}
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
      case 1:
        return <Typography variant="body1">{'Publish Readiness'}</Typography>;
      default:
        return null;
    }
  };

  return (
    <Box
      id="SimpleReportsTab"
      sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      <TabAppBar position="fixed" color="default">
        <TabActions>
          <GrowingSpacer />
          <FilterButton filter={filter} onFilter={handleFilter} />
        </TabActions>
      </TabAppBar>
      <PaddedBox>
        <Tabs
          value={reportTab}
          onChange={handleReportTabChange}
          aria-label="report-tabs"
          sx={{ mb: 2 }}
        >
          <Tab label={'General Report'} id="report-tab-0" />
          {canPublish && <Tab label={'Publish Readiness'} id="report-tab-1" />}
        </Tabs>

        <Box>{getReport()}</Box>
      </PaddedBox>
    </Box>
  );
}

export default SimpleReportsTab;
