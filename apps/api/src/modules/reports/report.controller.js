import * as service from './report.service.js'

export const monthly = async (req, res) => res.json(await service.monthlyReport(req.valid.query.start))

export const monthlyXlsx = async (req, res) => {
  const { start } = req.valid.query
  const workbook = await service.buildWorkbook(await service.monthlyReport(start))
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="reporte_${start}.xlsx"`)
  await workbook.xlsx.write(res)
  res.end()
}
