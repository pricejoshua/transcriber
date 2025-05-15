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
import { Box, LinearProgress } from '@mui/material';
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

  // Basic state
  const [busy, setBusy] = useGlobal('importexportBusy');
  const [filter, setFilter] = useState(false);

  // Placeholder handlers
  const handleFilter = () => setFilter(!filter);

  const handleAction = () => {
    showMessage('Action triggered');
  };

  const getCopy = (
    projectPlans: Plan[],
    passages: Array<Passage>,
    sections: Array<Section>,
    bookData: BookName[]
  ) => {
    const copyData: string[] = [];
    projectPlans.forEach((planRec) => {
      let planName = planColumn ? planRec?.attributes?.name : '';
      sections
        .filter((s) => related(s, 'plan') === planRec.id && s.attributes)
        .sort(sectionCompare)
        .forEach((section) => {
          const sectionpassages = passages
            .filter((ps) => related(ps, 'section') === section.id)
            .sort(passageCompare) as PassageD[];
          let sectionHead =
            '-----\n' + getSection([section], sectionMap) + '\n';
          sectionpassages.forEach((passage) => {
            // const state = passage?.attributes?.state ||'';
            const ref = passageRefText(passage, bookData);
            const transcription = getTranscription(passage.id, exportId);
            if (transcription !== '') {
              if (planName && planName !== '') {
                copyData.push(`*****\n${planName}\n`);
                planName = '';
              }
              if (sectionHead !== '') {
                copyData.push(sectionHead);
                sectionHead = '';
              }
              if (ref && ref !== '') copyData.push(ref);
              copyData.push(transcription + '\n');
            }
          });
        });
    });

    return copyData;
  };
  // You can add more state and handlers as needed

  return (
    <Box id="SimpleReportsTab" sx={{ display: 'flex' }}>
      <div>
        <TabAppBar
          position="fixed"
          highBar={planColumn || floatTop}
          color="default"
        >
          <TabActions>
            <AltButton
              id="action1"
              key="action1"
              aria-label="Action 1"
              onClick={handleAction}
              title="Action 1"
            >
              Action 1
            </AltButton>
            <AltButton
              id="action2"
              key="action2"
              aria-label="Action 2"
              onClick={handleAction}
              title="Action 2"
            >
              Action 2
            </AltButton>
            <GrowingSpacer />
            <FilterButton filter={filter} onFilter={handleFilter} />
          </TabActions>
        </TabAppBar>
        <PaddedBox>
          {/* Your main content goes here */}
          <div>Placeholder for main content</div>
          <LinearProgress
            variant="determinate"
            value={64}
            sx={{
              width: '100%',
              height: 20,
              backgroundColor: 'primary.light',
            }}
          />
        </PaddedBox>
      </div>
    </Box>
  );
}

export default SimpleReportsTab;
