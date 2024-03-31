CREATE TABLE `libraryItemAudioFile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ino` text NOT NULL,
	`index` integer NOT NULL,
	`duration` integer NOT NULL,
	`progress` integer,
	`complete` integer DEFAULT false,
	`name` text NOT NULL,
	`path` text,
	`libraryItemId` integer,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `libraryItem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`remoteId` text NOT NULL,
	`title` text NOT NULL,
	`authorName` text NOT NULL,
	`numAudioFiles` integer NOT NULL,
	`duration` integer NOT NULL,
	`publishedYear` integer,
	`description` text,
	`isbn` text,
	`asin` text,
	`coverArtPath` text,
	`lastPlayedId` integer,
	`downloaded` integer DEFAULT false,
	`complete` integer DEFAULT false,
	`libraryId` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `library` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`remoteId` text NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`serverUrl` text NOT NULL,
	`tokenId` text NOT NULL,
	`rate` integer DEFAULT 1 NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `library_remoteId_unique` ON `library` (`remoteId`);