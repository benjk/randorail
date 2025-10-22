import { IMG_PUBLIC_FOLDER } from '../../../config';
import { BaseRule, LinkTo } from '../commons/BaseRule';

export type ImageFormat = 'portrait' | 'landscape' | 'both';

interface ImageRuleBase {
  name: string;
}

export interface ImageRuleOptions extends BaseRule {
  maxWeight?: number;
  ratioTolerance?: number;
  idealRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  imgFormat?: ImageFormat;
  supportedTypes?: string[];
  shouldConvertWebp?: boolean;
  idealWidth?: number;
  idealHeight?: number;
  folder?: string;
  autoGenerateIcons?: boolean; // si true, génère automatiquement les icônes
}
export type ImageRule = ImageRuleBase & ImageRuleOptions;

// Valeurs par défaut pour les propriétés optionnelles
const defaultImageRuleOptions: Required<Omit<ImageRuleOptions, 'linkTo'>> & {
  linkTo?: LinkTo;
} = {
  label: 'Image éditable',
  maxWeight: 5, // calculé APRES la compression / optimisation
  ratioTolerance: 3, // très tolérant par défaut
  idealRatio: 1, //carré
  maxWidth: 8200, // les plus haute résolution du marché actuel
  maxHeight: 8500,
  minWidth: 100,
  minHeight: 50,
  imgFormat: 'both',
  supportedTypes: ['image/webp', 'image/png', 'image/jpeg'],
  shouldConvertWebp: true,
  idealWidth: 1800,
  idealHeight: 1400,
  folder: IMG_PUBLIC_FOLDER,
  autoGenerateIcons: false,
  isUnic: true,
  extraInfo: 'Cette image est utilisée à plusieurs endroits du site',
  rank: 0,
  isDuplicable: false,
  minItems: 1,
  maxItems: 1,
};

type FinalImageRule = Required<Omit<ImageRule, 'linkTo'>> & { linkTo?: LinkTo };

function createImageRule(rule: ImageRule): FinalImageRule {
  return {
    ...defaultImageRuleOptions,
    ...rule,
  } as FinalImageRule;
}

export function createImageRules(
  rules: Record<string, ImageRule>,
): Record<string, FinalImageRule> {
  const result = {} as Record<string, FinalImageRule>;
  for (const key in rules) {
    result[key] = createImageRule(rules[key]);
  }
  return result;
}
