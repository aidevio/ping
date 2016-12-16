let {Tray, Menu, app, BrowserWindow, ipcMain} = require('electron');
let https = require('https');
let fs = require('fs');
let path = require('path');
let url = require('url');
let childProcess = require('child_process');
let tray;
let file;
let configWin;
let int;
let config = {};
try{
    config = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'config.json')));
}catch(e){}

app.on('ready', () => {
	tray = new Tray(path.join(__dirname, 'ping.png'));
	tray.setToolTip('Ping for show logs');
	let contextMenu = Menu.buildFromTemplate([
		{label: 'Settings', click: () => {
			!configWin && settings();
		}},
		{label: 'Logs', click: () => {
			childProcess.exec('explorer ' + path.join(app.getPath('temp'), 'aidevping.txt'));
		}},
		{label: 'Exit', click: () => {
			file && file.end();
			app.quit();
		}}
	]);
    tray.setContextMenu(contextMenu);

    if(!config.url){
    	settings();
    }
    else{
    	ping();
    }
});

ipcMain.on('getSettings', (event, arg) => {
	event.returnValue = config;
});
ipcMain.on('setConfig', (event, key, value) => {
	console.log(event, key, value)
	config[key] = value;
	event.returnValue = config;
	fs.writeFileSync(path.join(app.getPath('userData'), 'config.json'), JSON.stringify(config));
});

function settings(){
	if(configWin){
		return;
	}

	configWin = new BrowserWindow({
	    width: 210,
	    height: 300,
	    center: true
	});
	console.log(path.join(__dirname, 'config.html'))
	configWin.loadURL(url.format({
		pathname: path.join(__dirname, 'config.html'),
		protocol: 'file:',
		slashes: true
	}));
	configWin.setMenu(null);
	//configWin.webContents.openDevTools();
	configWin.on('closed', () => {
		configWin = null;
		if(config.url){
			ping();
		}
		else{
			app.quit();
		}
	});
}

function ping(){
	clearInterval(int);
	file && file.end();
	if(settings.interval < 300){
		settings.interval = 5000;
	}

	file = fs.createWriteStream(path.join(app.getPath('temp'), 'aidevping.txt'), {flags: 'a'});
	int = setInterval(() => {
		https.get(config.url, res => {
			if(res.statusCode != 200)
				file.write(new Date().toLocaleString('ru-RU') + ' - ' + res.statusCode + '\r\n');
			res.resume();
		}).on('error', e => {
			file.write(new Date().toLocaleString('ru-RU') + ' - ERROR: ' + e + '\r\n');
		});
	}, settings.interval || 5000);
}