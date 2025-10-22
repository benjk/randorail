export interface BlocPickerRule {
  title: string;
  jsonKey: string; //key pour retrouver dans le JSON
  allowedSourceBlocs: string[]; // types de blocs autorisés
  canBeDraft?: boolean; // Autoriser les items non publiés ?
  route: string;
  extraInfo?: string;
  isUnic?: boolean;
  rank?: number;
}

export const BLOC_PICKER_RULES: Record<string, BlocPickerRule> = {
  HOME_ANNOUNCEMENT: {
    title: "Annonce sur la page d'accueil",
    jsonKey: 'home.announcement',
    allowedSourceBlocs: ['ANNONCE_BLOC', 'SERVICES_BLOC'],
    canBeDraft: true,
    route: "/",
    extraInfo: "Annonce affichée en haut de la page d'accueil",
    isUnic: false,
    rank: 10,
  },
};

export function createBlocPickerRule(config: BlocPickerRule): BlocPickerRule {
  return config;
}
