class ServerWideSettings {
    #settings: { [key: string]: string | boolean | number } = {}

    set = <T>(key: string, value: T) => {
        Object.assign(this.#settings, { [key]: value })
    }
    get = <T>(key: string) => {
        if (key in this.#settings)
            return this.#settings[key] as T
        else return null
    }

    list = () => JSON.parse(JSON.stringify(this.#settings))
}

const serverWideSettings = new ServerWideSettings()

export const getServerSideSettings = () => serverWideSettings