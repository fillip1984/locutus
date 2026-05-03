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
CREATE TABLE `userSettings` (
	`id` text PRIMARY KEY,
	`createdAt` integer,
	`updatedAt` integer,
	`serverUrl` text NOT NULL,
	`signInWithBiometrics` integer DEFAULT false NOT NULL,
	`preferredPlaybackRate` integer DEFAULT 1 NOT NULL,
	`lastServerSync` integer
);
