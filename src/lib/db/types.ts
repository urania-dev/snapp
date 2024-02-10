type DBSnapp = {
	id: string;
	original_url: string;
	shortcode: string;
	created: Date;
	secret?: string;
	has_secret: boolean;
	user_id: string;
	used: number;
	max_usages: number;
	expiration: Date;
	disabled: boolean;
	hit: number;
	notes?: string;
};

interface DBSnappEnriched extends DBSnapp {
	status: 'active' | 'disabled' | 'expired' | 'blacklisted';
	ttl: number;
	used: number;
}

type DBUser = {
	id: string;
	username: string;
	password: string;
	roles: string[];
	updated: Date;
	created: Date;
	settings: {
		theme: string;
		lang: string;
		max: {
			rpd: number;
			rpm: number;
			urls: number;
		};
	};
	hash?: string;
	email?: string;
};

type DBAPIKey = {
	id: string;
	user_id: string;
	roles: string[];
	created: Date;
	used?: Date;
};

type DBUsages = {
	id: string;
	timestamp: string;
	snapp_id: string;
	language: string;
	user_agent: string;
	device: string;
	country: string;
	city: string;
	region: string;
	cpu: string;
	os: string;
	browser: string;
};
