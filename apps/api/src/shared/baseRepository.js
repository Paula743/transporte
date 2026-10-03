import { db } from '../config/firebase.js'

const fromDoc = (d) => (d.exists ? { id: d.id, ...d.data() } : null)

export function createRepository(collectionName) {
  const col = db.collection(collectionName)

  const repo = {
    col,
    async findAll() {
      const snap = await col.get()
      return snap.docs.map(fromDoc)
    },
    async findById(id) {
      return fromDoc(await col.doc(id).get())
    },
    async findWhere(field, op, value) {
      const snap = await col.where(field, op, value).get()
      return snap.docs.map(fromDoc)
    },
    async create(data, id) {
      const ref = id ? col.doc(id) : col.doc()
      await ref.set(data)
      return { id: ref.id, ...data }
    },
    async update(id, data) {
      await col.doc(id).update(data)
      return repo.findById(id)
    },
    async remove(id) {
      await col.doc(id).delete()
    },
  }
  return repo
}
