CREATE TABLE `libraryItem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`authorName` text NOT NULL,
	`numAudioFiles` integer NOT NULL,
	`duration` integer NOT NULL,
	`libraryId` integer NOT NULL,
	FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `library` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
