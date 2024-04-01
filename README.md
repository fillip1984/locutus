# locutus

Audiobook player built with react native. This is a t3 turbo repo with a NextJS backend and web interface but that's not really being used at this time

Using expo AV for playback... a little archaic but it's getting the job done for now.

## UI

Top shows list of tracks via cards, not spent much time here, when pressed the middle audio player and smaller audio player start and track progress.

Larger audio player is a reproduction of the tailwind [dark mode example](https://tailwindcss.com/#dark-mode)

The smaller audio player is a reproduction of what you see in Spotify when minimizing the player

## Current state

I'm learning React Native but so far it's moving along nicely. Have audio files playing, it's glitchy and a work in progress but it demonstrates a number of things:

1) How to play audio files
2) How to track and manipulate state, rewind/fastforward, and change tracks
3) UI leaves some room for improvement which has been marked in the files with TODO: tags

## TODO

* Switch over audio player: https://medium.com/@gionata.brunel/implementing-react-native-track-player-with-expo-including-lock-screen-part-1-ios-9552fea5178c
* They're marked in some files (mostly UI specific at this time, things I ran into that caused me trouble)
* Need to figure out how to handle all the errors I keep getting when switching between files
* Need to finish out flow from playlist to player
* Need to finish out pushing the mini-player to the bottom when switching between player and library
* Need to figure out tabs
* Need to figure out how to store files locally
* Need to figure out how to import files from elsewhere
* Figure out security
* Figure out how to distribute without app store
* Figure out how to get it to play in the background
* Eventually figure out how to integrate into Apple now playing experiences
* Eventually figure out how to integrate into Apple lock screen
* Eventually figure out how to integrate with Apple Carplay
