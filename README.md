# locutus

Locutus is an audiobook player/ebook reader built with react native. This is an expo project written in Typescript, using drizzle for persistence, zustand for state, and Uniwind for UI. I've built an audiobook player that uses AudioBookShelf as it's backend to fetch metadata and also the audiobooks themselves.

As I'm waiting on [react-native-track-player](https://rntp.dev) to be compatible with react native's new architecture, I've switched over to [react-native-nitro-player](https://github.com/riteshshukla04/react-native-nitro-player).

## UI

Previous version
![Sample project gif](demo.gif)

## Current state

I'm currently working to rebuild the same functionality that was previously shown. I'm making updates to drizzle using the beta version, removing axios, trying to adopt expo UI...

## TODO

- [ ] Resolve remaining UI issues, they're marked in some files
  - [ ] Try to ping the server (and get local network permission access) just after entering server url
  - [ ] Create book card when cover is not available (example: The Private Life of Genghis Khan)
- [ ] Re-implement security (face id)
- [ ] Finish out pushing the mini-player to the bottom when switching between player and library
- [x] Finish flow from playlist to player (expo-router)
- [x] Figure tabs (expo-router native tabs are still in beta)
- [x] Figure out how to store files locally (expo-filesystem)
- [x] Figure out how to import files from elsewhere (AudioBookShelf Apis to the rescue)
- [x] Figure out how to distribute without app store (--local and internal/ad hoc distribution, apple developer subscription required)
- [ ] Figure out how to get it to play in the background
  - [?] - I think I have to also include expo-audio and set app.json expo-audio -> enableBackgroundPlayback to true???
- [x] Figure out how to integrate into Apple now playing experiences
- [x] Figure out how to integrate into Apple lock screen
- [x] Figure out how to integrate with Apple Carplay
- [x] Figure out how to integrate with Apple watch
