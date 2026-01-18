# Streamity.tv v2 Xtream IPTV Player (by IPTVEditor.com)

![](https://github.com/lKinderBueno/Streamity-Xtream-IPTV-Web-player/raw/master/github-pic/top.png)

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://github.com/lKinderBueno/StreamityTV-Xtream)

### Official Streamity.tv website: [Click here](https://streamity.tv)

Streamity is an online web player.  
Play your Xtream API playlists and media libraries directly in your browser, with no additional software required.

### DISCLAIMER
Streamity is a playlist player. No media content is provided or included. Images are for demonstration purposes only.

### Features
- Playlist support (including Xtream API)
- Customizable name and logo
- Modern UI and smooth animations
- Guide & metadata view
- 12h/24h time format support
- Picture-in-Picture mode
- Automatic cleanup and normalization of titles
- Favorites
- Resume playback
- Auto-play next episode
- Built with React.js

### Other Pictures
![](https://github.com/lKinderBueno/Streamity-Xtream-IPTV-Web-player/raw/master/github-pic/channels.png?1)
![](https://github.com/lKinderBueno/Streamity-Xtream-IPTV-Web-player/raw/master/github-pic/vod.png)


### Installation
1. Download latest release (streamity-v2.X.zip): [Click here](https://github.com/lKinderBueno/Streamity-Xtream-IPTV-Web-player/releases)
2. Open with a text editor (for example notepad++) config.js and complete empty fields ( window.dns). More instructions are available inside the file.
3. Open with a text editor (for example notepad++) config.php and write your mysql database info (database url, database name, username, password) and epg xml url. (if you don't use epg you can skip part 2 and 3)
4. Import "sql_table.sql" in your mysql database (if you are using phpMyAdmin click on "import" -> select the sql_table.sql and click on execute)

5. [OPTIONAL] Open with a text editor (for example notepad++) config.css if you want to change main color and background one.
6. [OPTIONAL] Change favicon.ico and img > banner_w.png

7. Copy and paste all the files in your server. Use the root folder, like http://domain.com/ (don't use folders like http://domain.com/player/ !)

### Installation in sub-folder (ex: http://domain.com/player/ )
Copy the "static" folder in your root folder and all the other files in /player/




To avoid wasting server resources, epg update will be triggered when an user login and database has less than 12 hours of programmes.
