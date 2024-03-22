CREATE TABLE `library` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `libraryItem` (
	`id` text PRIMARY KEY NOT NULL,
	`ino` text NOT NULL,
	`title` text NOT NULL,
	`authorName` text NOT NULL,
	`numAudioFiles` integer NOT NULL,
	`duration` integer NOT NULL,
	`libraryId` text,
	FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `libraryItemAudioFile` (
	`id` text PRIMARY KEY NOT NULL,
	`index` integer NOT NULL,
	`duration` integer NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`libraryItemId` text,
	FOREIGN KEY (`libraryItemId`) REFERENCES `libraryItem`(`id`) ON UPDATE no action ON DELETE no action
);
