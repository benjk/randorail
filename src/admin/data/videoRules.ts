import { createVideoRules } from '../components/videos/videoRulesFactory';

export const videoRules = createVideoRules({
  HOME_VIDEO: {
    name: 'video_home.webm',
    label: 'Vidéo en fond sur la page d\'accueil',
    videoFormat: 'landscape',
    folder: '/vid/home/',
    linkTo: { route: '/', selector: '' },
    extraInfo: "Vidéo affichée en fond sur la page d'accueil"
  },
});
