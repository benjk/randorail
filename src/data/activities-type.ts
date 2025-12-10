export interface ActivityData {
  label: string;
  value: string;
}

export interface ActivityContent {
  docTitle: string;
  title: string;
  image1: string;
  mainText: string[];
  tarifs: ActivityData[];
  horaires: ActivityData[];
  image2?: string;
  secondaryText?: string[];
}

export interface ActivityMeta {
  bgImage: string;
  icon: string;
  description?: string;
  url?: string;
}

export interface ActivityFull extends ActivityContent, ActivityMeta {
  slug: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  tags: string[];
}
