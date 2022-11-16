## Under Construction

## Planning
### Seperate modules/core from gateway
- Cloudflare worker or dedicated VPS (Railway)?
    - 10ms on each Cloudflare worker execution is a bit small
    - Microservice arch?
- [] Include prisma ORM with gateway?
    - Reduced endpoints or increased chaos but faster connections
    - Leverage multi-connection?
- Express server API
    - How should these be organized?
    - /api, stats, errors, logic
    - /config core, general config
    - /data, all data, history
    - /module, module config
    - /performance, more stats (remove?)
    - /register, POST user
    - /reload, reload endpoint?
    - /systemmessage, POST systemmessage
    - RegistrationPrecondition, user exists
- Core/modules design
    - Activation
        - Mod
        - Cron (30 minutes ish)
        - Cron with Hypixel API data
    - Roundabout
        - How can this be designed that users that /module [active] will be put into the next cron cycle?
        - How can this be designed that users that /module [deactivate] will be taken out of the next cron cycle?
        - When a cron function is called, users could be fetched then to determine whose modules should be called
- Locales
- [x] Use @sapphire/pieces?

## Notes
- Access DAPI via REST
