import * as service from './trip.service.js'

export const search = async (req, res) => res.json(await service.search(req.valid.query))
export const mine = async (req, res) => res.json(await service.driverTrips(req.user.id))
export const list = async (req, res) => res.json(await service.listTrips())
export const create = async (req, res) => res.status(201).json(await service.createTrip(req.valid.body))
export const finish = async (req, res) => {
  await service.finishTrip(req.params.id, req.user.id)
  res.json({ ok: true })
}
