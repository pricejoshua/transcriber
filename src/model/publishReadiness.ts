// Publication readiness tracking interfaces

export interface IBibleMetadataReadiness {
  bibleId: { value: string; ready: boolean };
  bibleName: { value: string; ready: boolean };
  languageName: { value: string; ready: boolean };
  languageIso: { value: string; ready: boolean };
  languageRecording: { value: string; ready: boolean };
  bibleNameRecording: { value: string; ready: boolean };
  copyright: { value: string; ready: boolean };
}

export interface IProjectMetadataReadiness {
  name: { value: string; ready: boolean };
  graphic: { value: string; ready: boolean };
  altName: { value: string; ready: boolean };
}

export interface ISectionReadiness {
  id: string;
  sequence: number;
  name: { value: string; ready: boolean };
  title: { value: string; ready: boolean };
  titleRecording: { value: string; ready: boolean };
  published: boolean;
  readyToPublish: boolean;
}

export interface IChapterReadiness {
  id: string;
  section: string;
  number: number;
  recorded: boolean;
  published: boolean;
  readyToPublish: boolean;
}

export interface IPassageReadiness {
  id: string;
  section: string;
  reference: string;
  passage: string;
  recorded: boolean;
  published: boolean;
  readyToPublish: boolean;
}

export interface INoteReadiness {
  id: string;
  section: string;
  title: { value: string; ready: boolean };
  content: { value: string; ready: boolean };
  recording: { value: string; ready: boolean };
  published: boolean;
  readyToPublish: boolean;
}

export interface IMovementReadiness {
  id: string;
  sequence: number;
  name: { value: string; ready: boolean };
  published: boolean;
  readyToPublish: boolean;
}

export interface IPublishReadinessData {
  bibleMetadata: IBibleMetadataReadiness;
  projectMetadata: IProjectMetadataReadiness;
  movements: IMovementReadiness[];
  sections: ISectionReadiness[];
  chapters: IChapterReadiness[];
  passages: IPassageReadiness[];
  notes: INoteReadiness[];
}

export enum ReadinessFilterEnum {
  All,
  MissingOnly,
  ReadyToPublish,
}
