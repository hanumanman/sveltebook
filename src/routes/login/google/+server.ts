// routes/login/google/+server.ts
import { generateState, generateCodeVerifier } from 'arctic';

import type { RequestEvent } from '@sveltejs/kit';
import { google } from '$lib/server/auth/google';

export async function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile']);

	event.cookies.set('google_oauth_state', state, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});
	event.cookies.set('google_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	const urlstring = url.toString();
	console.log('TODO: Delete 🚀 ~ GET ~ urlstring:', urlstring);
	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
