## Note
This version (v2? v3? idk anymore) will probably never ship. I have plans to migrate to a serverless solution as seen by the rough notes below, where I intend to try it make it slightly less bad.

## Under Construction
### TODO
Monolith structure for now ("temporary")

### Mod Integration
- Use Cloudflare Tunnels to expose localhost server
- Use @sapphire/pieces to build an API
    - /event
- Modules
    - Activation
        - Events
        - Cron

## Planning
### Microservices
#### Backend - Not until interaction-kit is stable?
- [X] Use @sapphire/pieces to build API/Modules
- [ ] Two separate i18n files?????
- [ ] Access DAPI via REST
- API
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
