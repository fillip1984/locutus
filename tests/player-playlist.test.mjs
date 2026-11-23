import assert from "node:assert/strict";
import test from "node:test";

import {
  createPlaylistSetup,
  skipToPreviousChapter,
} from "../src/services/player-playlist.ts";

function item(id, sharedFile = false) {
  return {
    id,
    remoteId: id,
    title: id,
    authorName: "Author",
    coverArtPath: null,
    audiobookLocation: 150,
    audiobookDuration: 200,
    audioChapters: [
      {
        index: 1,
        title: "Second",
        start: 100,
        end: 200,
        duration: 100,
        mediaRemoteId: sharedFile ? "shared" : "second",
        mediaFormat: ".mp3",
      },
      {
        index: 0,
        title: "First",
        start: 0,
        end: 100,
        duration: 100,
        mediaRemoteId: sharedFile ? "shared" : "first",
        mediaFormat: ".mp3",
      },
    ],
  };
}

function createHarness() {
  const oldTrack = { extraPayload: { libraryItemId: "old-book" } };
  const playlists = new Map([["old", [oldTrack]]]);
  const calls = [];
  let currentId = "old";
  let currentTrack = oldTrack;
  let currentIndex = 0;
  let currentPosition = 25;
  let currentState = "playing";
  let nextId = 0;
  const queue = {
    async createPlaylist() {
      const id = `playlist-${++nextId}`;
      playlists.set(id, []);
      calls.push(["create", id]);
      return id;
    },
    async deletePlaylist(id) {
      assert.ok(playlists.delete(id), `Playlist ${id} must exist`);
      if (currentId === id) currentId = null;
      calls.push(["delete", id]);
    },
    async addTracksToPlaylist(id, tracks) {
      playlists.set(id, tracks);
    },
    async loadPlaylist(id, index) {
      currentId = id;
      currentIndex = index;
      currentTrack = playlists.get(id)[index];
      currentPosition = 0;
      calls.push(["load", id, index]);
    },
    getCurrentPlaylistId() {
      return currentId;
    },
  };
  const player = {
    async getState() {
      return {
        currentTrack,
        currentPlaylistId: currentId,
        currentIndex,
        currentPosition,
        currentState,
      };
    },
    async seek(position) {
      currentPosition = position;
      calls.push(["seek", position]);
    },
    async play() {
      currentState = "playing";
      calls.push(["play", currentId]);
    },
    async pause() {
      currentState = "paused";
      calls.push(["pause", currentId]);
    },
  };
  return { queue, player, playlists, calls };
}

test("single-file progress uses the absolute position without an offset", async () => {
  const { queue, player, playlists, calls } = createHarness();
  const setup = createPlaylistSetup(queue, player, (path) => path);
  assert.equal(
    await setup(item("book", true), "150", "play", () => false),
    true,
  );

  const [track] = playlists.get("playlist-1");
  assert.equal(track.extraPayload.start, 0);
  assert.deepEqual(
    track.extraPayload.chapters.map((chapter) => chapter.index),
    [0, 1],
  );
  assert.ok(calls.some((call) => call[0] === "seek" && call[1] === 150));
  assert.ok(!playlists.has("old"));
});

test("multi-file playback orders chapters and seeks within the selected file", async () => {
  const { queue, player, playlists, calls } = createHarness();
  const setup = createPlaylistSetup(queue, player, (path) => path);
  await setup(item("book"), "150", "play", () => false);

  assert.deepEqual(
    playlists.get("playlist-1").map((track) => track.title),
    ["First", "Second"],
  );
  assert.ok(calls.some((call) => call[0] === "load" && call[2] === 1));
  assert.ok(calls.some((call) => call[0] === "seek" && call[1] === 50));
});

test("a finished single-file book restarts from the beginning", async () => {
  const { queue, player, calls } = createHarness();
  const setup = createPlaylistSetup(queue, player, (path) => path);
  await setup(item("book", true), "200", "play", () => false);
  assert.ok(calls.some((call) => call[0] === "seek" && call[1] === 0));
  assert.ok(!calls.some((call) => call[0] === "seek" && call[1] === 200));
});

test("previous chapter selects exactly one previous index", async () => {
  const indices = [];
  let currentIndex = 3;
  const player = {
    async getState() {
      return { currentIndex };
    },
    async skipToIndex(index) {
      indices.push(index);
      return true;
    },
  };
  await skipToPreviousChapter(player);
  currentIndex = 0;
  await skipToPreviousChapter(player);
  assert.deepEqual(indices, [2, 0]);
  currentIndex = -1;
  await assert.rejects(skipToPreviousChapter(player), /No current track/);
});

test("resume reuses a matching track and loads saved progress for a different book", async () => {
  const { queue, player, calls } = createHarness();
  const setup = createPlaylistSetup(queue, player, (path) => path);
  await setup(item("first"), "100", "play", () => false);
  const callCount = calls.length;
  await setup(item("first"), "150", "resume", () => false);
  assert.equal(calls.length, callCount);

  await setup(item("second"), undefined, "resume", () => false);
  assert.ok(calls.some((call) => call[0] === "seek" && call[1] === 50));
  assert.ok(
    calls.some((call) => call[0] === "delete" && call[1] === "playlist-1"),
  );
});

test("a cancelled setup cannot overtake the next screen's playlist", async () => {
  const { queue, player, playlists, calls } = createHarness();
  const loadPlaylist = queue.loadPlaylist;
  let releaseLoad;
  let signalLoad;
  const loadStarted = new Promise((resolve) => {
    signalLoad = resolve;
  });
  queue.loadPlaylist = async (id, index) => {
    if (id === "playlist-1") {
      signalLoad();
      await new Promise((resolve) => {
        releaseLoad = resolve;
      });
    }
    await loadPlaylist(id, index);
  };

  const setup = createPlaylistSetup(queue, player, (path) => path);
  let cancelled = false;
  const first = setup(item("first"), "0", "play", () => cancelled);
  await loadStarted;
  cancelled = true;
  const second = setup(item("second"), "0", "play", () => false);
  assert.equal(calls.filter((call) => call[0] === "create").length, 1);
  releaseLoad();

  assert.equal(await first, false);
  assert.equal(await second, true);
  assert.deepEqual(
    calls.filter((call) => call[0] === "play"),
    [
      ["play", "old"],
      ["play", "playlist-2"],
    ],
  );
  assert.ok(calls.some((call) => call[0] === "seek" && call[1] === 25));
  assert.equal(queue.getCurrentPlaylistId(), "playlist-2");
  assert.ok(!playlists.has("playlist-1"));
});

test("failed setup removes its playlist and does not block the next request", async () => {
  const { queue, player, playlists } = createHarness();
  const addTracks = queue.addTracksToPlaylist;
  queue.addTracksToPlaylist = async (id, tracks) => {
    if (id === "playlist-1") throw new Error("add failed");
    await addTracks(id, tracks);
  };
  const setup = createPlaylistSetup(queue, player, (path) => path);

  await assert.rejects(
    setup(item("first"), "0", "play", () => false),
    /add failed/,
  );
  assert.ok(!playlists.has("playlist-1"));
  assert.equal(await setup(item("second"), "0", "play", () => false), true);
});

test("a failed seek restores the previous playing track", async () => {
  const { queue, player, playlists } = createHarness();
  const seek = player.seek;
  let firstSeek = true;
  player.seek = async (position) => {
    if (firstSeek) {
      firstSeek = false;
      throw new Error("seek failed");
    }
    await seek(position);
  };
  const setup = createPlaylistSetup(queue, player, (path) => path);

  await assert.rejects(
    setup(item("book"), "150", "play", () => false),
    /seek failed/,
  );
  assert.equal(queue.getCurrentPlaylistId(), "old");
  assert.ok(!playlists.has("playlist-1"));
  const state = await player.getState();
  assert.equal(state.currentPosition, 25);
  assert.equal(state.currentState, "playing");
});

test("cancelling an initial load pauses and removes the unfinished playlist", async () => {
  const { queue, player, playlists } = createHarness();
  await queue.deletePlaylist("old");
  const loadPlaylist = queue.loadPlaylist;
  let cancelled = false;
  queue.loadPlaylist = async (id, index) => {
    await loadPlaylist(id, index);
    cancelled = true;
  };
  const setup = createPlaylistSetup(queue, player, (path) => path);

  assert.equal(await setup(item("book"), "0", "play", () => cancelled), false);
  assert.equal(queue.getCurrentPlaylistId(), null);
  assert.equal((await player.getState()).currentState, "paused");
  assert.ok(!playlists.has("playlist-1"));
});
