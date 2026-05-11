CREATE TABLE `audioChapter` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`index` integer NOT NULL,
	`title` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`mediaRemoteId` text NOT NULL,
	`mediaFormat` text NOT NULL,
	`duration` integer NOT NULL,
	`libraryItemId` text NOT NULL,
	CONSTRAINT `fk_audioChapter_libraryItemId_libraryItem_id_fk` FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `ebook` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`remoteId` text NOT NULL UNIQUE,
	`ebookFormat` text NOT NULL,
	`libraryItemId` text NOT NULL,
	CONSTRAINT `fk_ebook_libraryItemId_libraryItem_id_fk` FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `genre` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`remoteId` text NOT NULL UNIQUE,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `libraryItemGenre` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`libraryItemId` text NOT NULL,
	`genreId` text NOT NULL,
	CONSTRAINT `fk_libraryItemGenre_libraryItemId_libraryItem_id_fk` FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_libraryItemGenre_genreId_genre_id_fk` FOREIGN KEY (`genreId`) REFERENCES `genre`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `libraryItem` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`remoteId` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`authorName` text NOT NULL,
	`authorNameLF` text,
	`publishedYear` integer,
	`description` text,
	`isbn` text,
	`asin` text,
	`coverArtPath` text,
	`audiobookLocation` integer,
	`audiobookDuration` integer,
	`audiobookProgress` integer,
	`ebookLocation` text,
	`ebookProgress` integer,
	`isAudiobook` integer DEFAULT false NOT NULL,
	`isEbook` integer DEFAULT false NOT NULL,
	`downloaded` integer DEFAULT false NOT NULL,
	`complete` integer DEFAULT false NOT NULL,
	`libraryId` text NOT NULL,
	CONSTRAINT `fk_libraryItem_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `libraryItemSeries` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`libraryItemId` text NOT NULL,
	`seriesId` text NOT NULL,
	`sequence` integer,
	CONSTRAINT `fk_libraryItemSeries_libraryItemId_libraryItem_id_fk` FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_libraryItemSeries_seriesId_series_id_fk` FOREIGN KEY (`seriesId`) REFERENCES `series`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `library` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`remoteId` text NOT NULL UNIQUE,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`remoteId` text NOT NULL UNIQUE,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`serverUrl` text NOT NULL,
	`signInWithBiometrics` integer DEFAULT false NOT NULL,
	`preferredPlaybackRate` integer DEFAULT 1 NOT NULL,
	`lastServerSync` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `audio_chapter_index_library_item_id_idx` ON `audioChapter` (`index`,`libraryItemId`);--> statement-breakpoint
CREATE UNIQUE INDEX `library_item_remote_id_library_id_idx` ON `libraryItem` (`remoteId`,`libraryId`);