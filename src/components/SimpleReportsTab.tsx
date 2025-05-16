import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import {
  IState,
  Plan,
  IReportsTabStrings,
  ISharedStrings,
  OrgWorkflowStepD,
  Passage,
  BookName,
  PassageD,
  Section,
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
import PublishReadinessReport from './PublishReadinessReport';
import { useProjectPermissions } from '../utils/useProjectPermissions';

interface IProps {
  projectPlans: Plan[];
  planColumn?: boolean;
  floatTop?: boolean;
  step?: string;
  orgSteps?: OrgWorkflowStepD[];
  sectionArr: [number, string][];
}

export function SimpleReportsTab(props: IProps) {
  const { projectPlans, planColumn, floatTop, step, orgSteps, sectionArr } = props;
  const sectionMap = new Map<number, string>(sectionArr);
  const getTranscription = useTranscription(true);

  const t: IReportsTabStrings = useSelector(reportsTabSelector);
  const ts: ISharedStrings = useSelector(sharedSelector);
  const { showMessage } = useSnackBar();
  const { canPublish } = useProjectPermissions();

  // Basic state
  const [busy, setBusy] = useGlobal('importexportBusy');
  const [filter, setFilter] = useState(false);
  const [reportTab, setReportTab] = useState(0);

  // Placeholder handlers
  const handleFilter = () => setFilter(!filter);

  const handleReportTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setReportTab(newValue);
  };

  return (
    <Box id="SimpleReportsTab" sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <TabAppBar
        position="fixed"
        highBar={planColumn || floatTop}
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
          <Tab label={t.generalReport} id="report-tab-0" />
          {canPublish && <Tab label={t.publishReadiness} id="report-tab-1" />}
        </Tabs>

        {reportTab === 0 && (
          <Box>
            {/* General report content will go here */}
            <Typography variant="body1">
              {t.generalReportDescription}
            </Typography>
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

        {reportTab === 1 && canPublish && (
          <PublishReadinessReport projectPlans={projectPlans} />
        )}
      </PaddedBox>
    </Box>
  );
}

export default SimpleReportsTab;
