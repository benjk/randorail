import { createTextRules } from '../components/texts/textRulesFactory';

export const textRules = createTextRules({
  // ================================
  // 🏠 SECTION : ACCUEIL (PAS DANS GLOBAL)
  // ================================
  HOME_TITLE: {
    label: 'Titre principal',
    key: 'home.firstSection.mainTitle',
    maxLength: 40,
    minLength: 2,
    lineBreakable: false,
    isUnic: true,
    linkTo: { route: '/', selector: '#home-title' },
  },
  HOME_SUBTITLE: {
    label: "Titre secondaire de la page d'accueil",
    key: 'home.firstSection.subTitle',
    maxLength: 40,
    minLength: 2,
    lineBreakable: false,
    isUnic: true,
    linkTo: { route: '/', selector: '#home-title' },
  },

  HOME_SIDE_INTRO_TEXT1: {
    label: "Texte d'intro 1",
    key: 'home.secondSection.text1',
    maxLength: 400,
    minLength: 0,
    lineBreakable: true,
    isUnic: true,
    linkTo: { route: '/', selector: '#intro-text1' },
  },

  // ================================
  // 🏠 SECTION : MENTIONS
  // ================================
  MENTIONS_TITLE: {
    label: 'Titre de la page Mentions Légales',
    key: 'pages.mentions.title',
    maxLength: 40,
    minLength: 2,
    lineBreakable: false,
    isUnic: true,
    linkTo: { route: '/mentions', selector: '' },
    rank: 1
  },

  // ================================
  // 📞 CONTACT
  // ================================
  CONTACT_NAME_LABEL: {
    label: 'Nom à afficher',
    key: 'contact.mainLabel',
    maxLength: 60,
    minLength: 3,
    lineBreakable: false,
    isUnic: false,
    extraInfo: 'Votre nom sera affiché à plusieurs endroits du site.',
  },
  CONTACT_EMAIL: {
    label: 'Adresse email',
    key: 'contact.email',
    maxLength: 100,
    minLength: 5,
    lineBreakable: false,
    textType: 'email',
    isUnic: false,
    extraInfo: 'Votre email sera affiché à plusieurs endroits du site.',
  },
  CONTACT_TELEPHONE: {
    label: 'Numéro de téléphone',
    key: 'contact.tel',
    maxLength: 10,
    minLength: 10,
    lineBreakable: false,
    textType: 'phone',
    isUnic: false,
    extraInfo: 'Votre téléphone sera affiché à plusieurs endroits du site.',
  },
  CONTACT_ADDRESS_STREET: {
    label: 'Votre adresse (numéro et rue)',
    key: 'contact.street',
    maxLength: 70,
    minLength: 0,
    lineBreakable: false,
    isUnic: false,
    extraInfo: 'Votre adresse peut être utilisé à plusieurs endroits du site.',
  },
  CONTACT_ADDRESS_POSTCODE: {
    label: 'Votre code postal',
    key: 'contact.postalCode',
    maxLength: 5,
    minLength: 0,
    textType: 'number',
    lineBreakable: false,
    isUnic: false,
    extraInfo: 'Votre adresse peut être utilisé à plusieurs endroits du site.',
  },
  CONTACT_ADDRESS_CITY: {
    label: 'Votre ville',
    key: 'contact.city',
    maxLength: 25,
    minLength: 0,
    lineBreakable: false,
    isUnic: false,
    extraInfo: 'Votre adresse peut être utilisé à plusieurs endroits du site.',
  },
  CONTACT_ADDRESS_COUNTRY: {
    label: 'Votre pays',
    key: 'contact.country',
    maxLength: 25,
    minLength: 0,
    lineBreakable: false,
    isUnic: false,
    extraInfo: 'Votre adresse peut être utilisé à plusieurs endroits du site.',
  },

  // ================================
  // 📞 RESEAUX SOCIAUX
  // ================================
  SOCIALS_FACEBOOK: {
    label: 'Votre profil Facebook',
    key: 'contact.socials.facebook',
    maxLength: 200,
    minLength: 0,
    lineBreakable: false,
    isUnic: false,
    textType: 'url',
    extraInfo:
      'Votre profil Facebook pourra être utilisé à plusieurs endroits du site',
  },
  SOCIALS_INSTA: {
    label: 'Votre profil Instagram',
    key: 'contact.socials.insta',
    maxLength: 200,
    minLength: 0,
    lineBreakable: false,
    isUnic: false,
    textType: 'url',
    extraInfo:
      'Votre profil Instagram pourra être utilisé à plusieurs endroits du site',
  },
  SOCIALS_GOOGLE: {
    label: 'Votre profil Google',
    key: 'contact.socials.google',
    maxLength: 200,
    minLength: 0,
    lineBreakable: false,
    isUnic: false,
    textType: 'url',
    extraInfo:
      'Votre profil Google pourra être utilisé à plusieurs endroits du site',
  },

  // ================================
  // 🔗 SECTION : METAS (SEO + OG)
  // ================================
  META_SEO_TITLE: {
    label: 'Titre navigateur principal',
    key: 'document.title',
    maxLength: 80,
    minLength: 5,
    lineBreakable: false,
    formatInfo: 'Mets ce que tu veux ici',
    extraInfo:
      "Titre du document par défaut affiché dans l'onglet du navigateur",
  },

  META_SEO_DESCRIPTION: {
    label: 'Description de la page (SEO)',
    key: 'document.description',
    maxLength: 200,
    minLength: 20,
    lineBreakable: true,
    maxLines: 3,
    extraInfo:
      'Description affichée dans les moteurs de recherche. Très utile pour le référencement.',
  },

  META_OG_TITLE: {
    label: 'Titre SEO / Réseaux sociaux',
    key: 'document.og.ogTitle',
    maxLength: 60,
    minLength: 10,
    lineBreakable: false,
    extraInfo:
      "Titre affiché lors du partage d'un lien sur les réseaux sociaux.",
  },

  META_OG_DESCRIPTION: {
    label: 'Description SEO / Réseaux sociaux',
    key: 'document.og.ogDescription',
    maxLength: 160,
    minLength: 30,
    lineBreakable: true,
    maxLines: 2,
    extraInfo:
      "Description affichée lors du partage d'un lien sur les réseaux sociaux.",
  },
});
