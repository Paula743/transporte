import * as service from './incident.service.js'

export const create = async (req, res) => res.status(201).json(await service.createIncident(req.user, req.valid.body))
export const list = async (req, res) => res.json(await service.listIncidents())
