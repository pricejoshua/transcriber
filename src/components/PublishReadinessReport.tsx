import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Chip,
  Stack,
  LinearProgress,
  IconButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PublishIcon from '@mui/icons-material/Publish';
import { GrowingSpacer, TabActions } from '../control'
import { IPublishReadinessData, ReadinessFilterEnum, Plan } from '../model';
import { usePublishReadiness } from '../crud/usePublishReadiness';
import { reportsTabSelector } from '../selector';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`readiness-tabpanel-${index}`}
      aria-labelledby={`readiness-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface IProps {
  projectPlans: Plan[];
}

const PublishReadinessReport: React.FC<IProps> = ({ projectPlans }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [filter, setFilter] = useState<ReadinessFilterEnum>(
    ReadinessFilterEnum.All
  );
  const { readinessData, loading } = usePublishReadiness(projectPlans, filter);
  const t = useSelector(reportsTabSelector);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(
      event.target.checked
        ? ReadinessFilterEnum.MissingOnly
        : ReadinessFilterEnum.All
    );
  };

  const handleReadyToPublishFilter = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilter(
      event.target.checked
        ? ReadinessFilterEnum.ReadyToPublish
        : ReadinessFilterEnum.All
    );
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {t.loadingReadinessData}
        </Typography>
      </Box>
    );
  }

  if (!readinessData) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <Typography variant="body1">{t.noReadinessData}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">{t.publishReadiness}</Typography>
        <TabActions sx={{ justifyContent: 'flex-end' }}>
          <FormControlLabel
            control={
              <Switch
                checked={filter === ReadinessFilterEnum.MissingOnly}
                onChange={handleFilterChange}
                name="showMissingOnly"
              />
            }
            label={t.showMissingItemsOnly}
          />
          <FormControlLabel
            control={
              <Switch
                checked={filter === ReadinessFilterEnum.ReadyToPublish}
                onChange={handleReadyToPublishFilter}
                name="showReadyToPublish"
              />
            }
            label={t.showReadyToPublish}
          />
          <GrowingSpacer />
        </TabActions>
      </Box>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="readiness-tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={t.bibleMetadata} id="readiness-tab-0" />
            <Tab label={t.projectMetadata} id="readiness-tab-1" />
            <Tab label={t.movements} id="readiness-tab-2" />
            <Tab label={t.sections} id="readiness-tab-3" />
            <Tab label={t.chapters} id="readiness-tab-4" />
            <Tab label={t.passages} id="readiness-tab-5" />
            <Tab label={t.notes} id="readiness-tab-6" />
          </Tabs>
        </Box>

        {/* Bible Metadata Tab */}
        <TabPanel value={tabIndex} index={0}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t.item}</TableCell>
                  <TableCell>{t.value}</TableCell>
                  <TableCell align="center">{t.status}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{t.bibleId}</TableCell>
                  <TableCell>
                    {readinessData.bibleMetadata.bibleId.value}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.bibleMetadata.bibleId.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.bibleName}</TableCell>
                  <TableCell>
                    {readinessData.bibleMetadata.bibleName.value}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.bibleMetadata.bibleName.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.languageName}</TableCell>
                  <TableCell>
                    {readinessData.bibleMetadata.languageName.value}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.bibleMetadata.languageName.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.languageIso}</TableCell>
                  <TableCell>
                    {readinessData.bibleMetadata.languageIso.value}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.bibleMetadata.languageIso.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.languageRecording}</TableCell>
                  <TableCell>
                    {readinessData.bibleMetadata.languageRecording.value
                      ? t.recorded
                      : t.notRecorded}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.bibleMetadata.languageRecording.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.bibleNameRecording}</TableCell>
                  <TableCell>
                    {readinessData.bibleMetadata.bibleNameRecording.value
                      ? t.recorded
                      : t.notRecorded}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.bibleMetadata.bibleNameRecording.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.copyright}</TableCell>
                  <TableCell>
                    {readinessData.bibleMetadata.copyright.value}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.bibleMetadata.copyright.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Project Metadata Tab */}
        <TabPanel value={tabIndex} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t.item}</TableCell>
                  <TableCell>{t.value}</TableCell>
                  <TableCell align="center">{t.status}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{t.projectName}</TableCell>
                  <TableCell>
                    {readinessData.projectMetadata.name.value}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.projectMetadata.name.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.graphic}</TableCell>
                  <TableCell>
                    {readinessData.projectMetadata.graphic.value
                      ? t.uploaded
                      : t.notUploaded}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.projectMetadata.graphic.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.alternativeName}</TableCell>
                  <TableCell>
                    {readinessData.projectMetadata.altName.value}
                  </TableCell>
                  <TableCell align="center">
                    {readinessData.projectMetadata.altName.ready ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Movements Tab */}
        <TabPanel value={tabIndex} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t.sequence}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell align="center">{t.titleRecorded}</TableCell>
                  <TableCell align="center">{t.publishStatus}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {readinessData.movements.length > 0 ? (
                  readinessData.movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{movement.sequence}</TableCell>
                      <TableCell>{movement.name.value}</TableCell>
                      <TableCell align="center">
                        {movement.name.ready ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {movement.published ? (
                          <Chip
                            icon={<PublishIcon />}
                            label={t.published}
                            color="success"
                            size="small"
                          />
                        ) : movement.readyToPublish ? (
                          <Chip
                            label={t.readyToPublish}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip label={t.notReady} color="error" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {t.noMovementsAvailable}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Sections Tab */}
        <TabPanel value={tabIndex} index={3}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t.sequence}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell align="center">{t.titleRecorded}</TableCell>
                  <TableCell align="center">{t.publishStatus}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {readinessData.sections.length > 0 ? (
                  readinessData.sections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>{section.sequence}</TableCell>
                      <TableCell>{section.name.value}</TableCell>
                      <TableCell align="center">
                        {section.titleRecording.ready ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {section.published ? (
                          <Chip
                            icon={<PublishIcon />}
                            label={t.published}
                            color="success"
                            size="small"
                          />
                        ) : section.readyToPublish ? (
                          <Chip
                            label={t.readyToPublish}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip label={t.notReady} color="error" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {t.noSectionsAvailable}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Chapters Tab */}
        <TabPanel value={tabIndex} index={4}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t.chapterNumber}</TableCell>
                  <TableCell align="center">{t.recorded}</TableCell>
                  <TableCell align="center">{t.publishStatus}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {readinessData.chapters.length > 0 ? (
                  readinessData.chapters.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell>{chapter.number}</TableCell>
                      <TableCell align="center">
                        {chapter.recorded ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {chapter.published ? (
                          <Chip
                            icon={<PublishIcon />}
                            label={t.published}
                            color="success"
                            size="small"
                          />
                        ) : chapter.readyToPublish ? (
                          <Chip
                            label={t.readyToPublish}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip label={t.notReady} color="error" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      {t.noChaptersAvailable}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Passages Tab */}
        <TabPanel value={tabIndex} index={5}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t.reference}</TableCell>
                  <TableCell>{t.passage}</TableCell>
                  <TableCell align="center">{t.recorded}</TableCell>
                  <TableCell align="center">{t.publishStatus}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {readinessData.passages.length > 0 ? (
                  readinessData.passages.map((passage) => (
                    <TableRow key={passage.id}>
                      <TableCell>{passage.reference}</TableCell>
                      <TableCell>{passage.passage}</TableCell>
                      <TableCell align="center">
                        {passage.recorded ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {passage.published ? (
                          <Chip
                            icon={<PublishIcon />}
                            label={t.published}
                            color="success"
                            size="small"
                          />
                        ) : passage.readyToPublish ? (
                          <Chip
                            label={t.readyToPublish}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip label={t.notReady} color="error" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {t.noPassagesAvailable}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={tabIndex} index={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.content}</TableCell>
                  <TableCell align="center">{t.recorded}</TableCell>
                  <TableCell align="center">{t.publishStatus}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {readinessData.notes.length > 0 ? (
                  readinessData.notes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell>{note.title.value}</TableCell>
                      <TableCell>{note.content.value}</TableCell>
                      <TableCell align="center">
                        {note.recording.ready ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {note.published ? (
                          <Chip
                            icon={<PublishIcon />}
                            label={t.published}
                            color="success"
                            size="small"
                          />
                        ) : note.readyToPublish ? (
                          <Chip
                            label={t.readyToPublish}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip label={t.notReady} color="error" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {t.noNotesAvailable}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default PublishReadinessReport;
