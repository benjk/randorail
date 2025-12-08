export function initVideoFunction(): void {
  const posterHD = document.querySelector('.video-poster img') as HTMLImageElement;

  if (!posterHD) {
    console.error('❌ Poster HD introuvable');
    return;
  }

  if (posterHD.complete && posterHD.naturalHeight > 0) {
    console.log('✅ Poster déjà chargé (cache)');
  } else {
    posterHD.addEventListener('load', () => {
      console.log('✅ Poster chargé');
    }, { once: true });
  }
}