type VideoQuality = 'SD' | 'HD' | 'UHD';

interface DeviceCapabilities {
  hardwareConcurrency: number; // Nombre de threads CPU
  deviceMemory?: number; // RAM en GB (Chrome/Edge uniquement)
  screenWidth: number; // Pour limiter UHD sur petits écrans
  preferMp4: boolean;
}
