import { eq } from 'drizzle-orm';
import { db } from '..';
import { progressTable, usersTable } from '../schema';
import { getProgress } from './select';

export async function createUser(googleId: number, username: string, imageUrl?: string) {
	const [createdUser] = await db
		.insert(usersTable)
		.values({
			google_id: googleId,
			user_name: username,
			image: imageUrl
		})
		.returning();

	return createdUser;
}

export async function saveProgress(
	userId: number,
	novelId: number,
	chapterNumber: number,
	lastChapterName: string
) {
	// Check if progress already exists
	// If it does, update the progressTable
	const progress = await getProgress(novelId, userId);

	if (progress) {
		await db
			.update(progressTable)
			.set({ last_chapter_number: chapterNumber, last_chapter_name: lastChapterName })
			.where(eq(progressTable.id, progress.id));
		return;
	}

	// If it doesn't, insert a new row
	const insertValue = {
		last_chapter_number: chapterNumber,
		last_chapter_name: lastChapterName,
		novel_id: novelId,
		user_id: userId
	};
	await db.insert(progressTable).values(insertValue);
}
