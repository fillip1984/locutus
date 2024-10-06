# locutus

My mad dash to creating an Audiobook player built with react native. This is an expo project written in Typescript, using drizzle for persistence, zustand for state, and NativeWind for UI. I've built an audiobook player that uses AudioBookShelf as it's backend to fetch metadata and also the audiobooks themselves.

[React-native-track-player](https://rntp.dev) is used for audio playback. I started with expo-av but switched to react-native-track-player to gain lock screen, carplay, now playing, and apple watch integration.

## UI

![Sample project gif](demo.gif)

## Current state

Other than UI imperfections (marked with TODO: tags), playback works and progress is being tracked and resumed on audiobook files. Audiobooks play in the background and also appear (can be controlled) from lock screen, carplay, and applewatch.

## TODO

* [ ] Enhance drizzle to simplify data queries (right now app doesn't pull in relationships)
* [ ] REALLY learn how to use Zustand!
* [ ] Resolve remaining UI issues, they're marked in some files
  * [ ] Try to ping the server (and get local network permission access) just after entering server url
  * [ ] Create book card when cover is not available (example: The Private Life of Genghis Khan)
* [x] Figure out security (face id)
* [X] Switch over audio player: <https://medium.com/@gionata.brunel/implementing-react-native-track-player-with-expo-including-lock-screen-part-1-ios-9552fea5178c>
* [X] Enhance UI for download experience
* [X] Finish out pushing the mini-player to the bottom when switching between player and library
* [X] Finish out flow from playlist to player (expo-router)
* [X] Figure out tabs (expo-router)
* [X] Figure out how to store files locally (expo-filesystem)
* [X] Figure out how to import files from elsewhere (AudioBookShelf Apis to the rescue)
* [X] Figure out how to distribute without app store (--local and internal/ad hoc distribution, apple developer subscription required)
* [X] Figure out how to get it to play in the background (plist permission)
* [X] Figure out how to integrate into Apple now playing experiences (react-native-track-player solved this)
* [X] Figure out how to integrate into Apple lock screen (react-native-track-player solved this)
* [X] Figure out how to integrate with Apple Carplay (react-native-track-player solved this)
* [X] Figure out how to integrate with Apple watch (react-native-track-player solved this)
