var ytdl = require("./ytdl.js");
var Player = require("./Player.js");
var fs = require("fs");
var hhmmss = require("hh-mm-ss");

function SongQueue(config) {
	this.queue = [];
	this.lastID = 0;
	this.maxDuration = config.maxlength;
} 

// Exposing data structures of the player

SongQueue.prototype.isPlaying = function() {
	if (!this.player) return false;
	return this.player.isPlaying;
}

SongQueue.prototype.isPaused = function() {
	if (this.player) return false;
	return this.player.isPaused;
}

SongQueue.prototype.addSong = async function(url) {
	let details = await ytdl.details(url);
	if (details.duration > this.maxDuration) {
		throw "video too long";
	}
	let id = this.lastID++;
	await ytdl.download(url, ".tmp." + id + ".wav");
	let song = new Song(details.title, details.duration, id)
	this.queue.push(song);
	return song;
}

SongQueue.prototype.start = async function(connection) {
	if (!this.player) {
		this.player = new Player(connection);
	}
	if (!this.player.isPlaying) {
		for (let song = this.queue.shift(); song != undefined; song = this.queue.shift()) {
			this.nowPlaying = song;
			await this.player.playFile(".tmp." + song.id + ".wav");
		}
	}
}

SongQueue.prototype.getQueue = function() {
	res = "";
	for (let song of this.queue) {
		res += `[${hhmmss.fromS(song.duration)}] ${song.name}\n`;
	}
	return res;
}

SongQueue.prototype.getCurrentDuration = function() {
	if (this.isPlaying()) return hhmmss.fromS(this.nowPlaying.duration);
}

SongQueue.prototype.getQueueLength = function() {
	let duration = 0;
	for (let song of this.queue) {
		duration += song.duration;
	}
	return hhmmss.fromS(duration);
}

// Exposing functions of the player

SongQueue.prototype.skip = function() {
	if (this.player) {
		this.player.stop();
	}
}

SongQueue.prototype.pause = function() {
	if (this.player) {
		this.player.pause();
	}
}

SongQueue.prototype.resume = function() {
	if (this.player) {
		this.player.resume();
	}
}

SongQueue.prototype.setGain = function(gain) {
	if (this.player) {
		this.player.setGain(gain);
	}
}

SongQueue.prototype.getGain = function() {
	if (this.player) {
		return this.player.gain;
	}
}

SongQueue.prototype.getCurrentPos = function() {
	if (this.player) {
		return hhmmss.fromS(this.player.getCurrentPos());
	}
}

function Song(name, duration, id) {
	this.name = name;
	this.duration = duration;
	this.id = id;
}


module.exports = SongQueue;
