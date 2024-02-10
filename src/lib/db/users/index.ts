import { Schema } from 'redis-om';

export default new Schema(
	'users',
	{
		id: { type: 'string' },
		username: { type: 'string' },
		email: { type: 'string' },
		password: { type: 'string' },
		roles: { type: 'string[]' },
		updated: { type: 'date', sortable: true },
		created: { type: 'date', sortable: true },
		theme: { type: 'string', path: '$.settings.theme' },
		lang: { type: 'string', path: '$.settings.lang' },
		urls: { type: 'number', path: '$.settings.max.urls' },
		rpm: { type: 'number', path: '$.settings.max.rpm' },
		rpd: { type: 'number', path: '$.settings.max.rpd' }
	},
	{
		dataStructure: 'JSON'
	}
);
