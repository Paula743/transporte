const sectionToCsv = (title, rows, cols) =>
  [title, cols.map((c) => c.label).join(','), ...rows.map((r) => cols.map((c) => `"${r[c.key]}"`).join(',')), ''].join('\n')

export function downloadReport(r) {
  const csv = [
    `Reporte mensual,${r.period.from} a ${r.period.to}`,
    `Servicios,${r.totals.services}`,
    `Incidencias,${r.totals.incidents}`,
    '',
    sectionToCsv('Rutas más comunes', r.routesCommon, [{ key: 'route', label: 'Ruta' }, { key: 'total', label: 'Viajes' }]),
    sectionToCsv('Rutas con más incidentes', r.routesIncidents, [{ key: 'route', label: 'Ruta' }, { key: 'total', label: 'Incidentes' }]),
    sectionToCsv('Unidades más usadas', r.unitsUsed, [{ key: 'unit', label: 'Unidad' }, { key: 'total', label: 'Viajes' }]),
    sectionToCsv('Clientes más frecuentes', r.clients, [{ key: 'client', label: 'Cliente' }, { key: 'total', label: 'Boletos' }]),
    sectionToCsv('Operadores con menos incidencias', r.drivers, [{ key: 'driver', label: 'Operador' }, { key: 'total', label: 'Incidencias' }]),
    sectionToCsv('Servicios por mes', r.months, [{ key: 'month', label: 'Mes' }, { key: 'total', label: 'Servicios' }]),
  ].join('\n')

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `reporte_${r.period.from}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
