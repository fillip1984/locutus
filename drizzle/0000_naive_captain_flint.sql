CREATE TABLE `libraryItemAudioFile` (
	`id` text PRIMARY KEY NOT NULL,
	`ino` text NOT NULL,
	`index` integer NOT NULL,
	`duration` integer NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`progress` integer,
	`complete` integer DEFAULT false,
	`name` text NOT NULL,
	`path` text,
	`libraryItemId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `libraryItemEBookFile` (
	`id` text PRIMARY KEY NOT NULL,
	`ino` text NOT NULL,
	`currentLocation` text,
	`progress` integer,
	`complete` integer DEFAULT false,
	`name` text NOT NULL,
	`path` text,
	`libraryItemId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `libraryItem` (
	`id` text PRIMARY KEY NOT NULL,
	`remoteId` text NOT NULL,
	`title` text NOT NULL,
	`authorName` text NOT NULL,
	`authorNameLF` text,
	`numAudioFiles` integer NOT NULL,
	`eBookFile` text,
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
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `library` (
	`id` text PRIMARY KEY NOT NULL,
	`remoteId` text NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`serverUrl` text NOT NULL,
	`signInWithBiometrics` integer DEFAULT false NOT NULL,
	`preferredPlaybackRate` integer DEFAULT 1 NOT NULL,
	`lastServerSync` integer,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `library_remoteId_unique` ON `library` (`remoteId`);