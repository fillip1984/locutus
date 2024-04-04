# locutus

My mad dash to creating an Audiobook player built with react native. This is an expo project written in Typescript, using drizzle for persistence, zustand for state, and NativeWind for UI. I am trying to build an audiobook player that uses AudioBookShelf as it's backend to fetch metadata and also the audiobooks themselves.

## UI

Using tabs currently, with the player being full screen. There is a modal to demonstrate how to pull up a sheet but it isn't used currently...

## Current state

I'm learning React Native but so far it's moving along nicely. Have audio files playing, it's glitchy and a work in progress but it demonstrates a number of things:

1) How to play audio files
2) How to track and manipulate state, rewind/fastforward, and change tracks
3) UI leaves some room for improvement which has been marked in the files with TODO: tags

## TODO

* [X] Switch over audio player: <https://medium.com/@gionata.brunel/implementing-react-native-track-player-with-expo-including-lock-screen-part-1-ios-9552fea5178c>
* [ ] Need to finish out pushing the mini-player to the bottom when switching between player and library
* [ ] Enhance drizzle to simplify data queries (right now app doesn't pull in relationships)
* [ ] They're marked in some files (mostly UI specific at this time, things I ran into that caused me trouble)
* [ ] Figure out security (face id)
* [X] Enhance UI for download experience
* [X] Need to figure out how to handle all the errors I keep getting when switching between files
* [X] Need to finish out flow from playlist to player
* [X] Need to figure out tabs
* [X] Need to figure out how to store files locally
* [X] Need to figure out how to import files from elsewhere
* [X] Figure out how to distribute without app store
* [X] Figure out how to get it to play in the background
* [X] Eventually figure out how to integrate into Apple now playing experiences
* [X] Eventually figure out how to integrate into Apple lock screen
* [X] Eventually figure out how to integrate with Apple Carplay
* [X] Eventually figure out how to integrate with Apple iwatch
