import { fmtDateTime, money } from './format'

export function downloadTicket(tk) {
  const t = tk.trip
  const w = window.open('', '_blank')
  w.document.write(`
    <html><head><title>Boleto ${tk.id}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px}
      .box{border:2px dashed #059669;border-radius:12px;padding:20px;max-width:420px}
      h1{color:#059669;margin:0 0 12px} p{margin:6px 0}
      .qr{width:110px;height:110px;border:1px solid #999;display:flex;align-items:center;justify-content:center;margin-top:12px;color:#999}
    </style></head><body>
      <div class="box">
        <h1>Boleto de autobús</h1>
        <p><b>Folio:</b> ${tk.id}</p>
        <p><b>Ruta:</b> ${t.route.origin} → ${t.route.destination}</p>
        <p><b>Salida:</b> ${fmtDateTime(t.departure)}</p>
        <p><b>Llegada:</b> ${fmtDateTime(t.arrival)}</p>
        <p><b>Asiento:</b> ${tk.seat} &nbsp; <b>Andén:</b> ${tk.platform}</p>
        <p><b>Unidad:</b> ${t.unit.plate}</p>
        <p><b>Precio:</b> ${money(t.route.price)}</p>
        <div class="qr">QR</div>
      </div>
      <script>window.onload = () => window.print()<\/script>
    </body></html>`)
  w.document.close()
}
