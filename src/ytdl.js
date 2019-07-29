var child_process = require("child_process");
var fs = require("fs");

//new stuff below

exports.details = function(url) {
	return new Promise((resolve, reject) => {
		let proc = child_process.spawn("youtube-dl", ["-j", "--no-playlist", "--playlist-items", "1", url]);
		let data = "";
		proc.stdout.on("data", (d) => data += d.toString());
		proc.stdout.on("end", () => {
			try {
				resolve(JSON.parse(data));
			} catch {
				reject("Error getting video information.");
			}
		});
		proc.on("error", (e) => reject("Error getting video information."));
	});
}

exports.download = function(url, filename) {
	return new Promise((resolve, reject) => {
		let args = ["--no-playlist", "--playlist-items", "1", "--exec", "ffmpeg -i {} -ar 48000 -ac 1 -c:a pcm_s16le -f s16le -y " + filename + "; rm {}"];
		// Only download the audio if it's on YouTube
		if (url.match("^http(s)?://(www\.youtube\.com|youtu\.be|youtube\.com)") || url.startsWith("ytsearch:")) {
			args.push("-f");
			args.push("bestaudio");
		}
		args.push(url);
		console.debug("[INFO] Downloading " + url);
		let proc = child_process.spawn("youtube-dl", args);
		proc.on("exit", (code) => {
			if (code == 0) resolve();
			else {
				reject("Error downloading link.");
			}
		});
		proc.on("error", (e) => {
			reject("Error downloading link.");
			console.log(e)
		});
	});
}

// Returns promise that resolves when the first 3 songs have been added or all of the songs have been added.
exports.populateQueue = function(url) {
	return new Promise((resolve, reject) => {
		let playlist = [];
		let proc = child_process.spawn("youtube-dl", ["--flat-playlist", "-J", url]);
		let data = ""
//		proc.stdout.on("data", (data) => {
//			try {
//				let video = JSON.parse(data);
//				console.log("data: " + data);
//				playlist.push(video);
//			}
//			catch (e) {
//				console.warn("[WARN] Error parsing playlist: " + e);
//				reject("Error parsing playlist.");
//			}
//		});
		proc.stdout.on("data", (d) => data += d);
		proc.on("exit", (code) => {
			if (code != 0) {
				console.warn("[WARN] Error processing playlist (process failed)");
				reject("Error parsing playlist (process failed)")
			}
			// parse
			try {
				let res = JSON.parse(data);
				resolve(res.entries);
			}
			catch (e) {
				reject("Error parsing playlist");
				console.warn("[WARN] Error processing playlist: " + e);
			}
		});
	});
}