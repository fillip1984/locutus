ALTER TABLE libraryItemAudioFile ADD `createdAt` integer;--> statement-breakpoint
ALTER TABLE libraryItemAudioFile ADD `updatedAt` integer;--> statement-breakpoint
ALTER TABLE libraryItem ADD `createdAt` integer;--> statement-breakpoint
ALTER TABLE libraryItem ADD `updatedAt` integer;--> statement-breakpoint
ALTER TABLE library ADD `createdAt` integer;--> statement-breakpoint
ALTER TABLE library ADD `updatedAt` integer;--> statement-breakpoint
ALTER TABLE userSettings ADD `rate` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE userSettings ADD `createdAt` integer;--> statement-breakpoint
ALTER TABLE userSettings ADD `updatedAt` integer;