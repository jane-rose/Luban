import isElectron from 'is-electron';
import request from 'superagent';
import FileSaver from 'file-saver';
import path from 'path';

/**
 * Event Listener in electron
 */
const Event = {
    on: (eventName, callback) => {
        if (isElectron()) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.on(eventName, callback);
        }
    }
};

/**
 *  Update control in electron
 */
const Update = {
    checkForUpdate(shouldCheckForUpdate) {
        console.log('Update checkForUpdate', shouldCheckForUpdate);
        if (isElectron()) {
            const { ipcRenderer } = window.require('electron');
            if (shouldCheckForUpdate) {
                ipcRenderer.send('checkForUpdate');
            }
        }
    },
    downloadUpdate(downloadInfo) {
        if (isElectron()) {
            const { remote, ipcRenderer } = window.require('electron');
            const { dialog } = remote;
            console.log('downloadInfo', downloadInfo);
            const { releaseNotes, releaseName } = downloadInfo;

            const dialogOpts = {
                type: 'info',
                buttons: ['Later', 'Download now'],
                title: `A new version of Snapmaker Luban ${releaseName} has been released!`,
                message: releaseNotes.replace(/<p>/, '').replace(/<\/p>/, ''),
                detail: 'A new version has been detected. Should i download it now?'
            };

            dialog.showMessageBox(dialogOpts).then((returnValue) => {
                if (returnValue.response === 1) {
                    ipcRenderer.send('isDownloadNow');
                }
            });
        }
    },
    haveStartedDownload() {
        if (isElectron()) {
            const { remote } = window.require('electron');
            const { dialog } = remote;

            const dialogOpts = {
                type: 'info',
                buttons: ['OK'],
                detail: 'A latest version has been downloaded.'
            };
            dialog.showMessageBox(dialogOpts);
        }
    },
    isUpdateNow(downloadInfo) {
        if (isElectron()) {
            const { remote, ipcRenderer } = window.require('electron');
            const { dialog } = remote;
            const { releaseName } = downloadInfo;

            const dialogOpts = {
                type: 'info',
                buttons: ['No', 'Yes'],
                title: `Luban ${releaseName} has been downloaded.`,
                detail: 'Do you want to exit the program to install now?'
            };

            dialog.showMessageBox(dialogOpts).then((returnValue) => {
                if (returnValue.response === 1) {
                    ipcRenderer.send('isUpdateNow');
                }
            });
        }
    }
};

/**
 * Menu Control in electron
 */
const Menu = {
    setItemEnabled(id, enabled) {
        if (isElectron()) {
            const { remote } = window.require('electron');
            const appMenu = remote.Menu.getApplicationMenu();
            const item = appMenu.getMenuItemById(id);
            item.enabled = enabled;
        }
    },
    addRecentFile(file, isSave) {
        const menu = require('electron').remote.require('./Menu');
        menu.addRecentFile(file, isSave);
    }
};

/**
 * File control in electron
 */
const File = {
    save(targetFile, tmpFile) {
        if (isElectron()) {
            const fs = window.require('fs');
            const app = window.require('electron').remote.app;
            tmpFile = app.getPath('userData') + tmpFile;

            fs.copyFileSync(tmpFile, targetFile);
        }
    },
    openProjectFile() {
        if (isElectron()) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('openFile');
        }
    },
    async saveAs(targetFile, tmpFile) {
        if (isElectron()) {
            const fs = window.require('fs');
            const { app, dialog } = window.require('electron').remote;
            tmpFile = app.getPath('userData') + tmpFile;
            const saveDialogReturnValue = await dialog.showSaveDialog({
                title: targetFile,
                filters: [{ name: 'files', extensions: [targetFile.split('.')[1]] }]
            });
            targetFile = saveDialogReturnValue.filePath;
            if (!targetFile) throw new Error('select file canceled');

            const file = { path: targetFile, name: path.basename(targetFile) };

            fs.copyFileSync(tmpFile, targetFile);
            const menu = window.require('electron').remote.require('./electron-app/Menu');
            menu.addRecentFile(file);

            return file;
        } else {
            request
                .get(`/data${tmpFile}`)
                .responseType('blob')
                .end((err, res) => {
                    FileSaver.saveAs(res.body, targetFile, true);
                });
            return null;
        }
    }

};

/**
 * Dialogs control in electron
 */
const Dialog = {
    showMessageBox(options) {
        if (isElectron()) {
            const { dialog } = window.require('electron').remote;
            options.title = 'Snapmaker Luban';
            return dialog.showMessageBox(options);
        } else {
            return window.confirm(options.message);
        }
    }
};


/**
 * Window control in electron
 */
const Window = {
    // TODO window have to be refactor
    window: null,
    initTitle: '',

    call(func) {
        if (isElectron()) {
            window.require('electron').remote.getCurrentWindow()[func]();
        }
    },

    initWindow() {
        if (isElectron()) {
            this.window = window.require('electron').remote.getCurrentWindow();
            this.initTitle = this.window.getTitle();
        } else {
            this.window = {
                setTitle(title) {
                    document.title = title;
                }
            };
            this.initTitle = document.title;
        }
    },

    setOpenedFile(filename = 'new') {
        let title = this.initTitle;
        if (filename) {
            title = `${this.initTitle} / ${filename}`;
        }
        this.window.setTitle(title);
    }
};

export default {
    Update,
    Event,
    Menu,
    File,
    Dialog,
    Window
};
