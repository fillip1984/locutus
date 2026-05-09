CREATE TABLE `audioFile` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`remoteId` text NOT NULL UNIQUE,
	`index` integer NOT NULL,
	`duration` integer NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`progress` integer,
	`complete` integer DEFAULT false,
	`name` text NOT NULL,
	`path` text,
	`libraryItemId` text NOT NULL,
	CONSTRAINT `fk_audioFile_libraryItemId_libraryItem_id_fk` FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `chapter` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`remoteId` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`libraryItemId` text NOT NULL,
	CONSTRAINT `fk_chapter_libraryItemId_libraryItem_id_fk` FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `eBookFile` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`remoteId` text NOT NULL UNIQUE,
	`currentLocation` text,
	`progress` integer,
	`complete` integer DEFAULT false,
	`name` text NOT NULL,
	`path` text,
	`libraryItemId` text NOT NULL,
	CONSTRAINT `fk_eBookFile_libraryItemId_libraryItem_id_fk` FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON DELETE CASCADE
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
	`authorName` text NOT NULL,
	`authorNameLF` text,
	`numAudioFiles` integer NOT NULL,
	`ebookFileFormat` text,
	`duration` integer NOT NULL,
	`publishedYear` integer,
	`description` text,
	`isbn` text,
	`asin` text,
	`coverArtPath` text,
	`lastPlayedId` text,
	`lastEBookId` text,
	`downloaded` integer DEFAULT false,
	`complete` integer DEFAULT false,
	`libraryId` text NOT NULL,
	CONSTRAINT `fk_libraryItem_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE CASCADE
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
	`name` text NOT NULL,
	`sequence` integer NOT NULL,
	`libraryItemId` text NOT NULL,
	CONSTRAINT `fk_series_libraryItemId_libraryItem_id_fk` FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON DELETE CASCADE
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
CREATE UNIQUE INDEX `library_item_remote_id_library_id_idx` ON `libraryItem` (`remoteId`,`libraryId`);