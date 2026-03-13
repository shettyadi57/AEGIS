// AEGIS — API Service Layer
import axios from 'axios'

const BASE_URL = 'http://localhost:5000/api'

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('aegis_token')
  }
  return null
}

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('aegis_token')
      localStorage.removeItem('aegis_admin')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

// ─────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────
export const getStudents = async () => {
  const res = await api.get('/students')
  return res.data
}

export const getStudent = async (id: string) => {
  const res = await api.get(`/student/${id}`)
  return res.data
}

export const resetStudentScore = async (id: string) => {
  const res = await api.put(`/student/${id}/reset`)
  return res.data
}

// ─────────────────────────────────────────────
// VIOLATIONS
// ─────────────────────────────────────────────
export const getViolations = async (studentId?: string) => {
  const url = studentId ? `/violations/${studentId}` : '/violations'
  const res = await api.get(url)
  return res.data
}

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
export const getStats = async () => {
  const res = await api.get('/stats')
  return res.data
}

export default api
