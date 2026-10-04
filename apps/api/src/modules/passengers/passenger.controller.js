import * as service from './passenger.service.js'

export const me = async (req, res) => res.json(await service.getMe(req.user.id))
export const list = async (req, res) => res.json(await service.listPassengers())
