import { type RequestEvent } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
export const authenticate_api = async (event: RequestEvent) => {
	try {
		const token = event.request.headers.get('authorization')?.split('Bearer ')[1];
		if (!token) return null;
		const decoded = jwt.verify(token, env.TOKEN_SECRET);
		return decoded as {
			key: string;
			userId: string;
			created: Date;
			user: { role: 'root' | 'admin' | 'user' };
			iat: number;
		};
	} catch (error) {
		return null;
	}
};
