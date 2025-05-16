import { useEffect, useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import {
  Bible,
  ProjectD,
  Plan,
  IPublishReadinessData,
  IBibleMetadataReadiness,
  IProjectMetadataReadiness,
  ISectionReadiness,
  IChapterReadiness,
  IPassageReadiness,
  INoteReadiness,
  IMovementReadiness,
  ReadinessFilterEnum,
  BibleD,
} from '../model';
import { Section, Passage, MediaFile } from '../model';
import {
  useBible,
  usePublishDestination,
  related,
  sectionCompare,
  pubDataCopyright,
} from '../crud';

import { PassageTypeEnum } from '../model/passageType';

export const usePublishReadiness = (
  projectPlans: Plan[],
  filter: ReadinessFilterEnum = ReadinessFilterEnum.All
) => {
  const [memory] = useGlobal('memory');
  const [project] = useGlobal('project');
  const [readinessData, setReadinessData] = useState<IPublishReadinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const { getOrgBible, getPublishingData } = useBible();
  const { isPublished, getPublishTo } = usePublishDestination();
  const [projectRec, setProjectRec] = useState<ProjectD | undefined>();

  useEffect(() => {
    if (project && memory) {
      setProjectRec(
        memory.cache.query((q) =>
          q.findRecord({ type: 'project', id: project })
        ) as ProjectD
      );
    }
  }, [project, memory]);

  useEffect(() => {
    if (projectRec && projectPlans.length > 0) {
      setLoading(true);
      collectReadinessData().then((data) => {
        setReadinessData(data);
        setLoading(false);
      });
    }
  }, [projectRec, projectPlans, filter]);

  const collectReadinessData = async (): Promise<IPublishReadinessData> => {
    const data: IPublishReadinessData = {
      bibleMetadata: await getBibleMetadataReadiness(),
      projectMetadata: getProjectMetadataReadiness(),
      movements: await getMovementsReadiness(),
      sections: await getSectionsReadiness(),
      chapters: await getChaptersReadiness(),
      passages: await getPassagesReadiness(),
      notes: await getNotesReadiness(),
    };

    return filterData(data);
  };

  const filterData = (data: IPublishReadinessData): IPublishReadinessData => {
    if (filter === ReadinessFilterEnum.All) {
      return data;
    }

    const isReadinessItem = (ready: boolean, published: boolean) => {
      return filter === ReadinessFilterEnum.MissingOnly
        ? !ready
        : ready && !published;
    };

    return {
      bibleMetadata:
        filter === ReadinessFilterEnum.MissingOnly
          ? {
              ...data.bibleMetadata,
              bibleId: data.bibleMetadata.bibleId.ready
                ? { value: '', ready: true }
                : data.bibleMetadata.bibleId,
              bibleName: data.bibleMetadata.bibleName.ready
                ? { value: '', ready: true }
                : data.bibleMetadata.bibleName,
              languageName: data.bibleMetadata.languageName.ready
                ? { value: '', ready: true }
                : data.bibleMetadata.languageName,
              languageIso: data.bibleMetadata.languageIso.ready
                ? { value: '', ready: true }
                : data.bibleMetadata.languageIso,
              languageRecording: data.bibleMetadata.languageRecording.ready
                ? { value: '', ready: true }
                : data.bibleMetadata.languageRecording,
              bibleNameRecording: data.bibleMetadata.bibleNameRecording.ready
                ? { value: '', ready: true }
                : data.bibleMetadata.bibleNameRecording,
              copyright: data.bibleMetadata.copyright.ready
                ? { value: '', ready: true }
                : data.bibleMetadata.copyright,
            }
          : data.bibleMetadata,
      projectMetadata:
        filter === ReadinessFilterEnum.MissingOnly
          ? {
              ...data.projectMetadata,
              name: data.projectMetadata.name.ready
                ? { value: '', ready: true }
                : data.projectMetadata.name,
              graphic: data.projectMetadata.graphic.ready
                ? { value: '', ready: true }
                : data.projectMetadata.graphic,
              altName: data.projectMetadata.altName.ready
                ? { value: '', ready: true }
                : data.projectMetadata.altName,
            }
          : data.projectMetadata,
      movements: data.movements.filter((m) =>
        isReadinessItem(m.readyToPublish, m.published)
      ),
      sections: data.sections.filter((s) =>
        isReadinessItem(s.readyToPublish, s.published)
      ),
      chapters: data.chapters.filter((c) =>
        isReadinessItem(c.readyToPublish, c.published)
      ),
      passages: data.passages.filter((p) =>
        isReadinessItem(p.readyToPublish, p.published)
      ),
      notes: data.notes.filter((n) =>
        isReadinessItem(n.readyToPublish, n.published)
      ),
    };
  };

  const getBibleMetadataReadiness = async (): Promise<IBibleMetadataReadiness> => {
    const teamId = related(projectRec, 'organization');
    const bible = getOrgBible(teamId) as BibleD;

    const isoMediafile = related(bible, 'isoMediafile') as string;
    const bibleMediafile = related(bible, 'bibleMediafile') as string;

    let isoMediafileReady = false;
    let bibleMediafileReady = false;

    if (isoMediafile) {
      const mediaRec = memory?.cache.query((q) =>
        q.findRecord({ type: 'mediafile', id: isoMediafile })
      ) as MediaFile;
      isoMediafileReady = !!mediaRec && (mediaRec.attributes.s3file || '') !== '';
    }

    if (bibleMediafile) {
      const mediaRec = memory?.cache.query((q) =>
        q.findRecord({ type: 'mediafile', id: bibleMediafile })
      ) as MediaFile;
      bibleMediafileReady = !!mediaRec && (mediaRec.attributes.s3file || '') !== '';
    }

    const copyright = getPublishingData(pubDataCopyright, bible) as string;

    return {
      bibleId: {
        value: bible?.attributes?.bibleId || '',
        ready: !!bible?.attributes?.bibleId,
      },
      bibleName: {
        value: bible?.attributes?.bibleName || '',
        ready: !!bible?.attributes?.bibleName,
      },
      languageName: {
        value: bible?.attributes?.languageName || '',
        ready: !!bible?.attributes?.languageName,
      },
      languageIso: {
        value: bible?.attributes?.iso || '',
        ready: !!bible?.attributes?.iso,
      },
      languageRecording: {
        value: isoMediafile || '',
        ready: isoMediafileReady,
      },
      bibleNameRecording: {
        value: bibleMediafile || '',
        ready: bibleMediafileReady,
      },
      copyright: {
        value: copyright || '',
        ready: !!copyright,
      },
    };
  };

  const getProjectMetadataReadiness = (): IProjectMetadataReadiness => {
    const hasGraphic = projectRec?.attributes?.picture !== undefined;

    return {
      name: {
        value: projectRec?.attributes?.name || '',
        ready: !!projectRec?.attributes?.name,
      },
      graphic: {
        value: projectRec?.attributes?.picture || '',
        ready: hasGraphic,
      },
      altName: {
        value: projectRec?.attributes?.description || '',
        ready: !!projectRec?.attributes?.description,
      },
    };
  };

  const getMovementsReadiness = async (): Promise<IMovementReadiness[]> => {
    const movements: IMovementReadiness[] = [];

    for (const plan of projectPlans) {
      const planRec = memory?.cache.query((q) =>
        q.findRecord({ type: 'plan', id: plan.id })
      );

      if (planRec) {
        const sections = memory?.cache.query((q) =>
          q.findRecords('section')
        ) as Section[];

        const planSections = sections.filter(
          (s) => related(s, 'plan') === plan.id
        );

        for (const section of planSections) {
          if (section.attributes.type === 'movement') {
            const published = section.attributes.published || false;
            const publishTo = getPublishTo(section.attributes.publishTo || '{}', true, false, true);
            const hasBeenPublished = isPublished(publishTo);
            const titleMediafileId = section.attributes.titlemediafileid;

            let titleRecordingReady = false;
            if (titleMediafileId) {
              const mediaRec = memory?.cache.query((q) =>
                q.findRecord({ type: 'mediafile', id: titleMediafileId })
              ) as MediaFile;
              titleRecordingReady = !!mediaRec && (mediaRec.attributes.s3file || '') !== '';
            }

            movements.push({
              id: section.id,
              sequence: section.attributes.sequencenum,
              name: {
                value: section.attributes.name || '',
                ready: !!section.attributes.name,
              },
              published: hasBeenPublished,
              readyToPublish: !!section.attributes.name && titleRecordingReady,
            });
          }
        }
      }
    }

    return movements.sort((a, b) => a.sequence - b.sequence);
  };

  const getSectionsReadiness = async (): Promise<ISectionReadiness[]> => {
    const sectionsData: ISectionReadiness[] = [];

    for (const plan of projectPlans) {
      const planRec = memory?.cache.query((q) =>
        q.findRecord({ type: 'plan', id: plan.id })
      );

      if (planRec) {
        const sections = memory?.cache.query((q) =>
          q.findRecords('section')
        ) as Section[];

        const planSections = sections.filter(
          (s) => related(s, 'plan') === plan.id
        );

        for (const section of planSections) {
          if (section.attributes.type !== 'movement') {
            const published = section.attributes.published || false;
            const publishTo = getPublishTo(section.attributes.publishTo || '{}', true, false, true);
            const hasBeenPublished = isPublished(publishTo);
            const titleMediafileId = section.attributes.titlemediafileid;

            let titleRecordingReady = false;
            if (titleMediafileId) {
              const mediaRec = memory?.cache.query((q) =>
                q.findRecord({ type: 'mediafile', id: titleMediafileId })
              ) as MediaFile;
              titleRecordingReady = !!mediaRec && (mediaRec.attributes.s3file || '') !== '';
            }

            sectionsData.push({
              id: section.id,
              sequence: section.attributes.sequencenum,
              name: {
                value: section.attributes.name || '',
                ready: !!section.attributes.name,
              },
              title: {
                value: section.attributes.title || '',
                ready: !!section.attributes.title,
              },
              titleRecording: {
                value: titleMediafileId || '',
                ready: titleRecordingReady,
              },
              published: hasBeenPublished,
              readyToPublish:
                !!section.attributes.name &&
                !!section.attributes.title &&
                titleRecordingReady,
            });
          }
        }
      }
    }

    return sectionsData.sort((a, b) => sectionCompare(a.sequence, b.sequence));
  };

  const getChaptersReadiness = async (): Promise<IChapterReadiness[]> => {
    const chaptersData: IChapterReadiness[] = [];

    for (const plan of projectPlans) {
      const sections = memory?.cache.query((q) =>
        q.findRecords('section')
      ) as Section[];

      const planSections = sections.filter(
        (s) => related(s, 'plan') === plan.id && s.attributes.type !== 'movement'
      );

      for (const section of planSections) {
        const passages = memory?.cache.query((q) =>
          q.findRecords('passage')
        ) as Passage[];

        const sectionPassages = passages.filter(
          (p) => related(p, 'section') === section.id
        );

        // Get chapter number passages
        const chapterPassages = sectionPassages.filter(
          (p) => p.attributes.sequencenum > 0 &&
                p.attributes.passagetypeid === PassageTypeEnum.CHAPTERNUMBER
        );

        for (const chapterPassage of chapterPassages) {
          const published = chapterPassage.attributes.published || false;
          const publishTo = getPublishTo(chapterPassage.attributes.publishTo || '{}', true, false, true);
          const hasBeenPublished = isPublished(publishTo);
          const mediafileId = related(chapterPassage, 'mediafile') as string;

          let recordingReady = false;
          if (mediafileId) {
            const mediaRec = memory?.cache.query((q) =>
              q.findRecord({ type: 'mediafile', id: mediafileId })
            ) as MediaFile;
            recordingReady = !!mediaRec && (mediaRec.attributes.s3file || '') !== '';
          }

          chaptersData.push({
            id: chapterPassage.id,
            section: section.id,
            number: chapterPassage.attributes.sequencenum,
            recorded: recordingReady,
            published: hasBeenPublished,
            readyToPublish: recordingReady,
          });
        }
      }
    }

    return chaptersData.sort((a, b) => a.number - b.number);
  };

  const getPassagesReadiness = async (): Promise<IPassageReadiness[]> => {
    const passagesData: IPassageReadiness[] = [];

    for (const plan of projectPlans) {
      const sections = memory?.cache.query((q) =>
        q.findRecords('section')
      ) as Section[];

      const planSections = sections.filter(
        (s) => related(s, 'plan') === plan.id && s.attributes.type !== 'movement'
      );

      for (const section of planSections) {
        const passages = memory?.cache.query((q) =>
          q.findRecords('passage')
        ) as Passage[];

        const sectionPassages = passages.filter(
          (p) => related(p, 'section') === section.id
        );

        // Get regular passages (not chapter numbers or notes)
        const regularPassages = sectionPassages.filter(
          (p) => p.attributes.sequencenum > 0 &&
                p.attributes.passagetypeid !== PassageTypeEnum.CHAPTERNUMBER &&
                p.attributes.passagetypeid !== PassageTypeEnum.NOTE
        );

        for (const passage of regularPassages) {
          const published = passage.attributes.published || false;
          const publishTo = getPublishTo(passage.attributes.publishTo || '{}', true, false, true);
          const hasBeenPublished = isPublished(publishTo);
          const mediafileId = related(passage, 'mediafile') as string;

          let recordingReady = false;
          if (mediafileId) {
            const mediaRec = memory?.cache.query((q) =>
              q.findRecord({ type: 'mediafile', id: mediafileId })
            ) as MediaFile;
            recordingReady = !!mediaRec && (mediaRec.attributes.s3file || '') !== '';
          }

          passagesData.push({
            id: passage.id,
            section: section.id,
            reference: passage.attributes.reference || '',
            passage: passage.attributes.book + ' ' + passage.attributes.reference,
            recorded: recordingReady,
            published: hasBeenPublished,
            readyToPublish: recordingReady && !!passage.attributes.reference,
          });
        }
      }
    }

    return passagesData.sort((a, b) => passageTypeCompare(
      { attributes: { sequencenum: parseInt(a.reference.split(':')[0]) } } as Passage,
      { attributes: { sequencenum: parseInt(b.reference.split(':')[0]) } } as Passage
    ));
  };

  const getNotesReadiness = async (): Promise<INoteReadiness[]> => {
    const notesData: INoteReadiness[] = [];

    for (const plan of projectPlans) {
      const sections = memory?.cache.query((q) =>
        q.findRecords('section')
      ) as Section[];

      const planSections = sections.filter(
        (s) => related(s, 'plan') === plan.id && s.attributes.type !== 'movement'
      );

      for (const section of planSections) {
        const passages = memory?.cache.query((q) =>
          q.findRecords('passage')
        ) as Passage[];

        const sectionPassages = passages.filter(
          (p) => related(p, 'section') === section.id
        );

        // Get notes
        const notes = sectionPassages.filter(
          (p) => p.attributes.passagetypeid === PassageTypeEnum.NOTE
        );

        for (const note of notes) {
          const published = note.attributes.published || false;
          const publishTo = getPublishTo(note.attributes.publishTo || '{}', true, false, true);
          const hasBeenPublished = isPublished(publishTo);
          const mediafileId = related(note, 'mediafile') as string;

          let recordingReady = false;
          if (mediafileId) {
            const mediaRec = memory?.cache.query((q) =>
              q.findRecord({ type: 'mediafile', id: mediafileId })
            ) as MediaFile;
            recordingReady = !!mediaRec && (mediaRec.attributes.s3file || '') !== '';
          }

          notesData.push({
            id: note.id,
            section: section.id,
            title: {
              value: note.attributes.title || '',
              ready: !!note.attributes.title,
            },
            content: {
              value: note.attributes.reference || '',
              ready: !!note.attributes.reference,
            },
            recording: {
              value: mediafileId || '',
              ready: recordingReady,
            },
            published: hasBeenPublished,
            readyToPublish:
              !!note.attributes.title &&
              !!note.attributes.reference &&
              recordingReady,
          });
        }
      }
    }

    return notesData;
  };

  return { readinessData, loading };
};
