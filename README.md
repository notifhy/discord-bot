## Under Construction
### Mod Integration
- Use Cloudflare Tunnels to expose localhost server
- Use @sapphire/pieces to build an API
    - /login
    - /logout
- Modules
    - Activation
        - Mod
        - Cron
        - Cron with Hypixel API data
    - Continuity
        - How can this be designed that users that /module [active] will be put into the next cron cycle?
        - How can this be designed that users that /module [deactivate] will be taken out of the next cron cycle?
        - When a cron function is called, users could be fetched then to determine whose modules should be called

## Planning
### [ ] Core Separation
#### Backend
- [X] Use @sapphire/pieces to build API/Modules
- [ ] Two separate i18n files?????
- [ ] Access DAPI via REST
- API
    - /api, stats, errors, logic
    - /config core, general config
    - /data, all data, history
    - /module, module config
    - /performance, more stats (remove?)
    - /register, POST user
    - /reload, reload endpoint?
    - /systemmessage, POST systemmessage
    - RegistrationPrecondition, user exists

#### Bot
- [ ] Cloudflare Worker?
    - 10ms on each Cloudflare worker execution is a bit small
    - Microservice arch?
- [ ] Include Prisma ORM with bot?
    - Reduced endpoints or increased chaos but faster connections
