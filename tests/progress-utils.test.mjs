import assert from "node:assert/strict";
import test from "node:test";

import {
  buildServerPayload,
  calculateLocalProgress,
  formatSecondsToTime,
  fractionToPercent,
  isAlreadyOnServer,
  mergeProgressUpdates,
  percentToFraction,
  selectServerUpdates,
} from "../src/services/progress-utils.ts";

const serverProgress = (overrides = {}) => ({
  id: "li_1",
  libraryItemId: "li_1",
  episodeId: null,
  duration: 1000,
  progress: 0.5,
  currentTime: 500,
  isFinished: false,
  ebookProgress: 0,
  lastUpdate: 10_000,
  ...overrides,
});

test("timestamps never show 60 seconds and never go negative", () => {
  assert.equal(formatSecondsToTime(59.6, "timestamp"), "01:00");
  assert.equal(formatSecondsToTime(3599.6, "timestamp"), "01:00:00");
  assert.equal(formatSecondsToTime(-5, "timestamp"), "00:00");
  assert.equal(formatSecondsToTime(Number.NaN, "timestamp"), "00:00");
  assert.equal(formatSecondsToTime(3700, "duration"), "1h 1m");
});

test("local progress is a clamped percentage and detects completion", () => {
  assert.deepEqual(calculateLocalProgress(250, 1000), {
    audiobookLocation: 250,
    audiobookProgress: 25,
    complete: false,
  });
  const finished = calculateLocalProgress(1200, 1000);
  assert.equal(finished.audiobookProgress, 100);
  assert.equal(finished.complete, true);
  // unknown duration must not produce NaN/Infinity
  assert.deepEqual(calculateLocalProgress(42, 0), {
    audiobookLocation: 42,
    complete: false,
  });
});

test("unit conversion between server fractions and local percentages", () => {
  assert.equal(fractionToPercent(0.42057298864465265), 42.057);
  assert.equal(percentToFraction(42.057), 0.42057);
  assert.equal(percentToFraction(250), 1);
});

test("server updates keep currentTime 0 and skip ebooks, episodes and stale items", () => {
  const updates = selectServerUpdates(
    [
      serverProgress({ currentTime: 0, progress: 0 }),
      serverProgress({ libraryItemId: "ebook", duration: 0, currentTime: 0 }),
      serverProgress({ libraryItemId: "both", ebookLocation: "epubcfi(/6)" }),
      serverProgress({ libraryItemId: "episode", episodeId: "ep_1" }),
      serverProgress({ libraryItemId: "old", lastUpdate: 500 }),
    ],
    0,
  );
  assert.deepEqual(
    updates.map((u) => `${u.libraryItemId}:${u.type}`),
    ["li_1:audioBook", "both:audioBook", "both:ebook"],
  );
});

test("merging keeps both audio and ebook updates and prefers the newest", () => {
  const base = { libraryItemId: "a", updatedAt: 1, source: "server" };
  const merged = mergeProgressUpdates([
    { ...base, type: "audioBook", currentTime: 1, progress: 0 },
    { ...base, type: "ebook", ebookLocation: "x", ebookProgress: 0 },
    {
      ...base,
      source: "client",
      updatedAt: 1,
      type: "audioBook",
      currentTime: 9,
      progress: 0,
    },
    {
      ...base,
      source: "client",
      updatedAt: 2,
      type: "audioBook",
      currentTime: 7,
      progress: 0,
    },
  ]);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((u) => u.type === "audioBook").currentTime, 7);
});

test("progress already on the server is not pushed back", () => {
  const server = [serverProgress({ currentTime: 500 })];
  const update = {
    libraryItemId: "li_1",
    type: "audioBook",
    currentTime: 500.4,
    progress: 0.5,
    isFinished: false,
  };
  assert.equal(isAlreadyOnServer(update, server), true);
  assert.equal(
    isAlreadyOnServer({ ...update, currentTime: 520 }, server),
    false,
  );
  assert.equal(
    isAlreadyOnServer({ ...update, isFinished: true }, server),
    false,
  );
  assert.equal(
    isAlreadyOnServer({ ...update, libraryItemId: "new" }, server),
    false,
  );
});

test("server payload has only documented fields and one entry per item", () => {
  const payload = buildServerPayload([
    {
      libraryItemId: "a",
      type: "audioBook",
      currentTime: 100,
      progress: 1.7,
      duration: 1000,
      isFinished: false,
      updatedAt: 5,
      source: "client",
    },
    {
      libraryItemId: "a",
      type: "ebook",
      ebookLocation: "cfi",
      ebookProgress: 0.25,
      isFinished: false,
      updatedAt: 5,
      source: "client",
    },
  ]);
  assert.deepEqual(payload, [
    {
      libraryItemId: "a",
      isFinished: false,
      duration: 1000,
      progress: 1,
      currentTime: 100,
      ebookLocation: "cfi",
      ebookProgress: 0.25,
    },
  ]);
});
