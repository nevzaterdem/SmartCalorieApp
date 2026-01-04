const { app, BrowserWindow } = require('electron');

function createWindow() {
  // 1. Pencereyi oluştur
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
    title: "SmartCalorie AI", // Uygulama Başlığı
    autoHideMenuBar: true, // Üstteki dosya menüsünü gizle (Daha modern durur)
  });

  // 2. İçine senin React siteni yükle (Yöntem 1 Mantığı)
  // Normalde buraya "https://smartcalorie.com" yazarız.
  // Şimdilik yerel sunucuyu yazıyoruz.
  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});