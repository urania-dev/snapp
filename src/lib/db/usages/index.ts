import { Schema } from 'redis-om';

export default new Schema(
	'usages',
	{
		id: { type: 'string', sortable: true },
		timestamp: { type: 'date', sortable: true },
		snapp_id: { type: 'string' },
		snapp_user_id: { type: 'string' },
		language: { type: 'string' },
		user_agent: { type: 'string' },
		device: { type: 'string' },
		country: { type: 'string' },
		city: { type: 'string' },
		region: { type: 'string' },
		cpu: { type: 'string' },
		os: { type: 'string' },
		browser: { type: 'string' }
	},
	{
		dataStructure: 'JSON'
	}
);
