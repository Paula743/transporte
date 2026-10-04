import * as service from './route.service.js'

export const list = async (req, res) => res.json(await service.listRoutes())
export const cities = async (req, res) => res.json(await service.listCities())
export const create = async (req, res) => res.status(201).json(await service.createRoute(req.valid.body))
export const update = async (req, res) => res.json(await service.updateRoute(req.params.id, req.valid.body))
export const remove = async (req, res) => {
  await service.deleteRoute(req.params.id)
  res.status(204).end()
}
