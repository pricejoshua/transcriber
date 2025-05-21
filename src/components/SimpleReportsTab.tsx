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
  // console.log('projectPlans', projectPlans);
  // console.log('passages', passages);
  // console.log('sections', sections);
  // console.log('plans', plans);
  // console.log('projects', projects);
  // console.log('graphics', graphics);
  // console.log('workflowSteps', workflowSteps);
  // console.log('orgWorkflowSteps', orgWorkflowSteps);

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

  // console.log('draftWorkflowSteps', draftWorkflowSteps);
  // console.log('renderWorkflowSteps', renderWorkflowSteps);

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

  // console.log('draftWorkflowStepNames', draftWorkflowStepNames);
  // console.log('renderWorkflowStepNames', renderWorkflowStepNames);

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
      setSelectedWorkflowStep(draftWorkflowSteps[0]);
    }

    const selectedSections = sections.filter((section) => {
      const sectionData = section.relationships?.plan.data;
      if (Array.isArray(sectionData)) {
        return sectionData.some((item) => item.id === projectPlans[0].id);
      }
      return sectionData?.id === projectPlans[0].id;
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
    // console.log('passage', passage);
    const sectionData = passage.relationships?.section.data;
    if (Array.isArray(sectionData)) {
      return sectionData.some((item) => {
        return planSections.some((section) => section.id === item.id);
      });
    }
    return planSections.some((section) => section.id === sectionData?.id);
  });

  // console.log('planSections', planSections);
  // console.log('planPassages', planPassages);

  // planSections.forEach((section) => {
  //   console.log('section', section);
  //   const sectionPassages = passages.filter((passage) => {
  //     const sectionData = passage.relationships?.section.data;
  //     if (Array.isArray(sectionData)) {
  //       return sectionData.some(item => item.id === section.id);
  //     }
  //     return sectionData?.id === section.id;
  //   });
  //   sectionPassages.forEach((passage) => {
  //     console.log('passage', passage);
  //     const passageGraphics = graphics.filter((graphic) => {
  //       const passageData = graphic.relationships?.passage.data;
  //       if (Array.isArray(passageData)) {
  //         return passageData.some(item => item.id === passage.id);
  //       }
  //       return passageData?.id === passage.id;
  //     });
  //   });
  // });

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
    if (selectedWorkflowStep) {
      // const tempSelectedSections = planSections.filter((section) => {
      //   console.log('section', section);

      // });
      console.log('selectedWorkflowStep', selectedWorkflowStep);
      console.log('planSections', planSections);
      console.log('planPassages', planPassages);
      const tempSelectedPassages = planPassages.filter((passage) => {
        const passageData = passage.attributes?.stepComplete;
        const passageSteps = passageData
          ? JSON.parse(passageData) : undefined;
        if (passageSteps && passageSteps.completed) {
          console.log('passageStep', passageSteps);
          return passageSteps.completed.some((step: any) => {
            console.log('step', step);
            console.log('selectedWorkflowStep', selectedWorkflowStep);
            console.log('step.stepid', step.stepid);
            console.log('selectedWorkflowStep.id', selectedWorkflowStep.id);
            console.log('selectedWorkflowStep.keys.remoteId', selectedWorkflowStep?.keys?.remoteId);
            console.log('step.stepid === selectedWorkflowStep?.keys?.remoteId', step.stepid === selectedWorkflowStep?.keys?.remoteId);
            const boolTest = step.stepid === selectedWorkflowStep?.keys?.remoteId;
            console.log('boolTest', boolTest);
            return boolTest;
          });
        }
        return false;
      });
      setSelectedPassages(tempSelectedPassages);
      console.log('tempSelectedPassages', tempSelectedPassages);
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
              value={selectedWorkflowStep?.id || ''}
              label={'Select Workflow Step'}
              onChange={(event) => {
                const selectedId = event.target.value;
                const selectedStep = selectedWorkflowSteps.find(
                  (step) => step.id === selectedId
                );
                console.log('selectedStep', selectedStep);
                handleWorkflowStepChange(selectedStep);
              }}
            >
              {selectedWorkflowSteps.map((step) => (
                <MenuItem key={step.id} value={step.id}>
                  {camel2Title(step.attributes?.name)}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="h6">{'General Report'}</Typography>
            <Typography variant="body1">
              {`Plan ID: ${planId}`}
              {' section count: ' + planSections.length}
              {' passage count: ' + planPassages.length}
            </Typography>
            <Typography variant="body2">{`Plan Name: ${planName}`}</Typography>
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
                showMessage('Cancel button clicked');
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
