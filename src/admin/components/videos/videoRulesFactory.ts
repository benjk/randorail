import { BaseRule, LinkTo } from '../commons/BaseRule';

export type VideoFormat = 'landscape' | 'portrait' | 'square';
export type TargetVideoFormat = 'mp4' | 'webm';

interface VideoRuleBase {
  name: string;
}

export interface VideoRuleOptions extends BaseRule {
  maxWeight?: number; // en Mo
  videoFormat?: VideoFormat;
  supportedTypes?: string[];
  shouldConvert?: boolean;
  targetFormat?: TargetVideoFormat;
  folder?: string;
}

export type VideoRule = VideoRuleBase & VideoRuleOptions;

const defaultVideoRuleOptions: Required<Omit<VideoRuleOptions, 'linkTo'>> & {
  linkTo?: LinkTo;
} = {
  label: 'Vidéo par défaut',
  maxWeight: 250,
  videoFormat: 'landscape',
  supportedTypes: [
    'video/mp4',
    'video/webm',
    'video/quicktime', // mov
    'video/x-msvideo', // avi
    'video/x-matroska', // mkv
    'video/ogg', // ogv
  ],
  shouldConvert: true,
  targetFormat: 'webm', // plus léger et optimisé web
  folder: '/',
  isUnic: true,
  extraInfo: 'Vidéo utilisée sur le site',
  rank: 0,
  isDuplicable: false,
  minItems: 1,
  maxItems: 1,
};

type FinalVideoRule = Required<Omit<VideoRule, 'linkTo'>> & { linkTo?: LinkTo };

function createVideoRule(rule: VideoRule): FinalVideoRule {
  return {
    ...defaultVideoRuleOptions,
    ...rule,
  } as FinalVideoRule;
}

export function createVideoRules(
  rules: Record<string, VideoRule>,
): Record<string, FinalVideoRule> {
  const result = {} as Record<string, FinalVideoRule>;
  for (const key in rules) {
    result[key] = createVideoRule(rules[key]);
  }
  return result;
}
