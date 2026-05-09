# locutus

Locutus is an audiobook player/ebook reader built with react native. This is an expo project written in Typescript, using drizzle for persistence, zustand for state, and Uniwind for UI. I've built an audiobook player that uses AudioBookShelf as it's backend to fetch metadata and also the audiobooks themselves.

As I'm waiting on [react-native-track-player](https://rntp.dev) to be compatible with react native's new architecture, I've switched over to [react-native-nitro-player](https://github.com/riteshshukla04/react-native-nitro-player).

## UI

Previous version
![Sample project gif](demo.gif)

## Current state

I'm currently working to rebuild the same functionality that was previously shown. I'm making updates to drizzle using the beta version, removing axios, trying to adopt expo UI...

## TODO

- [ ] add marquee effects on text that could expand and flow to a 2nd line
  - [ ] mini-player
  - [ ] player screen track name
  - [ ] chapters on media screen?
- [ ] figure out how to show cover art in either square and book aspect ratios
- [ ] add Expo UI drop down menu on media page

### Mid term

- [ ] add m4b chapter functionality
- [ ] add series functionality
- [ ] add ebook reader
- [ ] record gif of updated app
- [ ] add a loading screen on login page if using biometrics to log in

### Long term

- [ ] Resolve remaining UI issues, they're marked in files with TODO tags
  - [ ] Create book card when cover is not available (example: The Private Life of Genghis Khan)
- [ ] Once Drizzle ORM v1 is released, revisit todos for it
- [ ] Once react-native-nitro-player becomes more stable, revisit todos for it
  - [ ] Once react-native-track-player v5 becomes more stable, revisit it to see if it fixes issues of react-native-nitro-player...
  - [?] Figure out how to get it to play in the background
    - [?] I have included expo-audio and set app.json expo-audio -> enableBackgroundPlayback to true, which shouldn't be necessary but seems to work
  - [ ] swap from previous/next track to skip back 10s or forward 30s from lock and now playing screens
  - [ ] see if useOnPlaybackProgressChange() hook gets fixed for longer audio files, right now it is only triggering every 5 seconds on longer audio files
- [ ] Once Expo NativeTabs are no longer beta, revisit todos for it
  - [ ] there isn't much documentation on bottom accessory (mini-player), so it isn't clear how to implement. Right now it somewhat works but when it shrinks and goes inline with tabs and search it doesn't look very nice
- [ ] Once Expo UI is no longer beta, revisit todos for it

### Completed todos

- [x] Implement security (face id)
- [x] create mini-player near bottom when switching between player and library
- [x] Finish flow from playlist to player (expo-router)
- [x] Figure tabs (expo-router native tabs are still in beta)
- [x] Figure out how to store files locally (expo-filesystem)
- [x] Figure out how to import files from elsewhere (AudioBookShelf Apis to the rescue)
- [x] Figure out how to distribute without app store (--local and internal/ad hoc distribution, apple developer subscription required)
- [x] Figure out how to integrate into Apple now playing experiences
  - [x] so it works on lock screen
  - [x] so it works with Now Playing on Apple Carplay
  - [x] so it works with Now playing on Apple watch
