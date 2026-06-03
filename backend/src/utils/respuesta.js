const ok      = (res, data, codigo = 200)  => res.status(codigo).json({ ok: true,  data })
const creado  = (res, data)                => res.status(201).json({ ok: true,  data })
const error   = (res, mensaje, codigo = 500) => res.status(codigo).json({ ok: false, mensaje })

module.exports = { ok, creado, error }
