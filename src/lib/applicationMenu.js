import {app, Menu} from 'electron';

/**
 * For configuring the electron window menu
 * @parameter {BrowserWindow} mainWindow
 *
 */
export function initApplicationMenu(mainWindow) {
    const template = [
      {
        label: 'View',
        submenu: [
          { label: 'Dev tools', role: 'toggleDevTools' }
        ]
      }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
