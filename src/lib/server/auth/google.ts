import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BASE_URL } from '$env/static/private';

export const google = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	BASE_URL + '/login/google/callback'
);

export type TGoogleClaim = {
	name: string;
	given_name: string;
	family_name: string;
	email: string;
	picture: string;
	iss: string;
	sub: number;
};
