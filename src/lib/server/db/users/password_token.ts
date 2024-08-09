import { prisma } from '$lib/server/prisma';
import { TimeSpan, createDate } from 'oslo';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { generateIdFromEntropySize } from 'lucia';

async function createPasswordResetToken(userId: string): Promise<string> {
	await prisma.password_reset.deleteMany({ where: { userId } });

	const tokenId = generateIdFromEntropySize(25); // 40 character
	const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));
	const expiresAt = createDate(new TimeSpan(2, 'h'))
	await prisma.password_reset.create({
		data: {
			token_hash: tokenHash,
			userId: userId,
			expiresAt
		}
	});

	return tokenId;
}

export { createPasswordResetToken };
