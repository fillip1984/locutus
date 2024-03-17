CREATE TABLE `media` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`video` integer DEFAULT false NOT NULL
);
