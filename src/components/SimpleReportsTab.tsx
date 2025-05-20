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
import { Box, LinearProgress, Tabs, Tab, Typography } from '@mui/material';
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
import {
  reportsTabSelector,
  sharedSelector,
  transcriptionTabSelector,
} from '../selector';
import { related, sectionCompare, passageCompare, passageRefText, useTranscription } from '../crud';
import { getSection } from './AudioTab';
import { mapNamedFullResponses } from '@orbit/data';
import { useProjectPermissions } from '../utils/useProjectPermissions';
import { useOrbitData } from '../hoc/useOrbitData';
import { OrganizationSchemeStepD } from '../model/organizationSchemeStep';

interface IProps {
  projectPlans: Plan[];
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
  const getTranscription = useTranscription(true);

  const { projectPlans } = props;
  console.log('projectPlans', projectPlans);

  // const t: IReportsTabStrings = useSelector(reportsTabSelector);
  const ts: ISharedStrings = useSelector(sharedSelector);
  const { showMessage } = useSnackBar();
  const { canPublish } = useProjectPermissions();

  // Basic state
  const [busy, setBusy] = useGlobal('importexportBusy');
  const [filter, setFilter] = useState(false);
  const [reportTab, setReportTab] = useState(0);

  // Placeholder handlers
  const handleFilter = () => setFilter(!filter);

  const handleReportTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setReportTab(newValue);
  };

  const getComponent = (): JSX.Element | null => {
    switch (reportTab) {
      case 0:
        return <Typography variant="body1">{'General Report'}</Typography>;
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
      <TabAppBar
        position="fixed"
        color="default"
      >
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

        {reportTab === 0 && (
          <Box>
            {/* General report content will go here */}
            {getComponent()}
            <LinearProgress
              variant="determinate"
              value={64}
              sx={{
                width: '100%',
                height: 20,
                backgroundColor: 'primary.light',
              }}
            />
          </Box>
        )}
      </PaddedBox>
    </Box>
  );
}

export default SimpleReportsTab;
