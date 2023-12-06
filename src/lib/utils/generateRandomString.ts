export function generateRandomString(length: number): string {
	const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from(
		{ length },
		() => characters[Math.floor(Math.random() * characters.length)]
	).join('');
}
