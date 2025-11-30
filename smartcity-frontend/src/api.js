import axios from 'axios'

// Instancia de Axios apuntando al backend Go
export const api = axios.create({
  baseURL: '/api'
})
