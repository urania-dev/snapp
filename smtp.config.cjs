module.exports = async (database) => ({
    host: await database.settings.get("SMTP_HOST").then((res) => res?.value),
    port: await database.settings.get("SMTP_PORT").then((res) => res?.value),
    secure: await database.settings.get("SMTP_SSL").then((res) => res?.value?.toString() === 'true'),
    auth: {
        user: await database.settings.get("SMTP_USER").then((res) => res?.value),
        pass: await database.settings.get("SMTP_PASS").then((res) => res?.value)
    }
})