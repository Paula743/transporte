import * as service from './driver.service.js'

export const me = async (req, res) => res.json(await service.getDriver(req.user.id))
export const list = async (req, res) => res.json(await service.listDrivers())
export const create = async (req, res) => res.status(201).json(await service.createDriver(req.valid.body))
export const setActive = async (req, res) => res.json(await service.setActive(req.params.id, req.valid.body.active))
