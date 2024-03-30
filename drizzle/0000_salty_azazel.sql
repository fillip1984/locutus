CREATE TABLE `libraryItemAudioFile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ino` text NOT NULL,
	`index` integer NOT NULL,
	`duration` integer NOT NULL,
	`progress` integer,
	`name` text NOT NULL,
	`path` text,
	`libraryItemId` integer,
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
	`libraryId` integer NOT NULL,
	FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `library` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`remoteId` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`serverUrl` text NOT NULL,
	`tokenId` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `library_remoteId_unique` ON `library` (`remoteId`);