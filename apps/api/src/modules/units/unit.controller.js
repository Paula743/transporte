import * as service from './unit.service.js'

export const list = async (req, res) => res.json(await service.listUnits())
export const get = async (req, res) => res.json(await service.getUnit(req.params.id))
export const create = async (req, res) => res.status(201).json(await service.createUnit(req.valid.body))
export const update = async (req, res) => res.json(await service.updateUnit(req.params.id, req.valid.body))
export const remove = async (req, res) => {
  await service.deleteUnit(req.params.id)
  res.status(204).end()
}
