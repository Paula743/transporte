import * as service from './ticket.service.js'

export const buy = async (req, res) => res.status(201).json(await service.buy(req.user, req.valid.body))
export const mine = async (req, res) => res.json(await service.myTickets(req.user))
export const cancel = async (req, res) => {
  await service.cancel(req.user, req.params.id)
  res.json({ ok: true })
}
export const pdf = async (req, res) => {
  const { doc, filename } = await service.buildPdf(req.user, req.params.id)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  doc.pipe(res)
  doc.end()
}
