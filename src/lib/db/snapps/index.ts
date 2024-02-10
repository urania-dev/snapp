import { Schema } from 'redis-om';

export default new Schema(
	'snapps',
	{
		id: { type: 'string' },
		shortcode: { type: 'string' },
		original_url: { type: 'string' },
		created: { type: 'date', sortable: true },
		user_id: { type: 'string' },
		secret: { type: 'string' },
		has_secret: { type: 'boolean' },
		max_usages: { type: 'number', sortable: true },
		used: { type: 'number', sortable: true },
		notes: { type: 'text', sortable: true },
		hit: { type: 'number', sortable: true },
		expiration: { type: 'date', sortable: true },
		disabled: { type: 'boolean' }
	},
	{
		dataStructure: 'JSON'
	}
);
