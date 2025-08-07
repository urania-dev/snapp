module.exports = async (settings) => {
	return {
		auth: {
			pass: settings?.get('SMTP_PASS') || 'smtp-password',
			user: settings?.get('SMTP_USER') || 'smtp-user'
		},
		host: settings?.get('SMTP_HOST') || 'smtp-host',
		port: settings?.get('SMTP_PORT') || 'smtp-port',
		secure: settings?.get('SMTP_SSL') === true || false
	};
};
